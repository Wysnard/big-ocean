/**
 * Activate Conversation Extension Use Case (Story 36-1)
 *
 * Story 46.1 gates the feature in MVP while preserving the implementation seam
 * for post-MVP re-enable work.
 *
 * Idempotency: if the parent session already has a child extension, this use-case
 * will not find an eligible session (findCompletedSessionWithoutChild excludes parents
 * with children) and will fail with SessionNotFound.
 *
 * Dependencies: ConversationRepository, MessageRepository,
 *               ExchangeRepository, LoggerRepository
 */

import { DatabaseError, FeatureUnavailable, SessionNotFound } from "@workspace/contracts";
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
	readonly parentConversationId: string;
	readonly createdAt: Date;
	readonly messages: ActivateConversationExtensionMessage[];
}

export const activateConversationExtension = (
	input: ActivateConversationExtensionInput,
): Effect.Effect<
	ActivateConversationExtensionOutput,
	DatabaseError | FeatureUnavailable | SessionNotFound,
	ConversationRepository | ExchangeRepository | LoggerRepository | MessageRepository
> =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		logger.info("Conversation extension requested while feature is disabled in MVP", {
			userId: input.userId,
		});

		return yield* Effect.fail(
			new FeatureUnavailable({
				feature: "conversation_extension",
				message: "Conversation extension is not available in MVP",
			}),
		);
	});

/**
 * Dormant implementation seam retained for post-MVP subscription work.
 */
const activateConversationExtensionWhenEnabled = (
	input: ActivateConversationExtensionInput,
): Effect.Effect<
	ActivateConversationExtensionOutput,
	DatabaseError | SessionNotFound,
	ConversationRepository | ExchangeRepository | LoggerRepository | MessageRepository
> =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const messageRepo = yield* MessageRepository;
		const exchangeRepo = yield* ExchangeRepository;
		const logger = yield* LoggerRepository;

		const { userId } = input;
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

		const { sessionId } = yield* sessionRepo.createExtensionSession(userId, parentSession.id);
		const openerExchange = yield* exchangeRepo.create(sessionId, 0);
		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

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
			parentConversationId: parentSession.id,
			userId,
			greetingCount: savedMessages.length,
		});

		return {
			sessionId,
			parentConversationId: parentSession.id,
			createdAt: new Date(),
			messages: savedMessages,
		} satisfies ActivateConversationExtensionOutput;
	});

void activateConversationExtensionWhenEnabled;
