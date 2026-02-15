/**
 * Mock: public-profile.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/public-profile.drizzle.repository')
 */
import { ProfileNotFound } from "@workspace/contracts/errors";
import type {
	CreatePublicProfileInput,
	PublicProfileData,
} from "@workspace/domain/repositories/public-profile.repository";
import { PublicProfileRepository } from "@workspace/domain/repositories/public-profile.repository";
import { Effect, Layer } from "effect";

const profiles = new Map<string, PublicProfileData>();
const profilesBySession = new Map<string, string>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	profiles.clear();
	profilesBySession.clear();
};

export const PublicProfileDrizzleRepositoryLive = Layer.succeed(
	PublicProfileRepository,
	PublicProfileRepository.of({
		createProfile: (input: CreatePublicProfileInput) =>
			Effect.sync(() => {
				const id = crypto.randomUUID();
				const profile: PublicProfileData = {
					id,
					sessionId: input.sessionId,
					userId: input.userId,
					displayName: input.userId,
					oceanCode5: input.oceanCode5,
					oceanCode4: input.oceanCode4,
					isPublic: false,
					viewCount: 0,
					createdAt: new Date(),
				};
				profiles.set(id, profile);
				profilesBySession.set(input.sessionId, id);
				return profile;
			}),

		getProfile: (profileId: string) => Effect.sync(() => profiles.get(profileId) ?? null),

		getProfileBySessionId: (sessionId: string) =>
			Effect.sync(() => {
				const profileId = profilesBySession.get(sessionId);
				if (!profileId) return null;
				return profiles.get(profileId) ?? null;
			}),

		toggleVisibility: (profileId: string, isPublic: boolean) =>
			Effect.gen(function* () {
				const profile = profiles.get(profileId);
				if (!profile) {
					return yield* Effect.fail(
						new ProfileNotFound({
							publicProfileId: profileId,
							message: `Profile '${profileId}' not found`,
						}),
					);
				}
				profiles.set(profileId, { ...profile, isPublic });
			}),

		incrementViewCount: (profileId: string) =>
			Effect.sync(() => {
				const profile = profiles.get(profileId);
				if (profile) {
					profiles.set(profileId, { ...profile, viewCount: profile.viewCount + 1 });
				}
			}),
	}),
);
