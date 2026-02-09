/**
 * Shareable Profile Use Case Tests
 *
 * Tests for create, get, and toggle profile visibility use-cases.
 * Uses @effect/vitest with vi.mock() + __mocks__ pattern.
 */

import { it } from "@effect/vitest";
import {
	ALL_FACETS,
	AssessmentSessionRepository,
	createInitialFacetScoresMap,
	type FacetScoresMap,
	lookupArchetype,
	PublicProfileRepository,
	ScorerRepository,
} from "@workspace/domain";
import { AppConfigTestLive } from "@workspace/infrastructure";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");
vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/scorer.drizzle.repository");

import {
	AssessmentSessionDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetSessionState,
} from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import {
	PublicProfileDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetProfileState,
} from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";
import { ScorerDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/scorer.drizzle.repository";

import { createShareableProfile } from "../create-shareable-profile.use-case";
import { getPublicProfile } from "../get-public-profile.use-case";
import { toggleProfileVisibility } from "../toggle-profile-visibility.use-case";

/**
 * Create a facet scores map where all facets have high confidence (>= 70)
 */
function createHighConfidenceFacetScores(): FacetScoresMap {
	const scores = createInitialFacetScoresMap();
	for (const facet of ALL_FACETS) {
		scores[facet] = { score: 15, confidence: 85 };
	}
	return scores;
}

/**
 * Create a facet scores map where some facets have low confidence (< 70)
 */
function createLowConfidenceFacetScores(): FacetScoresMap {
	const scores = createInitialFacetScoresMap();
	for (const facet of ALL_FACETS) {
		scores[facet] = { score: 10, confidence: 50 };
	}
	return scores;
}

/**
 * Create a custom scorer layer that returns specific facet scores
 */
function createScorerLayer(facetScores: FacetScoresMap) {
	return Layer.succeed(
		ScorerRepository,
		ScorerRepository.of({
			aggregateFacetScores: () => Effect.succeed(facetScores),
			deriveTraitScores: () => Effect.succeed({} as Record<string, unknown>),
		}),
	);
}

// Base test layer with default (low confidence) scores
const BaseTestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ScorerDrizzleRepositoryLive,
	AppConfigTestLive,
);

// Test layer with high confidence scores (assessment complete)
const HighConfidenceTestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	createScorerLayer(createHighConfidenceFacetScores()),
	AppConfigTestLive,
);

// Test layer with low confidence scores
const LowConfidenceTestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	createScorerLayer(createLowConfidenceFacetScores()),
	AppConfigTestLive,
);

describe("createShareableProfile Use Case", () => {
	beforeEach(() => {
		resetSessionState();
		resetProfileState();
	});

	describe("Success scenarios", () => {
		it.effect("should create a profile from a valid session with high confidence", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				const result = yield* createShareableProfile({ sessionId });

				expect(result.publicProfileId).toBeDefined();
				expect(result.shareableUrl).toContain("/profile/");
				expect(result.shareableUrl).toContain(result.publicProfileId);
				expect(result.isPublic).toBe(false); // Private by default
			}).pipe(Effect.provide(HighConfidenceTestLayer)),
		);

		it.effect("should return existing profile for same session (idempotent)", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				// Create profile twice
				const result1 = yield* createShareableProfile({ sessionId });
				const result2 = yield* createShareableProfile({ sessionId });

				// Should return the same profile
				expect(result1.publicProfileId).toBe(result2.publicProfileId);
			}).pipe(Effect.provide(HighConfidenceTestLayer)),
		);

		it.effect("should generate shareable URL with frontend base URL", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				const result = yield* createShareableProfile({ sessionId });

				expect(result.shareableUrl).toMatch(/^http:\/\/localhost:3000\/profile\/[0-9a-f-]+$/);
			}).pipe(Effect.provide(HighConfidenceTestLayer)),
		);
	});

	describe("Error scenarios", () => {
		it.effect("should fail when facet confidence is below threshold", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				// BaseTestLayer uses default scorer mock which returns confidence: 0
				const exit = yield* Effect.exit(createShareableProfile({ sessionId }));

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toHaveProperty("_tag", "ProfileError");
					expect(exit.cause.error).toHaveProperty(
						"message",
						"Complete more of the assessment before sharing.",
					);
				}
			}).pipe(Effect.provide(BaseTestLayer)),
		);

		it.effect("should fail when some facets have low confidence (50)", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				const exit = yield* Effect.exit(createShareableProfile({ sessionId }));

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toHaveProperty("_tag", "ProfileError");
				}
			}).pipe(Effect.provide(LowConfidenceTestLayer)),
		);
	});
});

