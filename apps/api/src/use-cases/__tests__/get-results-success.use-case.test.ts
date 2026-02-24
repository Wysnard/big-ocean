/**
 * Get Results Use Case Tests — Success scenarios + Default scores
 *
 * Tests the business logic for retrieving assessment results.
 * After Story 11.1, get-results is read-only — no lazy finalization or portrait generation.
 */

import { BIG_FIVE_TRAITS } from "@workspace/domain";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getResults } from "../get-results.use-case";
import {
	createEvidenceForUniformScores,
	createTestLayer,
	createUniformEvidence,
	mockEvidenceRepo,
	mockProfileRepo,
	mockSessionRepo,
	setupDefaultMocks,
	TEST_SESSION_ID,
} from "./__fixtures__/get-results.fixtures";

describe("getResults Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success scenarios", () => {
		it("should return correct archetype for known high facet scores", async () => {
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
			const mixed = {
				openness: { facetScore: 15, confidence: 85 },
				conscientiousness: { facetScore: 5, confidence: 70 },
				extraversion: { facetScore: 10, confidence: 60 },
				agreeableness: { facetScore: 15, confidence: 75 },
				neuroticism: { facetScore: 3, confidence: 50 },
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
			const uniformEvidence = createUniformEvidence(10, 60);

			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed(uniformEvidence));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.overallConfidence).toBe(31);
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
			const boundaries = {
				openness: { facetScore: 6, confidence: 80 },
				conscientiousness: { facetScore: 7, confidence: 80 },
				extraversion: { facetScore: 13, confidence: 80 },
				agreeableness: { facetScore: 14, confidence: 80 },
				neuroticism: { facetScore: 20, confidence: 80 },
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

		it("should return null profile fields for anonymous users", async () => {
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.publicProfileId).toBeNull();
			expect(result.shareableUrl).toBeNull();
			expect(result.isPublic).toBeNull();
			expect(mockProfileRepo.createProfile).not.toHaveBeenCalled();
		});

		it("should eagerly create profile for authenticated users when none exists", async () => {
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
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

			expect(result.publicProfileId).toBe(`profile_${TEST_SESSION_ID}`);
			expect(result.shareableUrl).toBe(
				`http://localhost:3000/public-profile/profile_${TEST_SESSION_ID}`,
			);
			expect(result.isPublic).toBe(false);
			expect(mockProfileRepo.createProfile).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
				}),
			);
		});

		it("should return existing profile without creating for authenticated users", async () => {
			const PROFILE_ID = "profile_abc123";
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
					messageCount: 10,
					personalDescription: null,
				}),
			);
			mockProfileRepo.getProfileBySessionId.mockImplementation(() =>
				Effect.succeed({
					id: PROFILE_ID,
					sessionId: TEST_SESSION_ID,
					userId: "owner_user",
					displayName: "Test User",
					oceanCode5: "GBANT",
					oceanCode4: "GBAN",
					isPublic: true,
					viewCount: 5,
					createdAt: new Date(),
				}),
			);
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID, authenticatedUserId: "owner_user" }).pipe(
					Effect.provide(createTestLayer()),
				),
			);

			expect(result.publicProfileId).toBe(PROFILE_ID);
			expect(result.shareableUrl).toBe(`http://localhost:3000/public-profile/${PROFILE_ID}`);
			expect(result.isPublic).toBe(true);
			expect(mockProfileRepo.createProfile).not.toHaveBeenCalled();
		});

		it("should return curated archetype when available", async () => {
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

			expect(result.oceanCode4).toBe("ODEW");
			expect(result.archetypeName).toBeDefined();
			expect(result.archetypeDescription).toBeDefined();
			expect(result.archetypeColor).toBeDefined();
		});

		it("should return stored portrait description when present", async () => {
			const STORED_PORTRAIT = "Previously generated portrait text.";
			mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
				Effect.succeed({
					id: TEST_SESSION_ID,
					sessionId: TEST_SESSION_ID,
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "completed",
					messageCount: 10,
					personalDescription: STORED_PORTRAIT,
				}),
			);
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.personalDescription).toBe(STORED_PORTRAIT);
		});

		it("should return null personalDescription when not set", async () => {
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.personalDescription).toBeNull();
		});
	});

	describe("Default scores", () => {
		it("should handle default facet scores (no evidence yet)", async () => {
			mockEvidenceRepo.getEvidenceBySession.mockImplementation(() => Effect.succeed([]));

			const result = await Effect.runPromise(
				getResults({ sessionId: TEST_SESSION_ID }).pipe(Effect.provide(createTestLayer())),
			);

			expect(result.oceanCode5).toBe("GBANT");
			expect(result.overallConfidence).toBe(0);
		});
	});
});
