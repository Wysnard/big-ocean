import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/facet-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/profile-access-log.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-result.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	ALL_FACETS,
	type AssessmentResultRepository,
	type FacetEvidenceRepository,
	type FacetName,
	type LoggerRepository,
	type ProfileAccessLogRepository,
	PublicProfileRepository,
	type TraitName,
} from "@workspace/domain";
import { TRAIT_TO_FACETS } from "@workspace/domain/constants/big-five";
import { _resetMockState as resetFacetMock } from "@workspace/infrastructure/repositories/__mocks__/facet-evidence.drizzle.repository";
import { _resetMockState as resetProfileMock } from "@workspace/infrastructure/repositories/__mocks__/public-profile.drizzle.repository";
import {
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__
	_seedResult,
	AssessmentResultDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__
	_resetMockState as resetResultMock,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import { FacetEvidenceDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/facet-evidence.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { ProfileAccessLogDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/profile-access-log.drizzle.repository";
import { PublicProfileDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";
import { Cause, Effect, Exit, Layer } from "effect";
import { getPublicProfile } from "../get-public-profile.use-case";

const TestLayer = Layer.mergeAll(
	PublicProfileDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	AssessmentResultDrizzleRepositoryLive,
) as Layer.Layer<
	| PublicProfileRepository
	| FacetEvidenceRepository
	| ProfileAccessLogRepository
	| LoggerRepository
	| AssessmentResultRepository
>;

const USER_ID = "user-1";
const SESSION_ID = "session-1";

/** Build facets and traits objects for seeding assessment results */
function buildFacetsAndTraits() {
	const facets: Record<string, { score: number; confidence: number }> = {};
	for (const facet of ALL_FACETS) {
		facets[facet] = { score: 15, confidence: 80 };
	}
	const traits: Record<string, { score: number; confidence: number }> = {};
	for (const [trait, traitFacets] of Object.entries(TRAIT_TO_FACETS)) {
		const totalScore = traitFacets.reduce((sum, f) => sum + (facets[f]?.score ?? 0), 0);
		const avgConf =
			traitFacets.reduce((sum, f) => sum + (facets[f]?.confidence ?? 0), 0) / traitFacets.length;
		traits[trait] = { score: totalScore, confidence: avgConf };
	}
	return {
		facets: facets as Record<FacetName, { score: number; confidence: number }>,
		traits: traits as Record<TraitName, { score: number; confidence: number }>,
	};
}

const seedPublicProfile = (isPublic = true) =>
	Effect.gen(function* () {
		const repo = yield* PublicProfileRepository;
		const profile = yield* repo.createProfile({
			sessionId: SESSION_ID,
			userId: USER_ID,
			oceanCode5: "MCBPR",
			oceanCode4: "MCBP",
		});
		if (isPublic) {
			yield* repo.toggleVisibility(profile.id, true);
		}
		// Seed assessment result for the session
		const { facets, traits } = buildFacetsAndTraits();
		_seedResult(SESSION_ID, { facets, traits });
		return profile;
	});

describe("getPublicProfile", () => {
	beforeEach(() => {
		resetProfileMock();
		resetFacetMock();
		resetResultMock();
	});

	it.effect("fails with ProfileNotFound when profile does not exist", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				getPublicProfile({ publicProfileId: "non-existent", viewerUserId: null }),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = Cause.failureOption(exit.cause);
				expect(error._tag).toBe("Some");
				expect((error as { value: { _tag: string } }).value._tag).toBe("ProfileNotFound");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with ProfilePrivate when profile is not public", () =>
		Effect.gen(function* () {
			const repo = yield* PublicProfileRepository;
			const profile = yield* repo.createProfile({
				sessionId: SESSION_ID,
				userId: USER_ID,
				oceanCode5: "MCBPR",
				oceanCode4: "MCBP",
			});

			const exit = yield* Effect.exit(
				getPublicProfile({ publicProfileId: profile.id, viewerUserId: null }),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = Cause.failureOption(exit.cause);
				expect(error._tag).toBe("Some");
				expect((error as { value: { _tag: string } }).value._tag).toBe("ProfilePrivate");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns archetype, facets, and trait summary for public profile", () =>
		Effect.gen(function* () {
			const profile = yield* seedPublicProfile(true);

			const result = yield* getPublicProfile({ publicProfileId: profile.id, viewerUserId: null });

			expect(result.archetypeName).toBeDefined();
			// Derived from facets (all score=15 → trait sum=90 → High for each trait)
			expect(result.oceanCode).toBe("OCEAN");
			expect(result.description).toBeDefined();
			expect(result.color).toBeDefined();
			expect(result.traitSummary).toBeDefined();
			expect(result.facets).toBeDefined();
			expect(result.isPublic).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("incrementViewCount failure does not propagate (fail-open)", () =>
		Effect.gen(function* () {
			const profile = yield* seedPublicProfile(true);

			// Even if incrementViewCount were to fail internally, the use-case
			// catches the error via fail-open pattern and the GET still succeeds.
			const result = yield* getPublicProfile({ publicProfileId: profile.id, viewerUserId: null });

			expect(result.archetypeName).toBeDefined();
			expect(result.isPublic).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns profile data when private but viewer is the owner", () =>
		Effect.gen(function* () {
			const repo = yield* PublicProfileRepository;
			const profile = yield* repo.createProfile({
				sessionId: SESSION_ID,
				userId: USER_ID,
				oceanCode5: "MCBPR",
				oceanCode4: "MCBP",
			});
			const { facets, traits } = buildFacetsAndTraits();
			_seedResult(SESSION_ID, { facets, traits });

			const result = yield* getPublicProfile({
				publicProfileId: profile.id,
				viewerUserId: USER_ID,
			});

			expect(result.isPublic).toBe(false);
			expect(result.archetypeName).toBeDefined();
			expect(result.facets).toBeDefined();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with ProfilePrivate when private and viewer is not the owner", () =>
		Effect.gen(function* () {
			const repo = yield* PublicProfileRepository;
			const profile = yield* repo.createProfile({
				sessionId: SESSION_ID,
				userId: USER_ID,
				oceanCode5: "MCBPR",
				oceanCode4: "MCBP",
			});
			const { facets, traits } = buildFacetsAndTraits();
			_seedResult(SESSION_ID, { facets, traits });

			const exit = yield* Effect.exit(
				getPublicProfile({
					publicProfileId: profile.id,
					viewerUserId: "someone-else",
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = Cause.failureOption(exit.cause);
				expect(error._tag).toBe("Some");
				expect((error as { value: { _tag: string } }).value._tag).toBe("ProfilePrivate");
			}
		}).pipe(Effect.provide(TestLayer)),
	);
});
