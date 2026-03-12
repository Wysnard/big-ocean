/**
 * Evidence Extraction Schemas
 *
 * Effect Schema definitions for ConversAnalyzer structured output.
 * Provides both strict schemas (for JSON Schema generation sent to the LLM)
 * and a lenient schema (for resilient parsing that filters invalid items).
 *
 * Story 10.2 / Fix: hallucinated facet names
 */

import { Either, JSONSchema } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { ALL_FACETS } from "../constants/big-five";
import { LIFE_DOMAINS } from "../constants/life-domain";

/**
 * ConversAnalyzer v1 energy levels — categorical classification used by
 * the existing ConversAnalyzer output schema. Will be replaced by
 * EnergyBand (5-level) in ConversAnalyzer v2 (Story 2.1).
 */
const OBSERVED_ENERGY_LEVELS = ["light", "medium", "heavy"] as const;

// ─── Per-item schema ─────────────────────────────────────────────────────────

export const EvidenceItemSchema = S.Struct({
	bigfiveFacet: S.Literal(...ALL_FACETS),
	deviation: S.Int.pipe(S.between(-3, 3)),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(200)),
});

export type EvidenceItem = S.Schema.Type<typeof EvidenceItemSchema>;

// ─── Strict schema (used for JSON Schema generation → sent to LLM) ──────────

export const EvidenceExtractionSchema = S.Struct({
	evidence: S.Array(EvidenceItemSchema),
	observedEnergyLevel: S.Literal(...OBSERVED_ENERGY_LEVELS),
});

export type EvidenceExtraction = S.Schema.Type<typeof EvidenceExtractionSchema>;

/** JSON Schema for Anthropic tool input_schema */
export const evidenceExtractionJsonSchema = JSONSchema.make(EvidenceExtractionSchema);

// ─── Lenient schema (filters invalid items instead of rejecting all) ─────────

const RawExtractionSchema = S.Struct({
	evidence: S.Array(S.Unknown),
	observedEnergyLevel: S.Literal(...OBSERVED_ENERGY_LEVELS),
});

/**
 * Lenient schema that filters out invalid evidence items instead of rejecting
 * the entire extraction. This prevents hallucinated facet names from causing
 * total evidence loss.
 */
export const LenientEvidenceExtractionSchema = S.transformOrFail(
	RawExtractionSchema,
	EvidenceExtractionSchema,
	{
		strict: true,
		decode: (raw) => {
			const decodeItem = S.decodeUnknownEither(EvidenceItemSchema);
			const validItems: Array<EvidenceItem> = [];
			for (const item of raw.evidence) {
				const result = decodeItem(item);
				if (Either.isRight(result)) {
					validItems.push(result.right);
				}
			}
			return ParseResult.succeed({
				evidence: validItems,
				observedEnergyLevel: raw.observedEnergyLevel,
			});
		},
		encode: (typed) => ParseResult.succeed(typed),
	},
);

/** Validate LLM output with lenient evidence filtering */
export const decodeEvidenceExtraction = S.decodeUnknownSync(LenientEvidenceExtractionSchema);
