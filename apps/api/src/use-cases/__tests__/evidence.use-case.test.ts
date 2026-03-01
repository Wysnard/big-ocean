/**
 * Evidence Use Cases Tests
 *
 * Tests the business logic for retrieving facet evidence:
 * - Get evidence by facet (for Profile → Evidence panel)
 * - Get evidence by message (for Message → Facets panel)
 * - Correct sorting and filtering
 */

import { it } from "@effect/vitest";
import type { FacetName, SavedFacetEvidence } from "@workspace/domain";
import { FacetEvidenceRepository, LoggerRepository } from "@workspace/domain";
// Import noop layer (Story 9.1: facet_evidence table removed in clean-slate migration)
import { FacetEvidenceNoopRepositoryLive } from "@workspace/infrastructure/repositories/facet-evidence.noop.repository";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, vi } from "vitest";
import { getFacetEvidence } from "../get-facet-evidence.use-case";
import { getMessageEvidence } from "../get-message-evidence.use-case";

// ============================================
// Mock Data
// ============================================

const TEST_SESSION_ID = "session_test_evidence_123";
const TEST_MESSAGE_ID_1 = "msg_evidence_001";

const createTestEvidence = (overrides: Partial<SavedFacetEvidence> = {}): SavedFacetEvidence => ({
	id: "evidence_test_001",
	assessmentMessageId: TEST_MESSAGE_ID_1,
	facetName: "imagination",
	score: 16,
	confidence: 85,
	quote: "I love exploring new ideas and creative solutions",
	highlightRange: { start: 0, end: 48 },
	createdAt: new Date("2024-01-01T10:00:00Z"),
	...overrides,
});

// ============================================
// Mock Repositories
// ============================================

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

// ============================================
// Test Layer
// ============================================

const createTestLayer = () =>
	Layer.mergeAll(FacetEvidenceNoopRepositoryLive, Layer.succeed(LoggerRepository, mockLogger));

// ============================================
// Tests
// ============================================