describe("getPublicProfile Use Case", () => {
	beforeEach(() => {
		resetSessionState();
		resetProfileState();
	});

	// Derive expected values from lookupArchetype for "HHMH"
	const expectedArchetype = lookupArchetype("HHMH");

	describe("Success scenarios", () => {
		it.effect("should return profile data for a public profile", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const profileRepo = yield* PublicProfileRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				// Create profile directly via repo and make it public
				const profile = yield* profileRepo.createProfile({
					sessionId,
					userId: "user_123",
					oceanCode5: "HHMHM",
					oceanCode4: "HHMH",
				});

				// Make it public
				yield* profileRepo.toggleVisibility(profile.id, true);

				const result = yield* getPublicProfile({ publicProfileId: profile.id });

				expect(result.archetypeName).toBe(expectedArchetype.name);
				expect(result.oceanCode).toBe("HHMHM");
				expect(result.description).toBe(expectedArchetype.description);
				expect(result.color).toBe(expectedArchetype.color);
				expect(result.traitSummary.openness).toBe("H");
				expect(result.isPublic).toBe(true);
			}).pipe(Effect.provide(BaseTestLayer)),
		);
	});

	describe("Error scenarios", () => {
		it.effect("should fail with ProfilePrivate for non-public profile", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const profileRepo = yield* PublicProfileRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				// Create profile (private by default)
				const profile = yield* profileRepo.createProfile({
					sessionId,
					userId: "user_123",
					oceanCode5: "HHMHM",
					oceanCode4: "HHMH",
				});

				const exit = yield* Effect.exit(getPublicProfile({ publicProfileId: profile.id }));

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toHaveProperty("_tag", "ProfilePrivate");
					expect(exit.cause.error).toHaveProperty("message", "This profile is private");
				}
			}).pipe(Effect.provide(BaseTestLayer)),
		);

		it.effect("should fail with ProfileNotFound for non-existent profile", () =>
			Effect.gen(function* () {
				const exit = yield* Effect.exit(
					getPublicProfile({
						publicProfileId: "00000000-0000-0000-0000-000000000000",
					}),
				);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toHaveProperty("_tag", "ProfileNotFound");
				}
			}).pipe(Effect.provide(BaseTestLayer)),
		);
	});
});

describe("toggleProfileVisibility Use Case", () => {
	beforeEach(() => {
		resetSessionState();
		resetProfileState();
	});

	describe("Success scenarios", () => {
		it.effect("should toggle profile from private to public", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const profileRepo = yield* PublicProfileRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				const profile = yield* profileRepo.createProfile({
					sessionId,
					userId: "user_123",
					oceanCode5: "HHMHM",
					oceanCode4: "HHMH",
				});

				const result = yield* toggleProfileVisibility({
					publicProfileId: profile.id,
					isPublic: true,
					authenticatedUserId: "user_123",
				});

				expect(result.isPublic).toBe(true);

				// Verify via repo
				const updated = yield* profileRepo.getProfile(profile.id);
				expect(updated?.isPublic).toBe(true);
			}).pipe(Effect.provide(BaseTestLayer)),
		);
	});

	describe("Error scenarios", () => {
		it.effect("should fail with Unauthorized for non-owner", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;
				const profileRepo = yield* PublicProfileRepository;
				const { sessionId } = yield* sessionRepo.createSession("user_123");

				const profile = yield* profileRepo.createProfile({
					sessionId,
					userId: "user_123",
					oceanCode5: "HHMHM",
					oceanCode4: "HHMH",
				});

				const exit = yield* Effect.exit(
					toggleProfileVisibility({
						publicProfileId: profile.id,
						isPublic: true,
						authenticatedUserId: "different_user",
					}),
				);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toHaveProperty("_tag", "Unauthorized");
				}
			}).pipe(Effect.provide(BaseTestLayer)),
		);

		it.effect("should fail with ProfileNotFound for non-existent profile", () =>
			Effect.gen(function* () {
				const exit = yield* Effect.exit(
					toggleProfileVisibility({
						publicProfileId: "00000000-0000-0000-0000-000000000000",
						isPublic: true,
						authenticatedUserId: "user_123",
					}),
				);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
					expect(exit.cause.error).toHaveProperty("_tag", "ProfileNotFound");
				}
			}).pipe(Effect.provide(BaseTestLayer)),
		);
	});
});
