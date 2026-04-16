/**
 * getSubscriptionState use-case tests (Story 8.2)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { PurchaseEventRepository } from "@workspace/domain";
import { _resetMockState as resetPurchaseMock } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect } from "effect";
import { getSubscriptionState } from "../get-subscription-state.use-case";

const TestLayer = PurchaseEventDrizzleRepositoryLive;

describe("getSubscriptionState", () => {
	beforeEach(() => {
		resetPurchaseMock();
	});

	it.effect("returns none for user with no events", () =>
		Effect.gen(function* () {
			const result = yield* getSubscriptionState("user-empty");
			expect(result).toEqual({
				subscriptionStatus: "none",
				isEntitledToConversationExtension: false,
				subscribedSince: null,
			});
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns active subscription with subscribedSince ISO", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user-sub",
				eventType: "subscription_started",
				polarSubscriptionId: "polar-sub-1",
				polarCheckoutId: null,
			});

			const result = yield* getSubscriptionState("user-sub");
			expect(result.subscriptionStatus).toBe("active");
			expect(result.isEntitledToConversationExtension).toBe(true);
			expect(result.subscribedSince).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		}).pipe(Effect.provide(TestLayer)),
	);
});
