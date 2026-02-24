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

export interface AssessmentResultRecord {
	readonly id: string;
	readonly assessmentSessionId: string;
	readonly facets:
		| Record<FacetName, { score: number; confidence: number; signalPower: number }>
		| Record<string, never>;
	readonly traits:
		| Record<TraitName, { score: number; confidence: number; signalPower: number }>
		| Record<string, never>;
	readonly domainCoverage: Record<LifeDomain, number> | Record<string, never>;
	readonly portrait: string;
	readonly createdAt: Date;
}

export interface AssessmentResultInput {
	readonly assessmentSessionId: string;
	readonly facets:
		| Record<FacetName, { score: number; confidence: number; signalPower: number }>
		| Record<string, never>;
	readonly traits:
		| Record<TraitName, { score: number; confidence: number; signalPower: number }>
		| Record<string, never>;
	readonly domainCoverage: Record<LifeDomain, number> | Record<string, never>;
	readonly portrait: string;
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
	}
>() {}
