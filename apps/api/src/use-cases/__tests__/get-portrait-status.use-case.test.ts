/**
 * Get Portrait Status Use Case Tests (queue-based architecture)
 *
 * Tests:
 * - deriveStatus pure function for all cases (none, generating, ready, failed)
 * - Read-only status polling (no reconciliation, no forkDaemon)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	PortraitRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { deriveStatus, getPortraitStatus } from "../get-portrait-status.use-case";

const mockPortraitRepo = {
	insertWithContent: vi.fn(),
	insertFailed: vi.fn(),
	deleteByResultIdAndTier: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
};

const mockPurchaseRepo = {
	insertEvent: vi.fn(),
	getEventsByUserId: vi.fn(),
	getCapabilities: vi.fn(),
	getByCheckoutId: vi.fn(),
};

const mockResultRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
	getLatestByUserId: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(PortraitRepository, mockPortraitRepo),
		Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
		Layer.succeed(AssessmentResultRepository, mockResultRepo),
	);

const createMockPortrait = (overrides: Partial<Portrait> = {}): Portrait => ({
	id: "portrait_123",
	assessmentResultId: "result_456",
	tier: "full",
	content: null,
	modelUsed: null,
	failedAt: null,
	createdAt: new Date(),
	...overrides,
});

describe("deriveStatus Pure Function (queue-based)", () => {
	it("returns 'none' when portrait is null and no purchase", () => {
		expect(deriveStatus(null, false)).toBe("none");
	});

	it("returns 'generating' when no portrait but purchase exists", () => {
		expect(deriveStatus(null, true)).toBe("generating");
	});

	it("returns 'ready' when portrait has content", () => {
		const portrait = createMockPortrait({ content: "Your personality portrait..." });
		expect(deriveStatus(portrait, true)).toBe("ready");
	});

	it("returns 'failed' when portrait has failedAt", () => {
		const portrait = createMockPortrait({ failedAt: new Date() });
		expect(deriveStatus(portrait, true)).toBe("failed");
	});

	it("returns 'none' when portrait is null and no purchase (explicit false)", () => {
		expect(deriveStatus(null, false)).toBe("none");
	});
});

describe("getPortraitStatus Use Case (queue-based, read-only)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("returns 'none' when no portrait and no userId", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("none");
			expect(result.portrait).toBeNull();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'ready' when portrait has content", () =>
		Effect.gen(function* () {
			const portrait = createMockPortrait({
				content: "Your personality portrait...",
				modelUsed: "test-model",
			});
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("ready");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'generating' when purchase exists for this result but no portrait", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultRepo.getBySessionId.mockReturnValue(Effect.succeed({ id: "result_456" }));
			mockPurchaseRepo.getEventsByUserId.mockReturnValue(
				Effect.succeed([
					{ eventType: "portrait_unlocked", assessmentResultId: "result_456", createdAt: new Date() },
				]),
			);

			const result = yield* getPortraitStatus({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("generating");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'failed' when portrait has failedAt", () =>
		Effect.gen(function* () {
			const portrait = createMockPortrait({ failedAt: new Date() });
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("failed");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'none' when no purchase exists for this result", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultRepo.getBySessionId.mockReturnValue(Effect.succeed({ id: "result_456" }));
			mockPurchaseRepo.getEventsByUserId.mockReturnValue(Effect.succeed([]));

			const result = yield* getPortraitStatus({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("none");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'none' when only extension purchase events exist for this result", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultRepo.getBySessionId.mockReturnValue(Effect.succeed({ id: "result_456" }));
			mockPurchaseRepo.getEventsByUserId.mockReturnValue(
				Effect.succeed([
					{
						eventType: "extended_conversation_unlocked",
						assessmentResultId: "result_456",
						createdAt: new Date(),
					},
				]),
			);

			const result = yield* getPortraitStatus({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("none");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
