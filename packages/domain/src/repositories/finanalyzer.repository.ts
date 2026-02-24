/**
 * FinAnalyzer Repository Interface
 *
 * Pure interface for Sonnet-based personality evidence extraction at finalization.
 * Re-analyzes ALL conversation messages with full context for comprehensive evidence.
 *
 * Story 11.2
 */

import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import type { DomainMessage } from "../types/message";

export class FinanalyzerError extends S.TaggedError<FinanalyzerError>()("FinanalyzerError", {
	message: S.String,
}) {}

/** Message input for FinAnalyzer — uses DomainMessage shape */
export type FinanalyzerMessage = DomainMessage;

/** Single evidence item extracted by FinAnalyzer */
export interface FinalizationEvidenceOutput {
	readonly messageId: string;
	readonly bigfiveFacet: FacetName;
	readonly score: number;
	readonly confidence: number;
	readonly domain: LifeDomain;
	readonly rawDomain: string;
	readonly quote: string;
}

/** FinAnalyzer output: evidence array + token usage */
export interface FinanalyzerOutput {
	readonly evidence: readonly FinalizationEvidenceOutput[];
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

export class FinanalyzerRepository extends Context.Tag("FinanalyzerRepository")<
	FinanalyzerRepository,
	{
		readonly analyze: (params: {
			readonly messages: readonly FinanalyzerMessage[];
		}) => Effect.Effect<FinanalyzerOutput, FinanalyzerError>;
	}
>() {}
