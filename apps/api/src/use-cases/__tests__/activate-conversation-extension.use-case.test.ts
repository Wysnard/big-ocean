/**
 * Activate Conversation Extension Use Case Tests (Story 36-1, Story 8.3)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/conversation.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");
vi.mock("@workspace/domain/config/app-config");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	ConversationRepository,
	LoggerRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import { _resetMockState as _resetSessionMockState } from "@workspace/infrastructure/repositories/__mocks__/conversation.drizzle.repository";
import { _resetMockState as resetPurchaseMock } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { ConversationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect, Layer } from "effect";
import { activateConversationExtension } from "../activate-conversation-extension.use-case";

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const BaseTestLayer = Layer.mergeAll(
	ConversationDrizzleRepositoryLive,
	Layer.succeed(LoggerRepository, mockLogger),
);

describe("activateConversationExtension Use Case", () => {
	beforeEach(() => {
		_resetSessionMockState();
		resetPurchaseMock();
		vi.clearAllMocks();
	});

	it.effect("fails with SubscriptionRequired when user has no subscription entitlement", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* ConversationRepository;
			const created = yield* sessionRepo.createSession("user_123");
			yield* sessionRepo.updateSession(created.sessionId, { status: "completed" });

			const error = yield* activateConversationExtension({ userId: "user_123" }).pipe(Effect.flip);

			expect(error._tag).toBe("SubscriptionRequired");
		}).pipe(Effect.provide(Layer.mergeAll(BaseTestLayer, PurchaseEventDrizzleRepositoryLive))),
	);

	it.effect(
		"creates extension session and greetings when entitled and a completed parent exists",
		() =>
			Effect.gen(function* () {
				const purchaseRepo = yield* PurchaseEventRepository;
				yield* purchaseRepo.insertEvent({
					userId: "user_sub",
					eventType: "subscription_started",
					polarSubscriptionId: "polar-sub-1",
					polarCheckoutId: null,
				});

				const sessionRepo = yield* ConversationRepository;
				const created = yield* sessionRepo.createSession("user_sub");
				yield* sessionRepo.updateSession(created.sessionId, { status: "completed" });

				const result = yield* activateConversationExtension({ userId: "user_sub" });

				expect(result.sessionId).toBeDefined();
				expect(result.parentConversationId).toBe(created.sessionId);
				expect(result.messages.length).toBeGreaterThan(0);
			}).pipe(Effect.provide(Layer.mergeAll(BaseTestLayer, PurchaseEventDrizzleRepositoryLive))),
	);

	it.effect("fails with SessionNotFound when entitled but no eligible parent conversation", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user_no_parent",
				eventType: "subscription_started",
				polarSubscriptionId: "polar-sub-2",
				polarCheckoutId: null,
			});

			const error = yield* activateConversationExtension({ userId: "user_no_parent" }).pipe(
				Effect.flip,
			);

			expect(error._tag).toBe("SessionNotFound");
		}).pipe(Effect.provide(Layer.mergeAll(BaseTestLayer, PurchaseEventDrizzleRepositoryLive))),
	);
});
