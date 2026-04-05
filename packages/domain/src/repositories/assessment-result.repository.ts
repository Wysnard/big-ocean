/**
 * Assessment Result Repository Interface
 *
 * Persistence for final scored results from the finalization pipeline.
 * Phase 1 creates placeholder rows; Phase 2 (Story 11.3) fills in scores.
 *
 * Story 11.2
 */

import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { FacetName, TraitName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";

export class AssessmentResultError extends S.TaggedError<AssessmentResultError>()(
	"AssessmentResultError",
	{ message: S.String },
) {}

export type ResultStage = "scored" | "completed";

export interface AssessmentResultRecord {
	readonly id: string;
	readonly assessmentSessionId: string;
	readonly facets: Record<FacetName, { score: number; confidence: number }> | Record<string, never>;
	readonly traits: Record<TraitName, { score: number; confidence: number }> | Record<string, never>;
	readonly domainCoverage: Record<LifeDomain, number> | Record<string, never>;
	readonly portrait: string;
	readonly stage: ResultStage | null;
	readonly createdAt: Date;
}

export interface AssessmentResultInput {
	readonly assessmentSessionId: string;
	readonly facets: Record<FacetName, { score: number; confidence: number }> | Record<string, never>;
	readonly traits: Record<TraitName, { score: number; confidence: number }> | Record<string, never>;
	readonly domainCoverage: Record<LifeDomain, number> | Record<string, never>;
	readonly portrait: string;
	readonly stage?: ResultStage | null;
}

export type AssessmentResultUpdateInput = Partial<
	Pick<AssessmentResultInput, "facets" | "traits" | "domainCoverage" | "portrait">
>;

export class AssessmentResultRepository extends Context.Tag("AssessmentResultRepository")<
	AssessmentResultRepository,
	{
		readonly create: (
			input: AssessmentResultInput,
		) => Effect.Effect<AssessmentResultRecord, AssessmentResultError>;
		readonly getBySessionId: (
			sessionId: string,
		) => Effect.Effect<AssessmentResultRecord | null, AssessmentResultError>;
		readonly update: (
			id: string,
			input: AssessmentResultUpdateInput,
		) => Effect.Effect<AssessmentResultRecord, AssessmentResultError>;
		readonly upsert: (
			input: AssessmentResultInput,
		) => Effect.Effect<AssessmentResultRecord, AssessmentResultError>;
		readonly updateStage: (
			sessionId: string,
			stage: ResultStage,
		) => Effect.Effect<AssessmentResultRecord, AssessmentResultError>;

		/**
		 * Get the most recent completed assessment result for a user (Story 36-3).
		 * JOINs through assessment_session to find results by userId.
		 * Returns null if user has no completed results.
		 *
		 * @param userId - Authenticated user ID
		 */
		readonly getLatestByUserId: (
			userId: string,
		) => Effect.Effect<AssessmentResultRecord | null, AssessmentResultError>;
	}
>() {}
