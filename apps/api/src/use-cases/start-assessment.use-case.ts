/**
 * Start Assessment Use Case
 *
 * Business logic for starting a new assessment session.
 * Split into authenticated vs anonymous paths:
 * - startAuthenticatedAssessment: existing session check, rate limiting, cost guard
 * - startAnonymousAssessment: direct session creation, no guards
 * - startAssessment: backward-compat wrapper that dispatches based on userId
 */

import { AssessmentAlreadyExists, RateLimitExceeded } from "@workspace/contracts";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	GREETING_MESSAGES,
	getNextDayMidnightUTC,
	LoggerRepository,
	pickOpeningQuestion,
} from "@workspace/domain";
import { DateTime, Effect } from "effect";

export interface StartAssessmentInput {
	readonly userId?: string;
}

export interface StartAssessmentMessage {
	readonly role: "user" | "assistant";
	readonly content: string;
	readonly createdAt: Date;
}

export interface StartAssessmentOutput {
	readonly sessionId: string;
	readonly createdAt: Date;
	readonly messages: StartAssessmentMessage[];
}

export interface StartAnonymousAssessmentOutput extends StartAssessmentOutput {
	readonly sessionToken: string;
}

/**
 * Shared helper: create a new session and persist 2 greeting messages.
 * Used by both authenticated and anonymous paths.
 */
const createSessionWithGreetings = (userId?: string) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;

		const result = yield* sessionRepo.createSession(userId);

		// Build the 2 greeting messages (1 fixed + 1 random opening question)
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		// Persist greeting messages to DB so Nerin has full conversation context
		const savedMessages: StartAssessmentMessage[] = [];
		for (const content of greetingContents) {
			const saved = yield* messageRepo.saveMessage(result.sessionId, "assistant", content);
			savedMessages.push({
				role: "assistant",
				content: saved.content,
				createdAt: saved.createdAt,
			});
		}

		logger.info("Assessment session started", {
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
 * Start Authenticated Assessment
 *
 * For logged-in users: checks for existing session, enforces rate limits,
 * records assessment start, then creates session with greetings.
 *
 * Errors: AssessmentAlreadyExists, RateLimitExceeded, RedisOperationError
 */
export const startAuthenticatedAssessment = (input: { userId: string }) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const costGuard = yield* CostGuardRepository;
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

			// If a completed/paused session exists, block new assessment creation
			logger.warn("User already has an assessment", {
				userId,
				existingSessionId: existing.id,
				status: existing.status,
			});

			return yield* Effect.fail(
				new AssessmentAlreadyExists({
					userId,
					existingSessionId: existing.id,
					message: "You already have an assessment. Only one assessment per account is allowed.",
				}),
			);
		}

		// Check rate limit
		const canStart = yield* costGuard.canStartAssessment(userId);
		if (!canStart) {
			logger.warn("Rate limit exceeded for assessment start", { userId });

			return yield* Effect.fail(
				new RateLimitExceeded({
					userId,
					message: "You can start a new assessment tomorrow",
					resetAt: DateTime.unsafeMake(getNextDayMidnightUTC().getTime()),
				}),
			);
		}

		// Create session with greetings
		const result = yield* createSessionWithGreetings(userId);

		// Record assessment start for rate limiting
		yield* costGuard.recordAssessmentStart(userId);

		return result;
	});

/**
 * Start Anonymous Assessment (Story 9.1)
 *
 * Creates an anonymous session with a cryptographic token for cookie-based auth.
 * Persists greeting messages and returns sessionId + sessionToken.
 * No existing-session check, no rate limiting, no cost guard.
 */
export const startAnonymousAssessment = () =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;

		// Create anonymous session with token
		const { sessionId, sessionToken } = yield* sessionRepo.createAnonymousSession();

		// Build the 2 greeting messages (1 fixed + 1 random opening question)
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		// Persist greeting messages
		const savedMessages: StartAssessmentMessage[] = [];
		for (const content of greetingContents) {
			const saved = yield* messageRepo.saveMessage(sessionId, "assistant", content);
			savedMessages.push({
				role: "assistant",
				content: saved.content,
				createdAt: saved.createdAt,
			});
		}

		logger.info("Anonymous assessment started", {
			sessionId,
			greetingCount: savedMessages.length,
		});

		return {
			sessionId,
			sessionToken,
			createdAt: new Date(),
			messages: savedMessages,
		} satisfies StartAnonymousAssessmentOutput;
	});

/**
 * Start Assessment (backward-compat wrapper)
 *
 * Dispatches to authenticated or anonymous path based on userId presence.
 */
export const startAssessment = (input: StartAssessmentInput) =>
	input.userId ? startAuthenticatedAssessment({ userId: input.userId }) : startAnonymousAssessment();
