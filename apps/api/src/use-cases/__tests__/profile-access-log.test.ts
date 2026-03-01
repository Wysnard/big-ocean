/**
 * Profile Access Log Tests (Story 15.1, Task 11)
 *
 * Tests audit logging for public profile access:
 * - Successful profile view creates audit log entry
 * - Audit log failure does NOT fail profile GET (fire-and-forget)
 * - Private profile (403) does NOT create audit log
 * - Non-existent profile (404) does NOT create audit log
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");
vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/profile-access-log.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-result.drizzle.repository");

import { it } from "@effect/vitest";
import {
	ALL_FACETS,
	AssessmentSessionRepository,
	FacetEvidenceRepository,
	type FacetName,
	type ProfileAccessLogInput,
	ProfileAccessLogRepository,
	PublicProfileRepository,
	type SavedFacetEvidence,
	type TraitName,
} from "@workspace/domain";
import { TRAIT_TO_FACETS } from "@workspace/domain/constants/big-five";
import { AppConfigTestLive } from "@workspace/infrastructure";
import {
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__
	_seedResult,
	AssessmentResultDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__
	_resetMockState as resetResultState,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import {
	AssessmentSessionDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__
	_resetMockState as resetSessionState,
} from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import {
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports accessLogEntries
	accessLogEntries,
	ProfileAccessLogDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/profile-access-log.drizzle.repository";
import {
	PublicProfileDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__
	_resetMockState as resetProfileState,
} from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";
import { Effect, Exit, Layer, TestClock } from "effect";
import { beforeEach, describe, expect } from "vitest";

import { getPublicProfile } from "../get-public-profile.use-case";

function createTestEvidence(score: number, confidence: number): SavedFacetEvidence[] {
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

const TestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	AssessmentResultDrizzleRepositoryLive,
	createEvidenceLayer(createTestEvidence(15, 85)),
	AppConfigTestLive,
);

/** Build facets and traits seed data */
function buildFacetsAndTraits(score: number, confidence: number) {
	const facets: Record<string, { score: number; confidence: number; signalPower: number }> = {};
	for (const facet of ALL_FACETS) {
		facets[facet] = { score, confidence, signalPower: 1 };
	}
	const traits: Record<string, { score: number; confidence: number; signalPower: number }> = {};
	for (const [trait, traitFacets] of Object.entries(TRAIT_TO_FACETS)) {
		const totalScore = traitFacets.reduce((sum, f) => sum + (facets[f]?.score ?? 0), 0);
		const avgConf =
			traitFacets.reduce((sum, f) => sum + (facets[f]?.confidence ?? 0), 0) / traitFacets.length;
		traits[trait] = { score: totalScore, confidence: avgConf, signalPower: 1 };
	}
	return {
		facets: facets as Record<FacetName, { score: number; confidence: number; signalPower: number }>,
		traits: traits as Record<TraitName, { score: number; confidence: number; signalPower: number }>,
	};
}

/** Helper: create a public profile via repo APIs */
function createPublicProfile() {
	return Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const profileRepo = yield* PublicProfileRepository;
		const { sessionId } = yield* sessionRepo.createSession("user_test");
		const { facets, traits } = buildFacetsAndTraits(15, 85);
		_seedResult(sessionId, { facets, traits });
		const profile = yield* profileRepo.createProfile({
			sessionId,
			userId: "user_test",
			oceanCode5: "ODAWT",
			oceanCode4: "ODAW",
		});
		yield* profileRepo.toggleVisibility(profile.id, true);
		return profile;
	});
}

/** Helper: create a private profile via repo APIs */
function createPrivateProfile() {
	return Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const profileRepo = yield* PublicProfileRepository;
		const { sessionId } = yield* sessionRepo.createSession("user_private");
		const profile = yield* profileRepo.createProfile({
			sessionId,
			userId: "user_private",
			oceanCode5: "LLLLM",
			oceanCode4: "LLLL",
		});
		return profile;
	});
}

describe("Profile Access Log (Story 15.1)", () => {
	beforeEach(() => {
		resetSessionState();
		resetProfileState();
		resetResultState();
		(accessLogEntries as ProfileAccessLogInput[]).length = 0;
	});

	it.effect("successful profile view creates audit log entry", () =>
		Effect.gen(function* () {
			const profile = yield* createPublicProfile();
			yield* getPublicProfile({ publicProfileId: profile.id });

			// Advance TestClock so forked fiber completes
			yield* TestClock.adjust("100 millis");
			yield* Effect.yieldNow();

			const entries = accessLogEntries as ProfileAccessLogInput[];
			expect(entries.length).toBe(1);
			expect(entries[0].profileId).toBe(profile.id);
			expect(entries[0].action).toBe("profile_view");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("private profile (403) does NOT create audit log", () =>
		Effect.gen(function* () {
			const profile = yield* createPrivateProfile();

			const exit = yield* getPublicProfile({ publicProfileId: profile.id }).pipe(Effect.exit);
			expect(Exit.isFailure(exit)).toBe(true);

			yield* TestClock.adjust("100 millis");
			yield* Effect.yieldNow();

			const entries = accessLogEntries as ProfileAccessLogInput[];
			expect(entries.length).toBe(0);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("non-existent profile (404) does NOT create audit log", () =>
		Effect.gen(function* () {
			const exit = yield* getPublicProfile({ publicProfileId: "nonexistent-id" }).pipe(Effect.exit);
			expect(Exit.isFailure(exit)).toBe(true);

			yield* TestClock.adjust("100 millis");
			yield* Effect.yieldNow();

			const entries = accessLogEntries as ProfileAccessLogInput[];
			expect(entries.length).toBe(0);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("audit log failure does NOT fail profile GET (fire-and-forget)", () =>
		Effect.gen(function* () {
			const profile = yield* createPublicProfile();

			// Override the audit log repo with a failing one
			const FailingLogLayer = Layer.succeed(ProfileAccessLogRepository, {
				logAccess: () => Effect.die(new Error("DB connection failed")),
			});

			const FailingTestLayer = Layer.mergeAll(
				AssessmentSessionDrizzleRepositoryLive,
				LoggerPinoRepositoryLive,
				PublicProfileDrizzleRepositoryLive,
				FailingLogLayer,
				AssessmentResultDrizzleRepositoryLive,
				createEvidenceLayer(createTestEvidence(15, 85)),
				AppConfigTestLive,
			);

			// Should succeed despite failing audit log
			const result = yield* getPublicProfile({ publicProfileId: profile.id }).pipe(
				Effect.provide(FailingTestLayer),
			);
			expect(result.archetypeName).toBeDefined();

			yield* TestClock.adjust("100 millis");
			yield* Effect.yieldNow();
		}).pipe(Effect.provide(TestLayer)),
	);
});
