import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/public-profile.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { PublicProfileRepository } from "@workspace/domain";
import { _resetMockState } from "@workspace/infrastructure/repositories/__mocks__/public-profile.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { PublicProfileDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/public-profile.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
import { toggleProfileVisibility } from "../toggle-profile-visibility.use-case";

const TestLayer = Layer.mergeAll(
	PublicProfileDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
) as Layer.Layer<PublicProfileRepository | import("@workspace/domain").LoggerRepository>;

const USER_ID = "user-1";
const OTHER_USER = "user-other";

const seedProfile = (_isPublic = false) =>
	Effect.gen(function* () {
		const repo = yield* PublicProfileRepository;
		return yield* repo.createProfile({
			sessionId: "session-1",
			userId: USER_ID,
			oceanCode5: "HHMHM",
			oceanCode4: "HHMH",
		});
	});

describe("toggleProfileVisibility", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("fails with ProfileNotFound when profile does not exist", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				toggleProfileVisibility({
					publicProfileId: "non-existent",
					isPublic: true,
					authenticatedUserId: USER_ID,
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as { _tag: string })._tag).toBe("ProfileNotFound");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with Unauthorized when user is not the owner", () =>
		Effect.gen(function* () {
			const profile = yield* seedProfile();

			const exit = yield* Effect.exit(
				toggleProfileVisibility({
					publicProfileId: profile.id,
					isPublic: true,
					authenticatedUserId: OTHER_USER,
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect((error as { _tag: string })._tag).toBe("Unauthorized");
			}
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("makes profile public", () =>
		Effect.gen(function* () {
			const profile = yield* seedProfile();

			const result = yield* toggleProfileVisibility({
				publicProfileId: profile.id,
				isPublic: true,
				authenticatedUserId: USER_ID,
			});

			expect(result.isPublic).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("makes profile private", () =>
		Effect.gen(function* () {
			const profile = yield* seedProfile();

			const result = yield* toggleProfileVisibility({
				publicProfileId: profile.id,
				isPublic: false,
				authenticatedUserId: USER_ID,
			});

			expect(result.isPublic).toBe(false);
		}).pipe(Effect.provide(TestLayer)),
	);
});
