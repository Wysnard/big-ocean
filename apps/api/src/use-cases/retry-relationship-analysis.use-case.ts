/**
 * Retry Relationship Analysis Use Case (Story 35-2)
 *
 * Manual retry for failed relationship analysis generation.
 * Validates user authorization, checks analysis state, and forks new daemon.
 *
 * Follows retry-portrait.use-case.ts pattern.
 */

import {
	LoggerRepository,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisRepository,
	RelationshipAnalysisUnauthorizedError,
} from "@workspace/domain";
import { Effect } from "effect";
import { generateRelationshipAnalysis } from "./generate-relationship-analysis.use-case";

export interface RetryRelationshipAnalysisInput {
	readonly analysisId: string;
	readonly userId: string;
}

export interface RetryRelationshipAnalysisOutput {
	readonly status: "generating" | "ready";
}

export const retryRelationshipAnalysis = (input: RetryRelationshipAnalysisInput) =>
	Effect.gen(function* () {
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const logger = yield* LoggerRepository;

		// 1. Load analysis
		const analysis = yield* analysisRepo.getById(input.analysisId);

		if (!analysis) {
			return yield* Effect.fail(
				new RelationshipAnalysisNotFoundError({
					message: `Relationship analysis not found: ${input.analysisId}`,
				}),
			);
		}

		// 2. Authorization: user must be participant
		if (analysis.userAId !== input.userId && analysis.userBId !== input.userId) {
			return yield* Effect.fail(
				new RelationshipAnalysisUnauthorizedError({
					message: "You are not authorized to retry this analysis",
				}),
			);
		}

		// 3. If analysis already has content, return ready
		if (analysis.content !== null) {
			return { status: "ready" as const } satisfies RetryRelationshipAnalysisOutput;
		}

		// 4. Log and fork a new generation daemon (retryCount is not reset — daemon increments on failure)
		logger.info("Manual relationship analysis retry: spawning generation daemon", {
			analysisId: input.analysisId,
			previousRetryCount: analysis.retryCount,
		});

		// 5. Fork daemon with existing analysis ID
		yield* Effect.forkDaemon(
			generateRelationshipAnalysis({
				analysisId: analysis.id,
				inviterUserId: analysis.userAId,
				inviteeUserId: analysis.userBId,
			}),
		);

		return { status: "generating" as const } satisfies RetryRelationshipAnalysisOutput;
	});
