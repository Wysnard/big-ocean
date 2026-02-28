/**
 * Shareable Profile Use Case Tests
 *
 * Tests for create, get, and toggle profile visibility use-cases.
 * Uses @effect/vitest with vi.mock() + __mocks__ pattern.
 *
 * Story 2.9: Uses FacetEvidenceRepository + pure functions instead of ScorerRepository.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");
vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/profile-access-log.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/facet-evidence.drizzle.repository");

import { it } from "@effect/vitest";
import {
	ALL_FACETS,
	AssessmentSessionRepository,
	FacetEvidenceRepository,
	lookupArchetype,
	PublicProfileRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import { AppConfigTestLive } from "@workspace/infrastructure";
import {
	AssessmentSessionDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetSessionState,
} from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { FacetEvidenceDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/facet-evidence.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { ProfileAccessLogDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/profile-access-log.drizzle.repository";
import {
	PublicProfileDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetProfileState,
} from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect } from "vitest";

import { createShareableProfile } from "../create-shareable-profile.use-case";
import { getPublicProfile } from "../get-public-profile.use-case";
import { toggleProfileVisibility } from "../toggle-profile-visibility.use-case";

/**
 * Create SavedFacetEvidence records for all 30 facets with specified confidence.
 * Uses one evidence record per facet so aggregateFacetScores returns exact values.
 */
function createEvidenceWithConfidence(score: number, confidence: number): SavedFacetEvidence[] {
	return ALL_FACETS.map((facet, idx) => ({
		id: `evidence_${facet}`,
		assessmentMessageId: `msg_${idx}`,
		facetName: facet,
		score,
		confidence,
		quote: `Test quote for ${facet}`,
		highlightRange: { start: 0, end: 20 },
		createdAt: new Date(Date.now() + idx * 1000),
	}));
}

/**
 * Create a custom evidence layer that returns specific evidence
 */
function createEvidenceLayer(evidence: SavedFacetEvidence[]) {
	return Layer.succeed(
		FacetEvidenceRepository,
		FacetEvidenceRepository.of({
			saveEvidence: () => Effect.succeed([]),
			getEvidenceByMessage: () => Effect.succeed([]),
			getEvidenceByFacet: () => Effect.succeed([]),
			getEvidenceBySession: () => Effect.succeed(evidence),
		}),
	);
}

// Base test layer with default mock evidence (low confidence from mock)
const BaseTestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	AppConfigTestLive,
);

// Test layer with high confidence evidence (assessment complete)
const HighConfidenceTestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	createEvidenceLayer(createEvidenceWithConfidence(15, 85)),
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
				expect(result.shareableUrl).toContain("/public-profile/");
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

				expect(result.shareableUrl).toMatch(/^http:\/\/localhost:3000\/public-profile\/[0-9a-f-]+$/);
			}).pipe(Effect.provide(HighConfidenceTestLayer)),
		);
	});
});

describe("getPublicProfile Use Case", () => {
	beforeEach(() => {
		resetSessionState();
		resetProfileState();
	});

	// Derive expected values from lookupArchetype for "ODAW"
	const expectedArchetype = lookupArchetype("ODAW");

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
					oceanCode5: "ODAWT",
					oceanCode4: "ODAW",
				});

				// Make it public
				yield* profileRepo.toggleVisibility(profile.id, true);

				const result = yield* getPublicProfile({ publicProfileId: profile.id });

				expect(result.archetypeName).toBe(expectedArchetype.name);
				expect(result.oceanCode).toBe("ODAWT");
				expect(result.description).toBe(expectedArchetype.description);
				expect(result.color).toBe(expectedArchetype.color);
				expect(result.traitSummary.openness).toBe("O");
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
					oceanCode5: "ODAWT",
					oceanCode4: "ODAW",
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
					oceanCode5: "ODAWT",
					oceanCode4: "ODAW",
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
					oceanCode5: "ODAWT",
					oceanCode4: "ODAW",
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
