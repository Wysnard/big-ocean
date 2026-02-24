/**
 * Profile Access Log Drizzle Repository
 *
 * Fire-and-forget audit logging for public profile views.
 * Wraps all DB operations in catchAll — failures never propagate.
 */

import { ProfileAccessLogRepository } from "@workspace/domain/repositories/profile-access-log.repository";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { profileAccessLog } from "../db/drizzle/schema";

export const ProfileAccessLogDrizzleRepositoryLive = Layer.effect(
	ProfileAccessLogRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return {
			logAccess: (input) =>
				Effect.gen(function* () {
					yield* Effect.tryPromise(() =>
						db.insert(profileAccessLog).values({
							profileId: input.profileId,
							accessorUserId: input.accessorUserId ?? null,
							accessorIp: input.accessorIp ?? null,
							accessorUserAgent: input.accessorUserAgent ?? null,
							action: input.action,
						}),
					);
				}).pipe(Effect.catchAll(() => Effect.void)),
		};
	}),
);
