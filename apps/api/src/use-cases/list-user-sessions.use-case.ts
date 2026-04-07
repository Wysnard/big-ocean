/**
 * List User Sessions Use Case (Story 7.13)
 *
 * Returns all assessment sessions for an authenticated user,
 * ordered by creation date descending. Includes computed message count
 * and optional archetype data from public_profile join.
 *
 * Dependencies: ConversationRepository, AppConfig
 */

import { AppConfig } from "@workspace/domain/config/app-config";
import type { DatabaseError } from "@workspace/domain/errors/http.errors";
import { ConversationRepository } from "@workspace/domain/repositories/conversation.repository";
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
): Effect.Effect<ListUserSessionsOutput, DatabaseError, ConversationRepository | AppConfig> =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const config = yield* AppConfig;
		const sessions = yield* sessionRepo.getSessionsByUserId(input.userId);

		return {
			sessions,
			freeTierMessageThreshold: config.freeTierMessageThreshold,
		};
	});
