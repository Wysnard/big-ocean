/**
 * Get Portrait Status Use Case Tests (Story 13.3)
 *
 * Tests:
 * - deriveStatus pure function for all cases (none, generating, ready, failed)
 * - isStale pure function
 * - Staleness check triggers forkDaemon
 * - Non-stale generating does NOT trigger forkDaemon
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	LoggerRepository,
	PortraitRepository,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { deriveStatus, getPortraitStatus, isStale } from "../get-portrait-status.use-case";

// Mock portrait generator to verify forkDaemon calls
vi.mock("../generate-full-portrait.use-case", () => ({
	generateFullPortrait: vi.fn(() => Effect.succeed({ success: true })),
}));

const mockPortraitRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
	updateLockedSectionTitles: vi.fn(),
};

const mockAssessmentResultRepo = {
	create: vi.fn(),
	update: vi.fn(),
	getBySessionId: vi.fn(() => Effect.succeed(null)),
	getBySessionIdWithMessages: vi.fn(),
	getPublicProfile: vi.fn(),
	getPublicProfileByIdOrUrl: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(PortraitRepository, mockPortraitRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AssessmentResultRepository, mockAssessmentResultRepo),
	);

const createMockPortrait = (overrides: Partial<Portrait> = {}): Portrait => ({
	id: "portrait_123",
	assessmentResultId: "result_456",
	tier: "full",
	content: null,
	lockedSectionTitles: null,
	modelUsed: "claude-sonnet-4-6",
	retryCount: 0,
	createdAt: new Date(),
	...overrides,
});

describe("deriveStatus Pure Function (Story 13.3)", () => {
	it("returns 'none' when portrait is null", () => {
		expect(deriveStatus(null)).toBe("none");
	});

	it("returns 'ready' when portrait has content", () => {
		const portrait = createMockPortrait({ content: "Your personality portrait..." });
		expect(deriveStatus(portrait)).toBe("ready");
	});

	it("returns 'failed' when retryCount >= 3", () => {
		const portrait = createMockPortrait({ retryCount: 3 });
		expect(deriveStatus(portrait)).toBe("failed");
	});

	it("returns 'failed' when retryCount > 3", () => {
		const portrait = createMockPortrait({ retryCount: 5 });
		expect(deriveStatus(portrait)).toBe("failed");
	});

	it("returns 'generating' when content is null and retryCount < 3", () => {
		const portrait = createMockPortrait({ content: null, retryCount: 0 });
		expect(deriveStatus(portrait)).toBe("generating");
	});

	it("returns 'generating' when content is null and retryCount is 2", () => {
		const portrait = createMockPortrait({ content: null, retryCount: 2 });
		expect(deriveStatus(portrait)).toBe("generating");
	});
});

describe("isStale Pure Function (Story 13.3)", () => {
	it("returns true when createdAt is older than 5 minutes", () => {
		const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
		expect(isStale(sixMinutesAgo)).toBe(true);
	});

	it("returns false when createdAt is within 5 minutes", () => {
		const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000);
		expect(isStale(fourMinutesAgo)).toBe(false);
	});

	it("returns false when createdAt is exactly now", () => {
		expect(isStale(new Date())).toBe(false);
	});
});

describe("getPortraitStatus Use Case (Story 13.3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("returns 'none' when no portrait exists", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* getPortraitStatus("session_123");

			expect(result.status).toBe("none");
			expect(result.portrait).toBeNull();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'ready' when portrait has content", () =>
		Effect.gen(function* () {
			const portrait = createMockPortrait({ content: "Your personality portrait..." });
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus("session_123");

			expect(result.status).toBe("ready");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'generating' when portrait has no content and retries < 3", () =>
		Effect.gen(function* () {
			const portrait = createMockPortrait({ content: null, retryCount: 1 });
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus("session_123");

			expect(result.status).toBe("generating");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns 'failed' when retryCount >= 3", () =>
		Effect.gen(function* () {
			const portrait = createMockPortrait({ content: null, retryCount: 3 });
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus("session_123");

			expect(result.status).toBe("failed");
			expect(result.portrait).toEqual(portrait);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("does NOT trigger lazy retry when portrait is not stale", () =>
		Effect.gen(function* () {
			// Portrait created just now - not stale
			const portrait = createMockPortrait({
				content: null,
				retryCount: 0,
				createdAt: new Date(),
			});
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			yield* getPortraitStatus("session_123");

			// Logger should NOT have been called with lazy retry message
			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Triggering lazy retry for stale portrait",
				expect.anything(),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("triggers lazy retry when portrait is stale with retries remaining", () =>
		Effect.gen(function* () {
			// Portrait created 6 minutes ago - stale
			const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
			const portrait = createMockPortrait({
				content: null,
				retryCount: 1,
				createdAt: sixMinutesAgo,
			});
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus("session_123");

			expect(result.status).toBe("generating");
			// Logger should have been called with lazy retry message
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Triggering lazy retry for stale portrait",
				expect.objectContaining({
					portraitId: portrait.id,
					sessionId: "session_123",
					retryCount: 1,
				}),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("does NOT trigger lazy retry when retries exhausted", () =>
		Effect.gen(function* () {
			// Portrait is stale but retries exhausted
			const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
			const portrait = createMockPortrait({
				content: null,
				retryCount: 3,
				createdAt: sixMinutesAgo,
			});
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(portrait));

			const result = yield* getPortraitStatus("session_123");

			// Status should be failed, no retry triggered
			expect(result.status).toBe("failed");
			expect(mockLogger.info).not.toHaveBeenCalledWith(
				"Triggering lazy retry for stale portrait",
				expect.anything(),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("includes teaser data when teaser portrait exists (Story 12.3)", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockAssessmentResultRepo.getBySessionId.mockReturnValue(Effect.succeed({ id: "result_456" }));
			mockPortraitRepo.getByResultIdAndTier.mockReturnValue(
				Effect.succeed(
					createMockPortrait({
						tier: "teaser",
						content: "Your teaser portrait...",
						lockedSectionTitles: ["Title A", "Title B", "Title C"],
					}),
				),
			);

			const result = yield* getPortraitStatus("session_123");

			expect(result.teaser).toEqual({
				content: "Your teaser portrait...",
				lockedSectionTitles: ["Title A", "Title B", "Title C"],
			});
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("teaser is null when no teaser portrait exists (Story 12.3)", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockAssessmentResultRepo.getBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* getPortraitStatus("session_123");

			expect(result.teaser).toBeNull();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("teaser is null when no assessment result exists (Story 12.3)", () =>
		Effect.gen(function* () {
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockAssessmentResultRepo.getBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* getPortraitStatus("session_123");

			expect(result.status).toBe("none");
			expect(result.teaser).toBeNull();
		}).pipe(Effect.provide(createTestLayer())),
	);
});
