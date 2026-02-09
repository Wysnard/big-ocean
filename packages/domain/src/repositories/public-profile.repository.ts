/**
 * Public Profile Repository Interface
 *
 * Defines the contract for persisting and retrieving shareable public profiles.
 * Part of the hexagonal architecture - this is a PORT (interface).
 *
 * Implementations:
 * - PublicProfileDrizzleRepositoryLive (production)
 * - __mocks__/public-profile.drizzle.repository.ts (testing)
 *
 * @see packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts
 */

import { DatabaseError, ProfileError, ProfileNotFound } from "@workspace/contracts/errors";
import { Context, Effect } from "effect";

export interface CreatePublicProfileInput {
	readonly sessionId: string;
	readonly userId: string | null;
	readonly oceanCode5: string;
	readonly oceanCode4: string;
}

export interface PublicProfileData {
	readonly id: string;
	readonly sessionId: string;
	readonly userId: string | null;
	readonly oceanCode5: string;
	readonly oceanCode4: string;
	readonly isPublic: boolean;
	readonly viewCount: number;
	readonly createdAt: Date;
}

/**
 * Public Profile Repository Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 */
export class PublicProfileRepository extends Context.Tag("PublicProfileRepository")<
	PublicProfileRepository,
	{
		readonly createProfile: (
			input: CreatePublicProfileInput,
		) => Effect.Effect<PublicProfileData, DatabaseError | ProfileError>;

		readonly getProfile: (
			profileId: string,
		) => Effect.Effect<PublicProfileData | null, DatabaseError>;

		readonly getProfileBySessionId: (
			sessionId: string,
		) => Effect.Effect<PublicProfileData | null, DatabaseError>;

		readonly toggleVisibility: (
			profileId: string,
			isPublic: boolean,
		) => Effect.Effect<void, DatabaseError | ProfileNotFound>;

		readonly incrementViewCount: (profileId: string) => Effect.Effect<void, DatabaseError>;
	}
>() {}
