/**
 * Process Purchase Use Case Tests (Story 13.2 + 13.3)
 *
 * Verifies product mapping, event insertion, duplicate handling,
 * unknown product rejection, and portrait generation triggering.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/purchase-event.drizzle.repository");
vi.mock("@workspace/domain/config/app-config");

// Mock generateFullPortrait to verify forkDaemon calls
vi.mock("../generate-full-portrait.use-case", () => ({
	generateFullPortrait: vi.fn(() => Effect.succeed({ success: true })),
}));

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	PortraitRepository,
} from "@workspace/domain";
import {
	createTestAppConfigLayer,
	mockAppConfig,
} from "@workspace/domain/config/__mocks__/app-config";
import {
	_getPortraitByResultIdAndTier,
	_resetMockState,
} from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { processPurchase } from "../process-purchase.use-case";

// Mock repositories needed for portrait flow
const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	findByToken: vi.fn(),
	assignUserId: vi.fn(),
	rotateToken: vi.fn(),
	incrementMessageCount: vi.fn(),
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
};

const mockPortraitRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	PurchaseEventDrizzleRepositoryLive,
	createTestAppConfigLayer(),
	Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
	Layer.succeed(AssessmentResultRepository, mockResultsRepo),
	Layer.succeed(PortraitRepository, mockPortraitRepo),
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
		// Default mocks: no existing session
		mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(null));
		mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(null));
		mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
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
			// First insert succeeds
			const first = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			// Second insert with same checkoutId should return existing event (idempotent)
			const second = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			expect(second.id).toBe(first.id);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Duplicate webhook detected, checking portrait state",
				expect.objectContaining({ checkoutId: "checkout_abc" }),
			);
		}).pipe(Effect.provide(TestLayer)),
	);
});

describe("processPurchase Portrait Generation (Story 13.3)", () => {
	beforeEach(() => {
		_resetMockState();
		vi.clearAllMocks();
	});

	const mockCompletedSession = {
		id: "session_456",
		userId: "user_123",
		status: "completed",
		sessionToken: "token_abc",
		createdAt: new Date(),
		updatedAt: new Date(),
		messageCount: 20,
		finalizationProgress: null,
		personalDescription: null,
	};

	const mockResult = {
		id: "result_789",
		sessionId: "session_456",
		userId: "user_123",
		facets: {},
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it.effect("should create portrait placeholder when user has completed assessment", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(mockCompletedSession));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));

			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			// Verify portrait placeholder was created
			const portrait = _getPortraitByResultIdAndTier("result_789", "full");
			expect(portrait).toBeDefined();
			expect(portrait?.tier).toBe("full");
			expect(portrait?.content).toBeNull(); // Placeholder
			expect(portrait?.modelUsed).toBe("claude-sonnet-4-6");

			// Verify logging
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Spawning portrait generation daemon",
				expect.objectContaining({ sessionId: "session_456" }),
			);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should skip portrait generation when user has no completed assessment", () =>
		Effect.gen(function* () {
			// User has no completed session
			mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(null));

			const result = yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			expect(result.eventType).toBe("portrait_unlocked");

			// Verify logging about no completed assessment
			expect(mockLogger.info).toHaveBeenCalledWith(
				"No completed assessment found, skipping portrait generation",
				expect.objectContaining({ userId: "user_123" }),
			);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should trigger portrait generation for extended_conversation_unlocked", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(mockCompletedSession));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));

			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductExtendedConversation,
			});

			// Verify portrait placeholder was created
			const portrait = _getPortraitByResultIdAndTier("result_789", "full");
			expect(portrait).toBeDefined();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect(
		"should re-trigger portrait generation on duplicate webhook if portrait incomplete",
		() =>
			Effect.gen(function* () {
				mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(mockCompletedSession));
				mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));

				// First purchase
				yield* processPurchase({
					...baseInput,
					productId: mockAppConfig.polarProductPortraitUnlock,
				});

				// Simulate incomplete portrait from first attempt
				const incompletePortrait = {
					id: "portrait_incomplete",
					assessmentResultId: "result_789",
					tier: "full" as const,
					content: null, // Still generating
					lockedSectionTitles: null,
					modelUsed: "claude-sonnet-4-6",
					retryCount: 1,
					createdAt: new Date(),
				};
				mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(incompletePortrait));

				// Duplicate webhook (retry)
				yield* processPurchase({
					...baseInput,
					productId: mockAppConfig.polarProductPortraitUnlock,
				});

				// Verify re-trigger logging
				expect(mockLogger.info).toHaveBeenCalledWith(
					"Re-triggering portrait generation from duplicate webhook",
					expect.objectContaining({
						portraitId: "portrait_incomplete",
						retryCount: 1,
					}),
				);
			}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should NOT trigger portrait for credit_purchased events", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(mockCompletedSession));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));

			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductRelationshipSingle,
			});

			// Portrait should NOT be created
			const portrait = _getPortraitByResultIdAndTier("result_789", "full");
			expect(portrait).toBeUndefined();
		}).pipe(Effect.provide(TestLayer)),
	);
});
