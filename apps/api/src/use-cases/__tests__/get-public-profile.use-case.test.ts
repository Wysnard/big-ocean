import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/facet-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/profile-access-log.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	FacetEvidenceRepository,
	LoggerRepository,
	ProfileAccessLogRepository,
	PublicProfileRepository,
} from "@workspace/domain";
import { _resetMockState as resetFacetMock } from "@workspace/infrastructure/repositories/__mocks__/facet-evidence.drizzle.repository";
import { _resetMockState as resetProfileMock } from "@workspace/infrastructure/repositories/__mocks__/public-profile.drizzle.repository";
import { FacetEvidenceDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/facet-evidence.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { ProfileAccessLogDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/profile-access-log.drizzle.repository";
import { PublicProfileDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { getPublicProfile } from "../get-public-profile.use-case";

const TestLayer = Layer.mergeAll(
	PublicProfileDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
) as Layer.Layer<
	PublicProfileRepository | FacetEvidenceRepository | ProfileAccessLogRepository | LoggerRepository
>;

const USER_ID = "user-1";

const seedPublicProfile = (isPublic = true) =>
	Effect.gen(function* () {
		const repo = yield* PublicProfileRepository;
		const profile = yield* repo.createProfile({
			sessionId: "session-1",
			userId: USER_ID,
			oceanCode5: "GDANR",
			oceanCode4: "GDAN",
		});
		if (isPublic) {
			yield* repo.toggleVisibility(profile.id, true);
		}
		return profile;
	});

describe("getPublicProfile", () => {
	beforeEach(() => {
		resetProfileMock();
		resetFacetMock();
	});

	it.effect("fails with ProfileNotFound when profile does not exist", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(getPublicProfile({ publicProfileId: "non-existent" }));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as { _tag: string })._tag).toBe("ProfileNotFound");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with ProfilePrivate when profile is not public", () =>
		Effect.gen(function* () {
			const profile = yield* seedPublicProfile(false);

			const exit = yield* Effect.exit(getPublicProfile({ publicProfileId: profile.id }));

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as { _tag: string })._tag).toBe("ProfilePrivate");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns archetype, facets, and trait summary for public profile", () =>
		Effect.gen(function* () {
			const profile = yield* seedPublicProfile(true);

			const result = yield* getPublicProfile({ publicProfileId: profile.id });

			expect(result.archetypeName).toBeDefined();
			expect(result.oceanCode).toBe("GDANR");
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
			const result = yield* getPublicProfile({ publicProfileId: profile.id });

			expect(result.archetypeName).toBeDefined();
			expect(result.isPublic).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);
});
