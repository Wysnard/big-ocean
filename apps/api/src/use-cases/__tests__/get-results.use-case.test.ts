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
	AppConfig,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	BIG_FIVE_TRAITS,
	type BigFiveTrait,
	FacetEvidenceRepository,
	type FacetName,
	LoggerRepository,
	PortraitGenerationError,
	PortraitGeneratorRepository,
	type SavedFacetEvidence,
	SessionNotFound,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getResults } from "../get-results.use-case";

// ============================================
// Mock Data
// ============================================

const TEST_SESSION_ID = "session_test_results_123";

/**
 * Trait-to-facets mapping for helper functions
 */
const TRAIT_FACETS: Record<BigFiveTrait, FacetName[]> = {
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

/**
 * Create a SavedFacetEvidence record for a single facet.
 *
 * With a single evidence item per facet, the aggregateFacetScores function
 * will return exactly the input score and confidence (no averaging needed).
 */
function createEvidenceRecord(
	facetName: FacetName,
	score: number,
	confidence: number,
	messageIndex = 0,
): SavedFacetEvidence {
	return {
		id: `evidence_${facetName}_${messageIndex}`,
		assessmentMessageId: `msg_${messageIndex}`,
		facetName,
		score,
		confidence,
		quote: `Test quote for ${facetName}`,
		highlightRange: { start: 0, end: 20 },
		createdAt: new Date(Date.now() + messageIndex * 1000), // Ensure ordering
	};
}

/**
 * Create evidence records that will produce uniform facet scores per trait.
 *
 * For each trait, creates one evidence record per facet with the specified score and confidence.
 * When processed by aggregateFacetScores(), this produces facetScore = score, confidence = confidence.
 */
function createEvidenceForUniformScores(
	traitScores: Record<BigFiveTrait, { facetScore: number; confidence: number }>,
): SavedFacetEvidence[] {
	const evidence: SavedFacetEvidence[] = [];
	let messageIndex = 0;

	for (const [trait, config] of Object.entries(traitScores)) {
		const facets = TRAIT_FACETS[trait as BigFiveTrait];
		for (const facet of facets) {
			evidence.push(createEvidenceRecord(facet, config.facetScore, config.confidence, messageIndex));
			messageIndex++;
		}
	}

	return evidence;
}

/**
 * Create evidence for all 30 facets with the same score and confidence.
 *
 * Used for testing uniform confidence calculations.
 */
function createUniformEvidence(score: number, confidence: number): SavedFacetEvidence[] {
	return ALL_FACETS.map((facet, idx) => createEvidenceRecord(facet, score, confidence, idx));
}

// ============================================
// Mock Repositories
// ============================================

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
};

