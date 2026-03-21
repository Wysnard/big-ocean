/**
 * Reconcile Portrait Purchase Use Case Tests (Story 32-6)
 *
 * Tests:
 * - Auto-insert placeholder when purchase exists but no portrait
 * - No-op when portrait already exists
 * - No-op when no purchase event
 * - Handles missing assessment result gracefully
 * - Idempotent (DuplicatePortraitError caught)
 */

import { vi } from "vitest";

vi.mock("../generate-full-portrait.use-case", () => ({
	generateFullPortrait: vi.fn(() => Effect.succeed({ success: true })),
}));

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	LoggerRepository,
	PortraitRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import { DuplicatePortraitError } from "@workspace/domain/repositories/portrait.repository";
import type { UserCapabilities } from "@workspace/domain/types/purchase.types";
import { Effect, Layer } from "effect";
import { reconcilePortraitPurchase } from "../reconcile-portrait-purchase.use-case";

const mockPurchaseRepo = {
	insertEvent: vi.fn(),
	getEventsByUserId: vi.fn(),
	getCapabilities: vi.fn(),
	getByCheckoutId: vi.fn(),
	insertEventWithPortraitPlaceholder: vi.fn(),
};

const mockPortraitRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
	resetRetryCount: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
	updateStage: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
		Layer.succeed(PortraitRepository, mockPortraitRepo),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

const NO_PORTRAIT_CAPABILITIES: UserCapabilities = {
	availableCredits: 0,
	hasFullPortrait: false,
	hasExtendedConversation: false,
};

const HAS_PORTRAIT_CAPABILITIES: UserCapabilities = {
	availableCredits: 0,
	hasFullPortrait: true,
	hasExtendedConversation: false,
};

const mockResult = {
	id: "result_456",
	assessmentSessionId: "session_123",
	facets: {},
	traits: {},
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("reconcilePortraitPurchase Use Case (Story 32-6)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("creates placeholder and forks daemon when purchase exists but no portrait", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed(HAS_PORTRAIT_CAPABILITIES),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));
			mockPortraitRepo.insertPlaceholder.mockReturnValue(
				Effect.succeed({
					id: "portrait_new",
					assessmentResultId: "result_456",
					tier: "full",
					content: null,
					modelUsed: "claude-sonnet-4-6",
					retryCount: 0,
					createdAt: new Date(),
				}),
			);

			const result = yield* reconcilePortraitPurchase({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.reconciled).toBe(true);
			expect(mockPortraitRepo.insertPlaceholder).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				modelUsed: "claude-sonnet-4-6",
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Portrait reconciliation: inserting placeholder and spawning generation",
				expect.objectContaining({ sessionId: "session_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("is a no-op when portrait already exists", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed(HAS_PORTRAIT_CAPABILITIES),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(
				Effect.succeed({
					id: "portrait_existing",
					assessmentResultId: "result_456",
					tier: "full",
					content: "Some content",
					modelUsed: "claude-sonnet-4-6",
					retryCount: 0,
					createdAt: new Date(),
				}),
			);

			const result = yield* reconcilePortraitPurchase({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.reconciled).toBe(false);
			expect(mockPortraitRepo.insertPlaceholder).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("is a no-op when no purchase event exists", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed(NO_PORTRAIT_CAPABILITIES),
			);

			const result = yield* reconcilePortraitPurchase({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.reconciled).toBe(false);
			expect(mockPortraitRepo.getFullPortraitBySessionId).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("handles missing assessment result gracefully", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed(HAS_PORTRAIT_CAPABILITIES),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* reconcilePortraitPurchase({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.reconciled).toBe(false);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Portrait reconciliation: no assessment result found, skipping",
				expect.objectContaining({ sessionId: "session_123" }),
			);
			expect(mockPortraitRepo.insertPlaceholder).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("catches DuplicatePortraitError as no-op (idempotent)", () =>
		Effect.gen(function* () {
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed(HAS_PORTRAIT_CAPABILITIES),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));
			mockPortraitRepo.insertPlaceholder.mockReturnValue(
				Effect.fail(
					new DuplicatePortraitError({
						assessmentResultId: "result_456",
						tier: "full",
					}),
				),
			);

			const result = yield* reconcilePortraitPurchase({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.reconciled).toBe(false);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Portrait reconciliation: placeholder already exists (concurrent reconciliation)",
				expect.objectContaining({ sessionId: "session_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);
});
