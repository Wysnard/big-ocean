/**
 * Activate Conversation Extension Use Case (Story 36-1)
 *
 * Creates a new extension session linked to the user's most recent completed session.
 * Persists greeting messages for the new session.
 *
 * Idempotency: if the parent session already has a child extension, this use-case
 * will not find an eligible session (findCompletedSessionWithoutChild excludes parents
 * with children) and will fail with SessionNotFound.
 *
 * Dependencies: ConversationRepository, MessageRepository,
 *               ExchangeRepository, LoggerRepository
 */

import { SessionNotFound } from "@workspace/contracts";
import {
	ConversationRepository,
	ExchangeRepository,
	GREETING_MESSAGES,
	LoggerRepository,
	MessageRepository,
	pickOpeningQuestion,
} from "@workspace/domain";
import { Effect } from "effect";

export interface ActivateConversationExtensionInput {
	readonly userId: string;
}

export interface ActivateConversationExtensionMessage {
	readonly role: "user" | "assistant";
	readonly content: string;
	readonly createdAt: Date;
}

export interface ActivateConversationExtensionOutput {
	readonly sessionId: string;
	readonly parentSessionId: string;
	readonly createdAt: Date;
	readonly messages: ActivateConversationExtensionMessage[];
}

/**
 * Activate Conversation Extension
 *
 * 1. Find the user's most recent completed session without a child extension.
 * 2. If none found, fail with SessionNotFound.
 * 3. Create a new extension session linked to the parent.
 * 4. Persist greeting messages to the new session.
 * 5. Return the new session data.
 */
export const activateConversationExtension = (input: ActivateConversationExtensionInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const messageRepo = yield* MessageRepository;
		const exchangeRepo = yield* ExchangeRepository;
		const logger = yield* LoggerRepository;

		const { userId } = input;

		// Find eligible parent session
		const parentSession = yield* sessionRepo.findCompletedSessionWithoutChild(userId);

		if (!parentSession) {
			logger.info("No eligible completed session found for extension", { userId });
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: "none",
					message: "No completed session available for extension",
				}),
			);
		}

		// Create extension session
		const { sessionId } = yield* sessionRepo.createExtensionSession(userId, parentSession.id);

		// Create opener exchange (turn 0) for the opening question
		const openerExchange = yield* exchangeRepo.create(sessionId, 0);

		// Build greeting messages (1 greeting bubble + 1 random opening question)
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		// Persist greeting messages to DB
		const savedMessages: ActivateConversationExtensionMessage[] = [];
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

		logger.info("Conversation extension activated", {
			sessionId,
			parentSessionId: parentSession.id,
			userId,
			greetingCount: savedMessages.length,
		});

		return {
			sessionId,
			parentSessionId: parentSession.id,
			createdAt: new Date(),
			messages: savedMessages,
		} satisfies ActivateConversationExtensionOutput;
	});