const mockEvidenceRepo = {
	saveEvidence: vi.fn(),
	getEvidenceByMessage: vi.fn(),
	getEvidenceByFacet: vi.fn(),
	getEvidenceBySession: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

const mockPortraitGenerator = {
	generatePortrait: vi.fn(),
};

const mockConfig = {
	databaseUrl: "postgres://test",
	redisUrl: "redis://test",
	anthropicApiKey: Redacted.make("test-key"),
	betterAuthSecret: Redacted.make("test-secret"),
	betterAuthUrl: "http://localhost:4000",
	frontendUrl: "http://localhost:3000",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "claude-sonnet-4-20250514",
	analyzerMaxTokens: 4096,
	analyzerTemperature: 0.2,
	nerinModelId: "claude-sonnet-4-20250514",
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	dailyCostLimit: 75,
	freeTierMessageThreshold: 12,
	shareMinConfidence: 30,
};

// ============================================
// Test Layer
// ============================================

function createTestLayer() {
	return Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(FacetEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
		Layer.succeed(PortraitGeneratorRepository, mockPortraitGenerator),
		Layer.succeed(AppConfig, mockConfig),
		Layer.succeed(LoggerRepository, mockLogger),
	);
}

// ============================================
// Tests
// ============================================

describe("getResults Use Case", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default: session exists with no portrait
		mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
			Effect.succeed({
				id: TEST_SESSION_ID,
				sessionId: TEST_SESSION_ID,
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				status: "active",
				messageCount: 10,
				personalDescription: null,
			}),
		);

		// Default: no messages (portrait won't trigger below threshold)
		mockMessageRepo.getMessages.mockImplementation(() => Effect.succeed([]));

		// Default: portrait generator returns a string
		mockPortraitGenerator.generatePortrait.mockImplementation(() =>
			Effect.succeed("Mock portrait text"),
		);

		// Default: updateSession succeeds
		mockSessionRepo.updateSession.mockImplementation(
			(_id: string, partial: Record<string, unknown>) => Effect.succeed({ id: _id, ...partial }),
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success scenarios", () => {
		it("should return correct archetype for known high facet scores", async () => {
			// All High: facetScore=15/20 -> traitScore=90/120 -> level High -> OCEAN code "ODEWS"
			const allHigh = {
				openness: { facetScore: 15, confidence: 80 },
				conscientiousness: { facetScore: 15, confidence: 80 },
				extraversion: { facetScore: 15, confidence: 80 },
				agreeableness: { facetScore: 15, confidence: 80 },
				neuroticism: { facetScore: 15, confidence: 80 },
			};

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createEvidenceForUniformScores(allHigh)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.oceanCode5).toBe("ODEWS");
			expect(result.oceanCode4).toBe("ODEW");
			expect(result.archetypeName).toBeDefined();
			expect(result.archetypeName.length).toBeGreaterThan(0);
			expect(result.archetypeDescription).toBeDefined();
			expect(result.archetypeColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
			expect(typeof result.isCurated).toBe("boolean");
		});

		it("should return correct OCEAN code for mixed trait levels", async () => {
			// O=High→O, C=Low→F, E=Mid→A, A=High→W, N=Low→R
			const mixed = {
				openness: { facetScore: 15, confidence: 85 }, // 90/120 = High → O
				conscientiousness: { facetScore: 5, confidence: 70 }, // 30/120 = Low → F
				extraversion: { facetScore: 10, confidence: 60 }, // 60/120 = Mid → A
				agreeableness: { facetScore: 15, confidence: 75 }, // 90/120 = High → W
				neuroticism: { facetScore: 3, confidence: 50 }, // 18/120 = Low → R
			};

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createEvidenceForUniformScores(mixed)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.oceanCode5).toBe("OFAWR");
			expect(result.oceanCode4).toBe("OFAW");
		});

		it("should compute overall confidence as mean of all facet confidences", async () => {
			// Set specific confidence pattern: 30 facets with uniform confidence
			const uniformEvidence = createUniformEvidence(10, 60);

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed(uniformEvidence));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

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

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createEvidenceForUniformScores(allMid)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.traits).toHaveLength(5);

			for (const trait of result.traits) {
				expect(trait.name).toBeDefined();
				expect(BIG_FIVE_TRAITS).toContain(trait.name);
				expect(typeof trait.score).toBe("number");
				expect("PGOFBDIAECNWRTS").toContain(trait.level);
				expect(typeof trait.confidence).toBe("number");
				expect(trait.confidence).toBeGreaterThanOrEqual(0);
				expect(trait.confidence).toBeLessThanOrEqual(100);
			}
		});

		it("should return 30 facets with correct structure", async () => {
			// Empty evidence returns default scores (score=10, confidence=0)
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

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
			// Test exact boundary values: 0-39=Low, 40-79=Mid, 80-120=High
			const boundaries = {
				openness: { facetScore: 6, confidence: 80 }, // 36/120 = Low → P
				conscientiousness: { facetScore: 7, confidence: 80 }, // 42/120 = Mid → B
				extraversion: { facetScore: 13, confidence: 80 }, // 78/120 = Mid → A
				agreeableness: { facetScore: 14, confidence: 80 }, // 84/120 = High → W
				neuroticism: { facetScore: 20, confidence: 80 }, // 120/120 = High → S
			};

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createEvidenceForUniformScores(boundaries)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			const traitMap = Object.fromEntries(result.traits.map((t) => [t.name, t]));
			expect(traitMap.openness.level).toBe("P");
			expect(traitMap.conscientiousness.level).toBe("B");
			expect(traitMap.extraversion.level).toBe("A");
			expect(traitMap.agreeableness.level).toBe("W");
			expect(traitMap.neuroticism.level).toBe("S");
		});

		it("should return curated archetype when available", async () => {
			// ODEW = curated archetype "The Idealist" (per archetypes.ts)
			const allHigh = {
				openness: { facetScore: 15, confidence: 80 },
				conscientiousness: { facetScore: 15, confidence: 80 },
				extraversion: { facetScore: 15, confidence: 80 },
				agreeableness: { facetScore: 15, confidence: 80 },
				neuroticism: { facetScore: 15, confidence: 80 },
			};

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createEvidenceForUniformScores(allHigh)),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			// ODEW should be a curated archetype
			expect(result.oceanCode4).toBe("ODEW");
			// Verify the result has all required archetype fields
			expect(result.archetypeName).toBeDefined();
			expect(result.archetypeDescription).toBeDefined();
			expect(result.archetypeColor).toBeDefined();
		});
	});

	describe("Error handling", () => {
		it("should fail with SessionNotFound when linked session is accessed by non-owner", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active",
					messageCount: 10,
					personalDescription: null,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "another_user" }).pipe(
					Effect.provide(createTestLayer()),
					Effect.flip,
				),
			);

			expect(error._tag).toBe("SessionNotFound");
			expect(mockEvidenceRepo.getEvidenceBySession).not.toHaveBeenCalled();
		});

		it("should fail with SessionNotFound when linked session is accessed without authentication", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active",
					messageCount: 10,
					personalDescription: null,
				}),
			);

			const error = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer()), Effect.flip),
			);

			expect(error._tag).toBe("SessionNotFound");
			expect(mockEvidenceRepo.getEvidenceBySession).not.toHaveBeenCalled();
		});

		it("should allow linked session access for owner", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active",
					messageCount: 10,
					personalDescription: null,
				}),
			);
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
				),
			);

			expect(result.oceanCode5).toBeDefined();
			expect(mockEvidenceRepo.getEvidenceBySession).toHaveBeenCalledWith(TEST_SESSION_ID);
		});

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

	describe("Portrait generation", () => {
		it("should generate portrait on first call when threshold met and personalDescription is null", async () => {
			const PORTRAIT_TEXT = "You are a thoughtful person...";
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createUniformEvidence(15, 80)),
			);

			// 12 user messages — at threshold
			mockMessageRepo.getMessages.mockImplementation(() =>
				Effect.succeed(
					Array.from({ length: 12 }, (_, i) => ({
						id: `msg_${i}`,
						sessionId: TEST_SESSION_ID,
						role: "user",
						content: `Message ${i}`,
						createdAt: new Date(),
					})),
				),
			);

			mockPortraitGenerator.generatePortrait.mockImplementation(() => Effect.succeed(PORTRAIT_TEXT));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.personalDescription).toBe(PORTRAIT_TEXT);
			expect(mockPortraitGenerator.generatePortrait).toHaveBeenCalledTimes(1);
			expect(mockSessionRepo.updateSession).toHaveBeenCalledWith(TEST_SESSION_ID, {
				personalDescription: PORTRAIT_TEXT,
			});
		});

		it("should return stored portrait without regeneration when personalDescription exists", async () => {
			const STORED_PORTRAIT = "Previously generated portrait text.";
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active",
					messageCount: 10,
					personalDescription: STORED_PORTRAIT,
				}),
			);
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createUniformEvidence(15, 80)),
			);
			// Messages above threshold — but portrait already exists, so should NOT regenerate
			mockMessageRepo.getMessages.mockImplementation(() =>
				Effect.succeed(
					Array.from({ length: 15 }, (_, i) => ({
						id: `msg_${i}`,
						sessionId: TEST_SESSION_ID,
						role: "user",
						content: `Message ${i}`,
						createdAt: new Date(),
					})),
				),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.personalDescription).toBe(STORED_PORTRAIT);
			expect(mockPortraitGenerator.generatePortrait).not.toHaveBeenCalled();
		});

		it("should return personalDescription null when below message threshold", async () => {
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createUniformEvidence(15, 80)),
			);
			// Only 5 user messages — below freeTierMessageThreshold (12)
			mockMessageRepo.getMessages.mockImplementation(() =>
				Effect.succeed(
					Array.from({ length: 5 }, (_, i) => ({
						id: `msg_${i}`,
						sessionId: TEST_SESSION_ID,
						role: "user",
						content: `Message ${i}`,
						createdAt: new Date(),
					})),
				),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.personalDescription).toBeNull();
			expect(mockPortraitGenerator.generatePortrait).not.toHaveBeenCalled();
		});

		it("should return personalDescription null when portrait generation fails (graceful degradation)", async () => {
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() =>
				Effect.succeed(createUniformEvidence(15, 80)),
			);
			mockMessageRepo.getMessages.mockImplementation(() =>
				Effect.succeed(
					Array.from({ length: 12 }, (_, i) => ({
						id: `msg_${i}`,
						sessionId: TEST_SESSION_ID,
						role: "user",
						content: `Message ${i}`,
						createdAt: new Date(),
					})),
				),
			);
			// Portrait generator fails
			mockPortraitGenerator.generatePortrait.mockImplementation(() =>
				Effect.fail(
					new PortraitGenerationError({
						sessionId: TEST_SESSION_ID,
						message: "Claude API timeout",
					}),
				),
			);

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.personalDescription).toBeNull();
			expect(mockPortraitGenerator.generatePortrait).toHaveBeenCalledTimes(1);
			// updateSession should NOT be called since portrait generation failed
			expect(mockSessionRepo.updateSession).not.toHaveBeenCalled();
			// Error should be logged
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Portrait generation failed",
				expect.objectContaining({ sessionId: TEST_SESSION_ID }),
			);
		});
	});

	describe("Default scores", () => {
		it("should handle default facet scores (no evidence yet)", async () => {
			// Empty evidence array -> all facets get default score=10, confidence=0
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			// Default facet score 10 x 6 = 60 per trait -> all Mid
			expect(result.oceanCode5).toBe("GBANT");
			expect(result.overallConfidence).toBe(0); // All facets at confidence 0
		});
	});
});
