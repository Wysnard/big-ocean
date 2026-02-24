/**
 * Profile Access Log Repository Interface
 *
 * Defines the contract for recording profile view audit events.
 * Part of the hexagonal architecture - this is a PORT (interface).
 *
 * Critical: logAccess is infallible (never returns errors).
 * Failures are swallowed in the implementation — audit logging
 * must NEVER fail a user-facing request.
 *
 * @see packages/infrastructure/src/repositories/profile-access-log.drizzle.repository.ts
 */

import { Context, Effect } from "effect";

export interface ProfileAccessLogInput {
	readonly profileId: string;
	readonly accessorUserId?: string | null;
	readonly accessorIp?: string | null;
	readonly accessorUserAgent?: string | null;
	readonly action: string;
}

export class ProfileAccessLogRepository extends Context.Tag("ProfileAccessLogRepository")<
	ProfileAccessLogRepository,
	{
		readonly logAccess: (input: ProfileAccessLogInput) => Effect.Effect<void, never>;
	}
>() {}
