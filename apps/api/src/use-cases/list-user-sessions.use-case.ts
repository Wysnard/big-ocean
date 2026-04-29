/**
 * List User Sessions Use Case (Story 7.13)
 *
 * Returns all assessment sessions for an authenticated user,
 * ordered by creation date descending. Includes computed message count
 * and optional archetype data from public_profile join.
 *
 * Dependencies: ConversationRepository, AppConfig
 */

import { buildFacetScoresMap, deriveAssessmentSurfaceFromFacetScores } from "@workspace/domain";
import { AppConfig } from "@workspace/domain/config/app-config";
import type { DatabaseError } from "@workspace/domain/errors/http.errors";
import { AssessmentResultRepository } from "@workspace/domain/repositories/assessment-result.repository";
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
	readonly assessmentTurnCount: number;
}

export const listUserSessions = (
	input: ListUserSessionsInput,
): Effect.Effect<
	ListUserSessionsOutput,
	DatabaseError,
	ConversationRepository | AppConfig | AssessmentResultRepository
> =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const config = yield* AppConfig;
		const resultRepo = yield* AssessmentResultRepository;
		const sessions = yield* sessionRepo.getSessionsByUserId(input.userId);

		const enrichedSessions = yield* Effect.forEach(sessions, (session) =>
			Effect.gen(function* () {
				const result = yield* resultRepo
					.getBySessionId(session.id)
					.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null)));

				let oceanCode5: string | null = null;
				let archetypeName: string | null = null;
				if (result && Object.keys(result.facets).length > 0) {
					const projection = deriveAssessmentSurfaceFromFacetScores(buildFacetScoresMap(result.facets));
					oceanCode5 = projection.oceanCode5;
					archetypeName = projection.archetype.name;
				}

				return {
					...session,
					oceanCode5,
					archetypeName,
				};
			}),
		);

		return {
			sessions: enrichedSessions,
			assessmentTurnCount: config.assessmentTurnCount,
		};
	});
