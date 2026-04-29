/**
 * Get Portrait Status Use Case Tests (queue-based architecture)
 *
 * Tests deriveStatus + read-only polling (assessment-result-driven generating signal).
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AssessmentResultRepository, PortraitRepository } from "@workspace/domain";
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

describe("deriveStatus (assessment-result-driven)", () => {
	it("returns 'none' when portrait is null and result not completed", () => {
		expect(
			deriveStatus({
				portrait: null,
				assessmentResultStage: "scored",
			}),
		).toBe("none");
	});

	it("returns 'generating' when result completed but no portrait row yet", () => {
		expect(
			deriveStatus({
				portrait: null,
				assessmentResultStage: "completed",
			}),
		).toBe("generating");
	});

	it("returns 'ready' when portrait has content", () => {
		const portrait = createMockPortrait({ content: "Your personality portrait..." });
		expect(
			deriveStatus({
				portrait,
				assessmentResultStage: "completed",
			}),
		).toBe("ready");
	});

	it("returns 'failed' when portrait has failedAt", () => {
		const portrait = createMockPortrait({ failedAt: new Date() });
		expect(
			deriveStatus({
				portrait,
				assessmentResultStage: "completed",
			}),
		).toBe("failed");
	});

	it("returns 'none' when portrait is null and no assessment result stage", () => {
		expect(
			deriveStatus({
				portrait: null,
				assessmentResultStage: undefined,
			}),
		).toBe("none");
	});
});

describe("getPortraitStatus Use Case (read-only)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("returns 'generating' when result completed and no portrait row", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "completed" as const }),
			);

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("generating");
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
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "completed" as const }),
			);

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("ready");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'failed' when portrait has failedAt", () =>
		Effect.gen(function* () {
			const portrait = createMockPortrait({ failedAt: new Date() });
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "completed" as const }),
			);

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("failed");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'none' when result exists but not completed yet", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "scored" as const }),
			);

			const result = yield* getPortraitStatus({ sessionId: "session_123" });

			expect(result.status).toBe("none");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