describe("Evidence Use Cases", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getFacetEvidence", () => {
		it.effect("should fetch evidence for a specific facet sorted by createdAt DESC", () =>
			Effect.gen(function* () {
				// Mock repository to return evidence (older first, should be reversed)
				const mockEvidence: SavedFacetEvidence[] = [
					createTestEvidence({
						id: "evidence_001",
						createdAt: new Date("2024-01-01T10:00:00Z"), // Oldest
						facetName: "imagination",
					}),
					createTestEvidence({
						id: "evidence_002",
						createdAt: new Date("2024-01-01T11:00:00Z"), // Middle
						facetName: "imagination",
					}),
					createTestEvidence({
						id: "evidence_003",
						createdAt: new Date("2024-01-01T12:00:00Z"), // Newest
						facetName: "imagination",
					}),
				];

				// Override mock to return test data
				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByFacet").mockReturnValue(Effect.succeed(mockEvidence));

				const result = yield* getFacetEvidence({
					sessionId: TEST_SESSION_ID,
					facetName: "imagination",
				});

				// Should be sorted newest first
				expect(result).toHaveLength(3);
				expect(result[0].id).toBe("evidence_003");
				expect(result[1].id).toBe("evidence_002");
				expect(result[2].id).toBe("evidence_001");

				// Verify logger was called
				expect(mockLogger.info).toHaveBeenCalledWith("Fetching facet evidence", {
					sessionId: TEST_SESSION_ID,
					facetName: "imagination",
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return empty array when no evidence exists", () =>
			Effect.gen(function* () {
				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByFacet").mockReturnValue(Effect.succeed([]));

				const result = yield* getFacetEvidence({
					sessionId: TEST_SESSION_ID,
					facetName: "altruism",
				});

				expect(result).toHaveLength(0);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should filter by facet name correctly", () =>
			Effect.gen(function* () {
				const mockEvidence: SavedFacetEvidence[] = [
					createTestEvidence({
						id: "evidence_001",
						facetName: "imagination",
						createdAt: new Date("2024-01-01T10:00:00Z"),
					}),
					createTestEvidence({
						id: "evidence_002",
						facetName: "imagination",
						createdAt: new Date("2024-01-01T11:00:00Z"),
					}),
				];

				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByFacet").mockReturnValue(Effect.succeed(mockEvidence));

				const result = yield* getFacetEvidence({
					sessionId: TEST_SESSION_ID,
					facetName: "imagination",
				});

				// All results should be for "imagination" facet
				expect(result.every((e) => e.facetName === "imagination")).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("getMessageEvidence", () => {
		it.effect("should fetch all evidence for a specific message sorted by score DESC", () =>
			Effect.gen(function* () {
				// Mock evidence with different scores (should be sorted highest first)
				const mockEvidence: SavedFacetEvidence[] = [
					createTestEvidence({
						id: "evidence_001",
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "imagination" as FacetName,
						score: 12,
					}),
					createTestEvidence({
						id: "evidence_002",
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "altruism" as FacetName,
						score: 18,
					}),
					createTestEvidence({
						id: "evidence_003",
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "emotionality" as FacetName,
						score: 14,
					}),
				];

				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByMessage").mockReturnValue(Effect.succeed(mockEvidence));

				const result = yield* getMessageEvidence({
					assessmentMessageId: TEST_MESSAGE_ID_1,
				});

				// Should be sorted by score descending
				expect(result).toHaveLength(3);
				expect(result[0].score).toBe(18); // altruism
				expect(result[1].score).toBe(14); // emotionality
				expect(result[2].score).toBe(12); // imagination

				// Verify logger was called
				expect(mockLogger.info).toHaveBeenCalledWith("Fetching message evidence", {
					assessmentMessageId: TEST_MESSAGE_ID_1,
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return empty array when message has no evidence", () =>
			Effect.gen(function* () {
				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByMessage").mockReturnValue(Effect.succeed([]));

				const result = yield* getMessageEvidence({
					assessmentMessageId: "nonexistent_message",
				});

				expect(result).toHaveLength(0);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should include all facets detected in message", () =>
			Effect.gen(function* () {
				const mockEvidence: SavedFacetEvidence[] = [
					createTestEvidence({
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "imagination" as FacetName,
						score: 16,
					}),
					createTestEvidence({
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "altruism" as FacetName,
						score: 18,
					}),
					createTestEvidence({
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "emotionality" as FacetName,
						score: 14,
					}),
				];

				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByMessage").mockReturnValue(Effect.succeed(mockEvidence));

				const result = yield* getMessageEvidence({
					assessmentMessageId: TEST_MESSAGE_ID_1,
				});

				// Should have 3 different facets
				const uniqueFacets = new Set(result.map((e) => e.facetName));
				expect(uniqueFacets.size).toBe(3);
				expect(uniqueFacets.has("imagination")).toBe(true);
				expect(uniqueFacets.has("altruism")).toBe(true);
				expect(uniqueFacets.has("emotionality")).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should preserve all evidence fields", () =>
			Effect.gen(function* () {
				const mockEvidence: SavedFacetEvidence[] = [
					createTestEvidence({
						id: "evidence_full_001",
						assessmentMessageId: TEST_MESSAGE_ID_1,
						facetName: "imagination" as FacetName,
						score: 16,
						confidence: 85,
						quote: "I love exploring new ideas",
						highlightRange: { start: 0, end: 27 },
						createdAt: new Date("2024-01-01T10:00:00Z"),
					}),
				];

				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByMessage").mockReturnValue(Effect.succeed(mockEvidence));

				const result = yield* getMessageEvidence({
					assessmentMessageId: TEST_MESSAGE_ID_1,
				});

				expect(result[0]).toMatchObject({
					id: "evidence_full_001",
					assessmentMessageId: TEST_MESSAGE_ID_1,
					facetName: "imagination",
					score: 16,
					confidence: 85,
					quote: "I love exploring new ideas",
					highlightRange: { start: 0, end: 27 },
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should log facet detection count", () =>
			Effect.gen(function* () {
				const mockEvidence: SavedFacetEvidence[] = [
					createTestEvidence({ facetName: "imagination" as FacetName }),
					createTestEvidence({ facetName: "altruism" as FacetName }),
					createTestEvidence({ facetName: "emotionality" as FacetName }),
				];

				const evidenceRepo = yield* FacetEvidenceRepository;
				vi.spyOn(evidenceRepo, "getEvidenceByMessage").mockReturnValue(Effect.succeed(mockEvidence));

				yield* getMessageEvidence({ assessmentMessageId: TEST_MESSAGE_ID_1 });

				// Should log unique facet count
				expect(mockLogger.info).toHaveBeenCalledWith(
					"Message evidence retrieved",
					expect.objectContaining({
						evidenceCount: 3,
						facetsDetected: 3,
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
