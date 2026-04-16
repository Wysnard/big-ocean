/**
 * Activate Conversation Extension Use Case (Story 36-1, Story 8.3)
 *
 * Subscription entitlement (Story 8.1) gates activation; session fork reuses
 * parent link + greetings (Story 36-1).
 *
 * Idempotency: if the parent session already has a child extension, this use-case
 * will not find an eligible session (findCompletedSessionWithoutChild excludes parents
 * with children) and will fail with SessionNotFound.
 *
 * Dependencies: PurchaseEventRepository, ConversationRepository, LoggerRepository
 */

import {
	ConcurrentMessageError,
	DatabaseError,
	SessionNotFound,
	SubscriptionRequired,
} from "@workspace/contracts";
import {
	ConversationRepository,
	GREETING_MESSAGES,
	isEntitledTo,
	LoggerRepository,
	PurchaseEventRepository,
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

const createExtensionSessionAndGreetings = (
	input: ActivateConversationExtensionInput,
): Effect.Effect<
	ActivateConversationExtensionOutput,
	DatabaseError | SessionNotFound,
	ConversationRepository | LoggerRepository
> =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
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

		const openingQuestion = pickOpeningQuestion();
		const greetingContents = [...GREETING_MESSAGES, openingQuestion];

		const { sessionId, messages } = yield* sessionRepo.createExtensionSessionWithInitialTurn(
			userId,
			parentSession.id,
			greetingContents,
		);

		logger.info("Conversation extension activated", {
			sessionId,
			parentConversationId: parentSession.id,
			userId,
			greetingCount: messages.length,
		});

		return {
			sessionId,
			parentConversationId: parentSession.id,
			createdAt: new Date(),
			messages: [...messages],
		} satisfies ActivateConversationExtensionOutput;
	});

export const activateConversationExtension = (
	input: ActivateConversationExtensionInput,
): Effect.Effect<
	ActivateConversationExtensionOutput,
	ConcurrentMessageError | DatabaseError | SessionNotFound | SubscriptionRequired,
	ConversationRepository | LoggerRepository | PurchaseEventRepository
> =>
	Effect.gen(function* () {
		const purchaseRepo = yield* PurchaseEventRepository;
		const sessionRepo = yield* ConversationRepository;
		const events = yield* purchaseRepo.getEventsByUserId(input.userId);

		if (!isEntitledTo(events, "conversation_extension")) {
			return yield* Effect.fail(
				new SubscriptionRequired({
					feature: "conversation_extension",
					message: "An active subscription is required to extend your conversation",
				}),
			);
		}

		const activateLockKey = `extension-activation:${input.userId}`;
		yield* sessionRepo.acquireSessionLock(activateLockKey);

		return yield* createExtensionSessionAndGreetings(input).pipe(
			Effect.ensuring(sessionRepo.releaseSessionLock(activateLockKey).pipe(Effect.orDie)),
		);
	});
