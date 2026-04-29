/**
 * Get Assessment Results Use Case
 *
 * Business logic for retrieving final assessment results after the session is completed.
 * Read-only for scores and **Assessment surface** — public profile rows are created during
 * Assessment Finalization (`ensurePublicProfileForSession` in `generateResults`).
 *
 * Dependencies: ConversationRepository, AssessmentResultRepository, MessageRepository,
 * PublicProfileRepository (read), AppConfig, LoggerRepository
 */

import {
	AppConfig,
	type FacetResult,
	LoggerRepository,
	type OceanCode4,
	OceanCode4Schema,
	type OceanCode5,
	OceanCode5Schema,
	PublicProfileNotProvisioned,
	PublicProfileRepository,
	type TraitResult,
} from "@workspace/domain";
import { Effect } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";
import { assembleCompletedSessionResults } from "./get-results/assemble-completed-session-results";

export interface GetResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
}

export interface GetResultsOutput {
	readonly oceanCode5: OceanCode5;
	readonly oceanCode4: OceanCode4;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly archetypeColor: string;
	readonly isCurated: boolean;
	readonly traits: readonly TraitResult[];
	readonly facets: readonly FacetResult[];
	readonly overallConfidence: number;
	readonly messageCount: number;
	readonly publicProfileId: string;
	readonly shareableUrl: string;
	readonly isPublic: boolean;
	readonly isLatestVersion: boolean;
}

export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const profileRepo = yield* PublicProfileRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		yield* requireAuthenticatedConversation({
			sessionId: input.sessionId,
			authenticatedUserId: input.authenticatedUserId,
			policy: "completed-read",
		});

		const assembled = yield* assembleCompletedSessionResults({
			sessionId: input.sessionId,
			authenticatedUserId: input.authenticatedUserId,
		});

		const existingProfile = yield* profileRepo.getProfileBySessionId(input.sessionId);
		if (existingProfile === null) {
			return yield* Effect.fail(
				new PublicProfileNotProvisioned({
					sessionId: input.sessionId,
					message: "Public profile row missing after Assessment Finalization",
				}),
			);
		}

		logger.info("Assessment results retrieved", {
			sessionId: input.sessionId,
			oceanCode5: assembled.oceanCode5,
			oceanCode4: assembled.oceanCode4,
			archetypeName: assembled.archetypeName,
			overallConfidence: assembled.overallConfidence,
		});

		return {
			oceanCode5: OceanCode5Schema.make(assembled.oceanCode5),
			oceanCode4: OceanCode4Schema.make(assembled.oceanCode4),
			archetypeName: assembled.archetypeName,
			archetypeDescription: assembled.archetypeDescription,
			archetypeColor: assembled.archetypeColor,
			isCurated: assembled.isCurated,
			traits: assembled.traits,
			facets: assembled.facets,
			overallConfidence: assembled.overallConfidence,
			messageCount: assembled.messageCount,
			publicProfileId: existingProfile.id,
			shareableUrl: `${config.frontendUrl}/public-profile/${existingProfile.id}`,
			isPublic: existingProfile.isPublic,
			isLatestVersion: assembled.isLatestVersion,
		} satisfies GetResultsOutput;
	});
