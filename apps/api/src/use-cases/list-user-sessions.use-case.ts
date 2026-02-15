/**
 * List User Sessions Use Case (Story 7.13)
 *
 * Returns all assessment sessions for an authenticated user,
 * ordered by creation date descending. Includes computed message count
 * and optional archetype data from public_profile join.
 *
 * Dependencies: AssessmentSessionRepository, AppConfig
 */

import { AppConfig } from "@workspace/domain/config/app-config";
import type { DatabaseError } from "@workspace/domain/errors/http.errors";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { Effect } from "effect";

export interface ListUserSessionsInput {
	readonly userId: string;
}

export interface ListUserSessionsOutput {
	readonly sessions: Array<{
		id: string;
		createdAt: Date;
		updatedAt: Date;
		status: string;
		messageCount: number;
		oceanCode5: string | null;
		archetypeName: string | null;
	}>;
	readonly freeTierMessageThreshold: number;
}

export const listUserSessions = (
	input: ListUserSessionsInput,
): Effect.Effect<ListUserSessionsOutput, DatabaseError, AssessmentSessionRepository | AppConfig> =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const config = yield* AppConfig;
		const sessions = yield* sessionRepo.getSessionsByUserId(input.userId);

		return {
			sessions,
			freeTierMessageThreshold: config.freeTierMessageThreshold,
		};
	});
