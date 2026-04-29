/**
 * Process Purchase Use Case Tests (Story 13.2 + 13.3)
 *
 * Verifies product mapping, event insertion, duplicate handling,
 * unknown product rejection. Portrait generation is owned by Assessment Finalization (queue + worker).
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");
vi.mock("@workspace/domain/config/app-config");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { LoggerRepository, PurchaseEventRepository } from "@workspace/domain";
import {
	createTestAppConfigLayer,
	mockAppConfig,
} from "@workspace/domain/config/__mocks__/app-config";
import { _resetMockState } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { processPurchase } from "../process-purchase.use-case";

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	PurchaseEventDrizzleRepositoryLive,
	createTestAppConfigLayer(),
	Layer.succeed(LoggerRepository, mockLogger),
);

const baseInput = {
	userId: "user_123",
	checkoutId: "checkout_abc",
	amountCents: 999,
	currency: "usd",
};

describe("processPurchase Use Case", () => {
	beforeEach(() => {
		_resetMockState();
		vi.clearAllMocks();
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

	it.effect("should return existing event on duplicate webhook (idempotent)", () =>
		Effect.gen(function* () {
			const first = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			const second = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			expect(second.id).toBe(first.id);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Duplicate webhook detected, returning existing purchase event",
				expect.objectContaining({ checkoutId: "checkout_abc" }),
			);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("does not spawn portrait generation from purchase flow", () =>
		Effect.gen(function* () {
			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Spawning portrait generation daemon",
				expect.anything(),
			);
		}).pipe(Effect.provide(TestLayer)),
	);
});

describe("processPurchase Free Credit Grant (Story 3.4)", () => {
	beforeEach(() => {
		_resetMockState();
		vi.clearAllMocks();
	});

	it.effect("should grant free_credit_granted on first portrait_unlocked", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;

			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			const events = yield* purchaseRepo.getEventsByUserId("user_123");
			const freeCredits = events.filter((e) => e.eventType === "free_credit_granted");
			expect(freeCredits).toHaveLength(1);
			expect(freeCredits[0].amountCents).toBe(0);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Granted free relationship credit on first portrait purchase",
				expect.objectContaining({ userId: "user_123" }),
			);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should NOT grant free credit when user already has one", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;

			yield* processPurchase({
				...baseInput,
				checkoutId: "checkout_first",
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			yield* processPurchase({
				...baseInput,
				checkoutId: "checkout_second",
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			const events = yield* purchaseRepo.getEventsByUserId("user_123");
			const freeCredits = events.filter((e) => e.eventType === "free_credit_granted");
			expect(freeCredits).toHaveLength(1);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should NOT grant free credit for non-portrait purchases", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;

			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductRelationshipSingle,
			});

			const events = yield* purchaseRepo.getEventsByUserId("user_123");
			const freeCredits = events.filter((e) => e.eventType === "free_credit_granted");
			expect(freeCredits).toHaveLength(0);
		}).pipe(Effect.provide(TestLayer)),
	);
});
