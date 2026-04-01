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
	AssessmentExchangeRepository,
	AssessmentMessageRepository,
	AssessmentResultRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	PortraitRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import {
	createTestAppConfigLayer,
	mockAppConfig,
} from "@workspace/domain/config/__mocks__/app-config";
import { _resetMockState } from "@workspace/infrastructure/repositories/__mocks__/purchase-event.drizzle.repository";
import { PurchaseEventDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/purchase-event.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { processPurchase } from "../process-purchase.use-case";

// Mock repositories needed for portrait flow + extension activation (Story 36-1)
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
	createExtensionSession: vi.fn(),
	findCompletedSessionWithoutChild: vi.fn(),
	hasExtensionSession: vi.fn(),
	findExtensionSession: vi.fn(),
	findDropOffSessions: vi.fn(),
	markDropOffEmailSent: vi.fn(),
};

const mockMessageRepo = {
	saveMessage: vi.fn(() =>
		Effect.succeed({
			id: "msg_mock",
			sessionId: "session_mock",
			role: "assistant",
			content: "mock message",
			createdAt: new Date(),
		}),
	),
	getMessages: vi.fn(),
};

const mockExchangeRepo = {
	create: vi.fn(() =>
		Effect.succeed({ id: "exchange_mock", sessionId: "session_mock", turnNumber: 0 }),
	),
	getBySessionId: vi.fn(),
	getBySessionIdAndTurn: vi.fn(),
	update: vi.fn(),
	getLastExchange: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
};

const mockPortraitRepo = {
	insertWithContent: vi.fn(),
	insertFailed: vi.fn(),
	deleteByResultIdAndTier: vi.fn(),
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
	Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
	Layer.succeed(AssessmentExchangeRepository, mockExchangeRepo),
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
		mockSessionRepo.findCompletedSessionWithoutChild.mockReturnValue(Effect.succeed(null));
		mockSessionRepo.hasExtensionSession.mockReturnValue(Effect.succeed(false));
		mockSessionRepo.findExtensionSession.mockReturnValue(Effect.succeed(null));
		mockSessionRepo.createExtensionSession.mockReturnValue(
			Effect.succeed({ sessionId: "ext_session_mock" }),
		);
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
	};

	const mockResult = {
		id: "result_789",
		sessionId: "session_456",
		userId: "user_123",
		facets: {},
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it.effect("should spawn portrait generation when user has completed assessment", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(mockCompletedSession));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));

			yield* processPurchase({
				...baseInput,
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			// Verify portrait generation daemon was spawned
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

			// Verify portrait generation daemon was spawned
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Spawning portrait generation daemon",
				expect.objectContaining({ sessionId: "session_456" }),
			);
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

					modelUsed: "claude-sonnet-4-6",
					failedAt: null,
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
						sessionId: "session_456",
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

			// Portrait generation daemon should NOT be spawned
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
		// Default: no existing session (portrait flow not needed for credit tests)
		mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(null));
		mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(null));
		mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
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

			// First purchase — gets free credit
			yield* processPurchase({
				...baseInput,
				checkoutId: "checkout_first",
				productId: mockAppConfig.polarProductPortraitUnlock,
			});

			// Second purchase — should NOT get another free credit
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
