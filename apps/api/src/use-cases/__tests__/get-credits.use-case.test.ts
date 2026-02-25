/**
 * Get Credits Use Case Tests (Story 14.1)
 *
 * Verifies credit balance derivation and assessment completion check.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AssessmentSessionRepository, PurchaseEventRepository } from "@workspace/domain";
import { _resetMockState as resetSessionMock } from "@workspace/infrastructure/repositories/__mocks__/assessment-session.drizzle.repository";
import { _resetMockState as resetPurchaseMock } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { AssessmentSessionDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect, Layer } from "effect";
import { getCredits } from "../get-credits.use-case";

const TestLayer = Layer.mergeAll(
	PurchaseEventDrizzleRepositoryLive,
	AssessmentSessionDrizzleRepositoryLive,
);

describe("getCredits", () => {
	beforeEach(() => {
		resetPurchaseMock();
		resetSessionMock();
	});

	it.effect("returns 0 credits and no assessment for user with no events", () =>
		Effect.gen(function* () {
			const result = yield* getCredits("user-no-events");
			expect(result).toEqual({
				availableCredits: 0,
				hasCompletedAssessment: false,
			});
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns 1 credit for user with free_credit_granted", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;
			yield* purchaseRepo.insertEvent({
				userId: "user-free",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-free",
			});

			const result = yield* getCredits("user-free");
			expect(result.availableCredits).toBe(1);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns correct count for purchased credits", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;

			// Free credit
			yield* purchaseRepo.insertEvent({
				userId: "user-buyer",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-buyer",
			});

			// 5-pack purchase
			yield* purchaseRepo.insertEvent({
				userId: "user-buyer",
				eventType: "credit_purchased",
				polarCheckoutId: "checkout-123",
				metadata: { units: 5 },
			});

			const result = yield* getCredits("user-buyer");
			expect(result.availableCredits).toBe(6); // 1 free + 5 purchased
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns correct remaining count after consumption", () =>
		Effect.gen(function* () {
			const purchaseRepo = yield* PurchaseEventRepository;

			yield* purchaseRepo.insertEvent({
				userId: "user-consumed",
				eventType: "free_credit_granted",
				polarCheckoutId: "free-credit-user-consumed",
			});

			yield* purchaseRepo.insertEvent({
				userId: "user-consumed",
				eventType: "credit_consumed",
				polarCheckoutId: "consume-1",
			});

			const result = yield* getCredits("user-consumed");
			expect(result.availableCredits).toBe(0); // 1 - 1 = 0
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("detects completed assessment", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;

			// Create a session and mark it completed
			const { sessionId } = yield* sessionRepo.createSession("user-assessed");
			yield* sessionRepo.updateSession(sessionId, { status: "completed" } as never);

			const result = yield* getCredits("user-assessed");
			expect(result.hasCompletedAssessment).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns hasCompletedAssessment false when only active sessions exist", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;
			yield* sessionRepo.createSession("user-active");

			const result = yield* getCredits("user-active");
			expect(result.hasCompletedAssessment).toBe(false);
		}).pipe(Effect.provide(TestLayer)),
	);
});
