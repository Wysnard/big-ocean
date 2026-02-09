/**
 * Public Profile Repository Implementation (Drizzle)
 *
 * Manages shareable personality profile persistence.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 */

import { DatabaseError, ProfileError, ProfileNotFound } from "@workspace/contracts/errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { CreatePublicProfileInput } from "@workspace/domain/repositories/public-profile.repository";
import { PublicProfileRepository } from "@workspace/domain/repositories/public-profile.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { publicProfile } from "../db/drizzle/schema";

/**
 * Public Profile Repository Layer
 *
 * Layer type: Layer<PublicProfileRepository, never, Database | LoggerRepository>
 */
export const PublicProfileDrizzleRepositoryLive = Layer.effect(
	PublicProfileRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return PublicProfileRepository.of({
			createProfile: (input: CreatePublicProfileInput) =>
				Effect.gen(function* () {
					const [profile] = yield* db
						.insert(publicProfile)
						.values({
							sessionId: input.sessionId,
							...(input.userId ? { userId: input.userId } : {}),
							oceanCode5: input.oceanCode5,
							oceanCode4: input.oceanCode4,
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "createProfile",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch {
									// Silently ignore logger failures
								}
								return new DatabaseError({ message: "Failed to create public profile" });
							}),
						);

					if (!profile) {
						return yield* Effect.fail(new ProfileError({ message: "Failed to create public profile" }));
					}

					return {
						id: profile.id,
						sessionId: profile.sessionId,
						userId: profile.userId,
						oceanCode5: profile.oceanCode5,
						oceanCode4: profile.oceanCode4,
						isPublic: profile.isPublic,
						viewCount: profile.viewCount,
						createdAt: profile.createdAt,
					};
				}),

			getProfile: (profileId: string) =>
				Effect.gen(function* () {
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					if (!uuidRegex.test(profileId)) {
						return null;
					}

					const results = yield* db
						.select()
						.from(publicProfile)
						.where(eq(publicProfile.id, profileId))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getProfile",
										profileId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch {
									// Silently ignore logger failures
								}
								return new DatabaseError({ message: "Failed to fetch public profile" });
							}),
						);

					const profile = results[0];
					if (!profile) return null;

					return {
						id: profile.id,
						sessionId: profile.sessionId,
						userId: profile.userId,
						oceanCode5: profile.oceanCode5,
						oceanCode4: profile.oceanCode4,
						isPublic: profile.isPublic,
						viewCount: profile.viewCount,
						createdAt: profile.createdAt,
					};
				}),

			getProfileBySessionId: (sessionId: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.select()
						.from(publicProfile)
						.where(eq(publicProfile.sessionId, sessionId))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getProfileBySessionId",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch {
									// Silently ignore logger failures
								}
								return new DatabaseError({ message: "Failed to fetch public profile" });
							}),
						);

					const profile = results[0];
					if (!profile) return null;

					return {
						id: profile.id,
						sessionId: profile.sessionId,
						userId: profile.userId,
						oceanCode5: profile.oceanCode5,
						oceanCode4: profile.oceanCode4,
						isPublic: profile.isPublic,
						viewCount: profile.viewCount,
						createdAt: profile.createdAt,
					};
				}),

			toggleVisibility: (profileId: string, isPublic: boolean) =>
				Effect.gen(function* () {
					const result = yield* db
						.update(publicProfile)
						.set({ isPublic, updatedAt: new Date() })
						.where(eq(publicProfile.id, profileId))
						.returning({ id: publicProfile.id })
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "toggleVisibility",
										profileId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch {
									// Silently ignore logger failures
								}
								return new DatabaseError({ message: "Failed to toggle profile visibility" });
							}),
						);

					if (result.length === 0) {
						return yield* Effect.fail(
							new ProfileNotFound({
								publicProfileId: profileId,
								message: `Profile '${profileId}' not found`,
							}),
						);
					}
				}),

			incrementViewCount: (profileId: string) =>
				Effect.gen(function* () {
					yield* db
						.update(publicProfile)
						.set({
							viewCount: sql`${publicProfile.viewCount} + 1`,
							updatedAt: new Date(),
						})
						.where(eq(publicProfile.id, profileId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "incrementViewCount",
										profileId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch {
									// Silently ignore logger failures
								}
								return new DatabaseError({ message: "Failed to increment view count" });
							}),
						);
				}),
		});
	}),
);
