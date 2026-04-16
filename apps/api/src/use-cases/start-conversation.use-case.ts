/**
 * Start Conversation Use Case
 *
 * Business logic for starting a new conversation session.
 * Split into authenticated vs anonymous paths:
 * - startAuthenticatedConversation: existing session check, rate limiting, cost guard
 * - startAnonymousConversation: direct session creation, no guards
 * - startConversation: backward-compat wrapper that dispatches based on userId
 */

import { ConversationAlreadyExists } from "@workspace/contracts";
import {
	AppConfig,
	ConversationRepository,
	CostGuardRepository,
	CostLimitExceeded,
	ExchangeRepository,
	GREETING_MESSAGES,
	isEntitledTo,
	LoggerRepository,
	MessageRepository,
	PurchaseEventRepository,
	pickOpeningQuestion,
} from "@workspace/domain";
import { DateTime, Effect } from "effect";

export interface StartConversationInput {
	readonly userId?: string;
}

export interface StartConversationMessage {
	readonly role: "user" | "assistant";
	readonly content: string;
	readonly createdAt: Date;
}

export interface StartConversationOutput {
	readonly sessionId: string;
	readonly createdAt: Date;
	readonly messages: StartConversationMessage[];
}

export interface StartAnonymousConversationOutput extends StartConversationOutput {
	readonly sessionToken: string;
}

/**
 * Shared helper: create a new session and persist greeting messages.
 * Used by both authenticated and anonymous paths.
 */
const createSessionWithGreetings = (userId?: string) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const messageRepo = yield* MessageRepository;
		const exchangeRepo = yield* ExchangeRepository;
		const logger = yield* LoggerRepository;

		const result = yield* sessionRepo.createSession(userId);

		// Create opener exchange (turn 0) for the opening question
		const openerExchange = yield* exchangeRepo.create(result.sessionId, 0);

		// Build greeting messages (1 greeting bubble + 1 random opening question)
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		// Persist greeting messages to DB so Nerin has full conversation context
		// Greeting bubble: exchangeId = null (pure greeting, not a question)
		// Opening question: exchangeId = opener exchange (this is the AI question)
		const savedMessages: StartConversationMessage[] = [];
		for (const [i, content] of greetingContents.entries()) {
			const isOpeningQuestion = i === greetingContents.length - 1;
			const saved = yield* messageRepo.saveMessage(
				result.sessionId,
				"assistant",
				content,
				isOpeningQuestion ? openerExchange.id : undefined,
			);
			savedMessages.push({
				role: "assistant",
				content: saved.content,
				createdAt: saved.createdAt,
			});
		}

		logger.info("Conversation session started", {
			sessionId: result.sessionId,
			userId,
			greetingCount: savedMessages.length,
		});

		return {
			sessionId: result.sessionId,
			createdAt: new Date(),
			messages: savedMessages,
		};
	});

/**
 * Start Authenticated Conversation
 *
 * For logged-in users: checks for existing session, enforces rate limits,
 * records conversation start, then creates session with greetings.
 *
 * Errors: ConversationAlreadyExists, CostLimitExceeded, GlobalAssessmentLimitReached, DatabaseError
 */
