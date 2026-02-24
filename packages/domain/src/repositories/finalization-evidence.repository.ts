/**
 * Finalization Evidence Repository Interface
 *
 * Persistence for rich evidence produced by FinAnalyzer (Sonnet) during finalization.
 * Separate from ConversationEvidence — different schema, purpose, and lifecycle.
 *
 * Story 11.2
 */

import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";

export class FinalizationEvidenceError extends S.TaggedError<FinalizationEvidenceError>()(
	"FinalizationEvidenceError",
	{ message: S.String },
) {}

/** Full record as stored in DB */
export interface FinalizationEvidenceRecord {
	readonly id: string;
	readonly assessmentMessageId: string;
	readonly assessmentResultId: string;
	readonly bigfiveFacet: FacetName;
	readonly score: number;
	readonly confidence: number;
	readonly domain: LifeDomain;
	readonly rawDomain: string;
	readonly quote: string;
	readonly highlightStart: number | null;
	readonly highlightEnd: number | null;
	readonly createdAt: Date;
}

/** Input for batch insert (no id/createdAt — DB generates) */
export interface FinalizationEvidenceInput {
	readonly assessmentMessageId: string;
	readonly assessmentResultId: string;
	readonly bigfiveFacet: FacetName;
	readonly score: number;
	readonly confidence: number;
	readonly domain: LifeDomain;
	readonly rawDomain: string;
	readonly quote: string;
	readonly highlightStart: number | null;
	readonly highlightEnd: number | null;
}

export class FinalizationEvidenceRepository extends Context.Tag("FinalizationEvidenceRepository")<
	FinalizationEvidenceRepository,
	{
		readonly saveBatch: (
			evidence: readonly FinalizationEvidenceInput[],
		) => Effect.Effect<void, FinalizationEvidenceError>;
		readonly getByResultId: (
			assessmentResultId: string,
		) => Effect.Effect<readonly FinalizationEvidenceRecord[], FinalizationEvidenceError>;
		readonly existsForSession: (
			sessionId: string,
		) => Effect.Effect<boolean, FinalizationEvidenceError>;
	}
>() {}
