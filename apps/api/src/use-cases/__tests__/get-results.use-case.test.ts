/**
 * Get Results Use Case Tests
 *
 * Tests the business logic for retrieving assessment results:
 * - Correct archetype for known facet scores
 * - Session not found error handling
 * - OCEAN code generation from facet scores
 * - Overall confidence computation (mean of all facet confidences)
 */

import {
	ALL_FACETS,
	AssessmentSessionRepository,
	BIG_FIVE_TRAITS,
	type BigFiveTrait,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	type FacetName,
	FacetScoreRepository,
	type FacetScoresMap,
	initializeFacetConfidence,
	LoggerRepository,
	SessionNotFound,
	TraitScoreRepository,
	type TraitScoresMap,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getResults } from "../get-results.use-case";

// ============================================
// Mock Data
// ============================================

const TEST_SESSION_ID = "session_test_results_123";

/**
 * Create facet scores where all facets for a trait have the same score/confidence
 */
function createUniformFacetScores(
	traitScores: Record<BigFiveTrait, { facetScore: number; confidence: number }>,
): FacetScoresMap {
	const map = createInitialFacetScoresMap();
	const traitFacets: Record<BigFiveTrait, FacetName[]> = {
		openness: [
			"imagination",
			"artistic_interests",
			"emotionality",
			"adventurousness",
			"intellect",
			"liberalism",
		],
		conscientiousness: [
			"self_efficacy",
			"orderliness",
			"dutifulness",
			"achievement_striving",
			"self_discipline",
			"cautiousness",
		],
		extraversion: [
			"friendliness",
			"gregariousness",
			"assertiveness",
			"activity_level",
			"excitement_seeking",
			"cheerfulness",
		],
		agreeableness: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
		neuroticism: [
			"anxiety",
			"anger",
			"depression",
			"self_consciousness",
			"immoderation",
			"vulnerability",
		],
	};

	for (const [trait, config] of Object.entries(traitScores)) {
		const facets = traitFacets[trait as BigFiveTrait];
		for (const facet of facets) {
			map[facet] = { score: config.facetScore, confidence: config.confidence };
		}
	}

	return map;
}

/**
 * Create trait scores from uniform facet scores (sum of 6 facets per trait)
 */
function createUniformTraitScores(
	traitConfigs: Record<BigFiveTrait, { facetScore: number; confidence: number }>,
): TraitScoresMap {
	const map = createInitialTraitScoresMap();
	for (const [trait, config] of Object.entries(traitConfigs)) {
		map[trait as BigFiveTrait] = {
			score: config.facetScore * 6, // Sum of 6 facets
			confidence: config.confidence,
		};
	}
	return map;
}

// ============================================
// Mock Repositories
// ============================================

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
};

const mockFacetScoreRepo = {
	getBySession: vi.fn(),
};

