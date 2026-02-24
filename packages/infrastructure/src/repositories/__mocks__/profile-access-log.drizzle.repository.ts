/**
 * Profile Access Log Mock Repository
 *
 * In-memory implementation for testing.
 */

import type { ProfileAccessLogInput } from "@workspace/domain/repositories/profile-access-log.repository";
import { ProfileAccessLogRepository } from "@workspace/domain/repositories/profile-access-log.repository";
import { Effect, Layer } from "effect";

export const accessLogEntries: ProfileAccessLogInput[] = [];

export const ProfileAccessLogDrizzleRepositoryLive = Layer.succeed(ProfileAccessLogRepository, {
	logAccess: (input) =>
		Effect.sync(() => {
			accessLogEntries.push(input);
		}),
});
