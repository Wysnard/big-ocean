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

import {
	DatabaseError,
	ProfileError,
	ProfileNotFound,
	Unauthorized,
} from "@workspace/contracts/errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import type { CreatePublicProfileInput } from "@workspace/domain/repositories/public-profile.repository";
import { PublicProfileRepository } from "@workspace/domain/repositories/public-profile.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { publicProfile, user } from "../db/drizzle/schema";

const mapProfileRecord = (
	profile: Pick<
		typeof publicProfile.$inferSelect,
		"id" | "conversationId" | "userId" | "isPublic" | "viewCount" | "createdAt"
	>,
	displayName: string,
) => ({
	id: profile.id,
	sessionId: profile.conversationId,
	userId: profile.userId as string,
	displayName,
	isPublic: profile.isPublic,
	viewCount: profile.viewCount,
	createdAt: profile.createdAt,
});

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
							conversationId: input.sessionId,
							userId: input.userId,
							...(input.assessmentResultId ? { assessmentResultId: input.assessmentResultId } : {}),
						})
						.onConflictDoNothing({ target: publicProfile.conversationId })
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
						// Another finalization path may have created the row concurrently.
						const existing = yield* db
							.select({
								id: publicProfile.id,
								conversationId: publicProfile.conversationId,
								userId: publicProfile.userId,
								isPublic: publicProfile.isPublic,
								viewCount: publicProfile.viewCount,
								createdAt: publicProfile.createdAt,
								userName: user.name,
							})
							.from(publicProfile)
							.leftJoin(user, eq(publicProfile.userId, user.id))
							.where(eq(publicProfile.conversationId, input.sessionId))
							.limit(1)
							.pipe(
								Effect.mapError(
									() => new DatabaseError({ message: "Failed to fetch existing public profile" }),
								),
							);

						const row = existing[0];
						if (!row) {
							return yield* Effect.fail(new ProfileError({ message: "Failed to create public profile" }));
						}

						return mapProfileRecord(row, (row.userName ?? row.userId) as string);
					}

					// Fetch user's display name — userId is always present for created profiles.
					const users = yield* db
						.select({ name: user.name })
						.from(user)
						.where(eq(user.id, input.userId))
						.limit(1)
						.pipe(
							Effect.mapError(
								() => new DatabaseError({ message: "Failed to fetch user for display name" }),
							),
						);

					if (users.length === 0) {
						return yield* Effect.fail(new Unauthorized({ message: "User not found" }));
					}

					return mapProfileRecord({ ...profile, userId: input.userId }, users[0]?.name ?? input.userId);
				}),

			getProfile: (profileId: string) =>
				Effect.gen(function* () {
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					if (!uuidRegex.test(profileId)) {
						return null;
					}

					const results = yield* db
						.select({
							id: publicProfile.id,
							conversationId: publicProfile.conversationId,
							userId: publicProfile.userId,
							isPublic: publicProfile.isPublic,
							viewCount: publicProfile.viewCount,
							createdAt: publicProfile.createdAt,
							userName: user.name,
						})
						.from(publicProfile)
						.leftJoin(user, eq(publicProfile.userId, user.id))
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

					return mapProfileRecord(profile, (profile.userName ?? profile.userId) as string);
				}),

			getProfileBySessionId: (sessionId: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.select({
							id: publicProfile.id,
							conversationId: publicProfile.conversationId,
							userId: publicProfile.userId,
							isPublic: publicProfile.isPublic,
							viewCount: publicProfile.viewCount,
							createdAt: publicProfile.createdAt,
							userName: user.name,
						})
						.from(publicProfile)
						.leftJoin(user, eq(publicProfile.userId, user.id))
						.where(eq(publicProfile.conversationId, sessionId))
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

					return mapProfileRecord(profile, (profile.userName ?? profile.userId) as string);
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