const mockTraitScoreRepo = {
	getBySession: vi.fn(),
};

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
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(FacetScoreRepository, mockFacetScoreRepo),
		Layer.succeed(TraitScoreRepository, mockTraitScoreRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

// ============================================
// Tests
// ============================================

describe("getResults Use Case", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default: session exists
		mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
			Effect.succeed({
				id: TEST_SESSION_ID,
				sessionId: TEST_SESSION_ID,
				userId: "user_test",
				createdAt: new Date(),
				updatedAt: new Date(),
				status: "active",
				confidence: initializeFacetConfidence(50),
				messageCount: 10,
			}),
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success scenarios", () => {
		it("should return correct archetype for known high facet scores", async () => {
			// All High: facetScore=15/20 → traitScore=90/120 → level H → OCEAN code "HHHHH"
			const allHigh = {
				openness: { facetScore: 15, confidence: 80 },
				conscientiousness: { facetScore: 15, confidence: 80 },
				extraversion: { facetScore: 15, confidence: 80 },
				agreeableness: { facetScore: 15, confidence: 80 },
				neuroticism: { facetScore: 15, confidence: 80 },
			};

			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformFacetScores(allHigh)),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformTraitScores(allHigh)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.oceanCode5).toBe("HHHHH");
			expect(result.oceanCode4).toBe("HHHH");
			expect(result.archetypeName).toBeDefined();
			expect(result.archetypeName.length).toBeGreaterThan(0);
			expect(result.archetypeDescription).toBeDefined();
			expect(result.archetypeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
			expect(typeof result.isCurated).toBe("boolean");
		});

		it("should return correct OCEAN code for mixed trait levels", async () => {
			// O=High, C=Low, E=Mid, A=High, N=Low
			const mixed = {
				openness: { facetScore: 15, confidence: 85 }, // 90/120 = H
				conscientiousness: { facetScore: 5, confidence: 70 }, // 30/120 = L
				extraversion: { facetScore: 10, confidence: 60 }, // 60/120 = M
				agreeableness: { facetScore: 15, confidence: 75 }, // 90/120 = H
				neuroticism: { facetScore: 3, confidence: 50 }, // 18/120 = L
			};

			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformFacetScores(mixed)),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformTraitScores(mixed)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.oceanCode5).toBe("HLMHL");
			expect(result.oceanCode4).toBe("HLMH");
		});

		it("should compute overall confidence as mean of all facet confidences", async () => {
			// Set specific confidence pattern: 30 facets with varying confidence
			const facetScores = createInitialFacetScoresMap();
			let totalConfidence = 0;

			for (const facet of ALL_FACETS) {
				const confidence = 60; // uniform for easy math
				facetScores[facet] = { score: 10, confidence };
				totalConfidence += confidence;
			}

			const expectedOverallConfidence = Math.round(totalConfidence / ALL_FACETS.length);

			mockFacetScoreRepo.getBySession.mockImplementation(() => Effect.succeed(facetScores));
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createInitialTraitScoresMap()),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.overallConfidence).toBe(expectedOverallConfidence);
			expect(result.overallConfidence).toBe(60);
		});

		it("should return 5 traits with correct structure", async () => {
			const allMid = {
				openness: { facetScore: 10, confidence: 50 },
				conscientiousness: { facetScore: 10, confidence: 50 },
				extraversion: { facetScore: 10, confidence: 50 },
				agreeableness: { facetScore: 10, confidence: 50 },
				neuroticism: { facetScore: 10, confidence: 50 },
			};

			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformFacetScores(allMid)),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformTraitScores(allMid)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.traits).toHaveLength(5);

			for (const trait of result.traits) {
				expect(trait.name).toBeDefined();
				expect(BIG_FIVE_TRAITS).toContain(trait.name);
				expect(typeof trait.score).toBe("number");
				expect(["H", "M", "L"]).toContain(trait.level);
				expect(typeof trait.confidence).toBe("number");
				expect(trait.confidence).toBeGreaterThanOrEqual(0);
				expect(trait.confidence).toBeLessThanOrEqual(100);
			}
		});

		it("should return 30 facets with correct structure", async () => {
			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createInitialFacetScoresMap()),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createInitialTraitScoresMap()),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.facets).toHaveLength(30);

			for (const facet of result.facets) {
				expect(facet.name).toBeDefined();
				expect(facet.name.length).toBeGreaterThan(0);
				expect(facet.traitName).toBeDefined();
				expect(BIG_FIVE_TRAITS).toContain(facet.traitName);
				expect(typeof facet.score).toBe("number");
				expect(facet.score).toBeGreaterThanOrEqual(0);
				expect(facet.score).toBeLessThanOrEqual(20);
				expect(typeof facet.confidence).toBe("number");
			}
		});

		it("should map trait level boundaries correctly", async () => {
			// Test exact boundary values: 0-39=L, 40-79=M, 80-120=H
			const boundaries = {
				openness: { facetScore: 6, confidence: 80 }, // 36/120 = L (< 40)
				conscientiousness: { facetScore: 7, confidence: 80 }, // 42/120 = M (>= 40)
				extraversion: { facetScore: 13, confidence: 80 }, // 78/120 = M (< 80)
				agreeableness: { facetScore: 14, confidence: 80 }, // 84/120 = H (>= 80)
				neuroticism: { facetScore: 20, confidence: 80 }, // 120/120 = H
			};

			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformFacetScores(boundaries)),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformTraitScores(boundaries)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			const traitMap = Object.fromEntries(result.traits.map((t) => [t.name, t]));
			expect(traitMap.openness.level).toBe("L");
			expect(traitMap.conscientiousness.level).toBe("M");
			expect(traitMap.extraversion.level).toBe("M");
			expect(traitMap.agreeableness.level).toBe("H");
			expect(traitMap.neuroticism.level).toBe("H");
		});

		it("should return curated archetype when available", async () => {
			// HHHH = curated archetype "The Catalyst" (per archetypes.ts)
			const allHigh = {
				openness: { facetScore: 15, confidence: 80 },
				conscientiousness: { facetScore: 15, confidence: 80 },
				extraversion: { facetScore: 15, confidence: 80 },
				agreeableness: { facetScore: 15, confidence: 80 },
				neuroticism: { facetScore: 15, confidence: 80 },
			};

			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformFacetScores(allHigh)),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createUniformTraitScores(allHigh)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			// HHHH should be a curated archetype
			expect(result.oceanCode4).toBe("HHHH");
			// Verify the result has all required archetype fields
			expect(result.archetypeName).toBeDefined();
			expect(result.archetypeDescription).toBeDefined();
			expect(result.archetypeColor).toBeDefined();
		});
	});

	describe("Error handling", () => {
		it("should fail with SessionNotFound when session does not exist", async () => {
			mockSessionRepo.getSession.mockImplementation((sessionId: string) =>
				Effect.fail(
					new SessionNotFound({
						sessionId,
						message: "Session not found",
					}),
				),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: "nonexistent_session" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotFound");
		});
	});

	describe("Default scores", () => {
		it("should handle default facet scores (no evidence yet)", async () => {
			// Default scores: all facets at score=10, confidence=0
			mockFacetScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createInitialFacetScoresMap()),
			);
			mockTraitScoreRepo.getBySession.mockImplementation(() =>
				Effect.succeed(createInitialTraitScoresMap()),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			// Default facet score 10 × 6 = 60 per trait → all Mid
			expect(result.oceanCode5).toBe("MMMMM");
			expect(result.overallConfidence).toBe(0); // All facets at confidence 0
		});
	});
});