export const startAuthenticatedConversation = (input: { userId: string }) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const messageRepo = yield* MessageRepository;
		const costGuard = yield* CostGuardRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		const { userId } = input;

		// Check for existing session
		const existing = yield* sessionRepo.findSessionByUserId(userId);

		if (existing) {
			// If active session exists, return it so the user can resume
			if (existing.status === "active") {
				logger.info("Returning existing active session", {
					sessionId: existing.id,
					userId,
				});

				const existingMessages = yield* messageRepo.getMessages(existing.id);

				return {
					sessionId: existing.id,
					createdAt: existing.createdAt,
					messages: existingMessages.map((msg) => ({
						role: msg.role,
						content: msg.content,
						createdAt: msg.createdAt,
					})),
				};
			}

			// If a completed/paused session exists, block new conversation creation
			logger.warn("User already has a conversation", {
				userId,
				existingSessionId: existing.id,
				status: existing.status,
			});

			return yield* Effect.fail(
				new ConversationAlreadyExists({
					userId,
					existingSessionId: existing.id,
					message: "You already have a conversation. Only one conversation per account is allowed.",
				}),
			);
		}

		// Global circuit breaker check (Story 15.3) — fail-open on Redis errors
		yield* costGuard.checkAndRecordGlobalAssessmentStart().pipe(
			Effect.catchTag("RedisOperationError", (err) =>
				Effect.sync(() => {
					logger.warn("Redis unavailable for global limit check, allowing", {
						error: err.message,
					});
				}),
			),
		);

		// Daily budget check at session boundary (Story 31-6, FR56/NFR18)
		// Budget enforcement happens here, not mid-conversation
		yield* costGuard.checkDailyBudget(userId, config.dailyCostLimit * 100).pipe(
			Effect.catchTag("RedisOperationError", (err) =>
				Effect.sync(() => {
					logger.warn("Redis unavailable for budget check, allowing", {
						error: err.message,
						userId,
					});
				}),
			),
		);

		// Free-tier LLM pause (Story 11-1) — session boundary only; fail-open on Redis
		const purchaseRepo = yield* PurchaseEventRepository;
		const purchaseEvents = yield* purchaseRepo.getEventsByUserId(userId);
		if (!isEntitledTo(purchaseEvents, "conversation_extension")) {
			const paused = yield* costGuard.getFreeTierLlmPaused().pipe(
				Effect.catchTag("RedisOperationError", (err) =>
					Effect.sync(() => {
						logger.warn("Redis unavailable for free_tier_llm_paused check, allowing start", {
							message: err.message,
							userId,
						});
						return false;
					}),
				),
			);
			if (paused) {
				const resumeAfter = DateTime.unsafeMake(Date.now() + config.costGuardRetryAfterSeconds * 1000);
				return yield* Effect.fail(
					new CostLimitExceeded({
						dailySpend: 0,
						limit: 0,
						resumeAfter,
						message: "Nerin is temporarily unavailable due to high demand. Please try again shortly.",
						reason: "circuit_breaker",
					}),
				);
			}
		}

		// Create session with greetings
		const result = yield* createSessionWithGreetings(userId);

		return result;
	});

/**
 * Start Anonymous Conversation (Story 9.1)
 *
 * Creates an anonymous session with a cryptographic token for cookie-based auth.
 * Persists greeting messages and returns sessionId + sessionToken.
 * No existing-session check, no rate limiting, no cost guard.
 */
export const startAnonymousConversation = () =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const messageRepo = yield* MessageRepository;
		const costGuard = yield* CostGuardRepository;
		const _config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// Global circuit breaker check (Story 15.3) — fail-open on Redis errors
		yield* costGuard.checkAndRecordGlobalAssessmentStart().pipe(
			Effect.catchTag("RedisOperationError", (err) =>
				Effect.sync(() => {
					logger.warn("Redis unavailable for global limit check, allowing", {
						error: err.message,
					});
				}),
			),
		);

		// Create anonymous session with token
		const { sessionId, sessionToken } = yield* sessionRepo.createAnonymousSession();

		// Create opener exchange (turn 0) for the opening question
		const exchangeRepo = yield* ExchangeRepository;
		const openerExchange = yield* exchangeRepo.create(sessionId, 0);

		// Build greeting messages (1 greeting bubble + 1 random opening question)
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		// Persist greeting messages
		// Greeting bubbles: exchangeId = null (pure greeting, not a question)
		// Opening question: exchangeId = opener exchange (this is the AI question)
		const savedMessages: StartConversationMessage[] = [];
		for (const [i, content] of greetingContents.entries()) {
			const isOpeningQuestion = i === greetingContents.length - 1;
			const saved = yield* messageRepo.saveMessage(
				sessionId,
				"assistant",
				content,
				isOpeningQuestion ? openerExchange.id : undefined,
			);
			savedMessages.push({
				role: "assistant",
				content: saved.content,
				createdAt: saved.createdAt,
			});
		}

		logger.info("Anonymous conversation started", {
			sessionId,
			greetingCount: savedMessages.length,
		});

		return {
			sessionId,
			sessionToken,
			createdAt: new Date(),
			messages: savedMessages,
		} satisfies StartAnonymousConversationOutput;
	});

/**
 * Start Conversation (backward-compat wrapper)
 *
 * Dispatches to authenticated or anonymous path based on userId presence.
 */
export const startConversation = (input: StartConversationInput) =>
	input.userId
		? startAuthenticatedConversation({ userId: input.userId })
		: startAnonymousConversation();
