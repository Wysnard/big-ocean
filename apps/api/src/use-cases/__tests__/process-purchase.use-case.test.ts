/**
 * Process Purchase Use Case Tests (Story 13.2)
 *
 * Verifies product mapping, event insertion, duplicate handling,
 * and unknown product rejection.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");
vi.mock("@workspace/domain/config/app-config");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	createTestAppConfigLayer,
	mockAppConfig,
} from "@workspace/domain/config/__mocks__/app-config";
import { _resetMockState } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { processPurchase } from "../process-purchase.use-case";

const TestLayer = Layer.mergeAll(PurchaseEventDrizzleRepositoryLive, createTestAppConfigLayer());

const baseInput = {
	userId: "user_123",
	checkoutId: "checkout_abc",
	amountCents: 999,
	currency: "usd",
};

describe("processPurchase Use Case", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("should record portrait_unlocked for portrait product", () =>
		Effect.gen(function* () {
			const result = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			expect(result.eventType).toBe("portrait_unlocked");
			expect(result.userId).toBe("user_123");
			expect(result.polarCheckoutId).toBe("checkout_abc");
			expect(result.polarProductId).toBe(mockAppConfig.polarProductPortraitUnlock);
			expect(result.amountCents).toBe(999);
			expect(result.metadata).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should record credit_purchased for single credit product", () =>
		Effect.gen(function* () {
			const result = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductRelationshipSingle,
			});

			expect(result.eventType).toBe("credit_purchased");
			expect(result.metadata).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should record credit_purchased with units=5 for 5-pack product", () =>
		Effect.gen(function* () {
			const result = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductRelationship5Pack,
			});

			expect(result.eventType).toBe("credit_purchased");
			expect(result.metadata).toEqual({ units: 5 });
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should record extended_conversation_unlocked for extended product", () =>
		Effect.gen(function* () {
			const result = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductExtendedConversation,
			});

			expect(result.eventType).toBe("extended_conversation_unlocked");
			expect(result.metadata).toBeNull();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should fail with UnknownProductError for unrecognized product", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				processPurchase({
					...baseInput,
					productId: "unknown_product_xyz",
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const failure = cause._tag === "Fail" ? cause.error : null;
				expect(failure?._tag).toBe("UnknownProductError");
				if (failure?._tag === "UnknownProductError") {
					expect(failure.productId).toBe("unknown_product_xyz");
				}
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should propagate DuplicateCheckoutError on duplicate webhook", () =>
		Effect.gen(function* () {
			// First insert succeeds
			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			// Second insert with same checkoutId should fail
			const exit = yield* Effect.exit(
				processPurchase({
					...baseInput,
					productId: mockAppConfig.polarProductPortraitUnlock,
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const failure = cause._tag === "Fail" ? cause.error : null;
				expect(failure?._tag).toBe("DuplicateCheckoutError");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
