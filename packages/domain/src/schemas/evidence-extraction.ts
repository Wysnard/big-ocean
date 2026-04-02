/**
 * Evidence Extraction Schemas
 *
 * Effect Schema definitions for ConversAnalyzer structured output.
 * Provides both strict schemas (for JSON Schema generation sent to the LLM)
 * and a lenient schema (for resilient parsing that filters invalid items).
 *
 * Story 10.2 / Fix: hallucinated facet names
 * Story 42-3: v3 polarity-based extraction — LLM outputs polarity+strength, deviation derived
 */

import { Either, JSONSchema } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { FacetName } from "../constants/big-five";
import { ALL_FACETS } from "../constants/big-five";
import { LIFE_DOMAINS } from "../constants/life-domain";
import { deriveDeviation } from "../utils/derive-deviation";

/**
 * Remap known LLM hallucinated facet names to their closest valid Big Five facet.
 * The model persistently invents facet names outside the 30-facet enum.
 * Instead of discarding the evidence, we recover it by mapping to the correct facet.
 */
export const FACET_REMAP: Record<string, FacetName> = {
	autonomy: "liberalism",
	independence: "liberalism",
	contentment: "cheerfulness",
	intellectualism: "intellect",
	intellectual_curiosity: "intellect",
	emotional_awareness: "emotionality",
	emotions: "emotionality",
	honesty: "morality",
	ethics: "morality",
	open_mindedness: "liberalism",
	progressivism: "liberalism",
	hostility: "anger",
	irritability: "anger",
	positivity: "cheerfulness",
	optimism: "cheerfulness",
	introversion: "gregariousness",
	extraversion: "gregariousness",
	cautious: "cautiousness",
	self_control: "self_discipline",
	impulsivity: "immoderation",
	warmth: "friendliness",
};

/**
 * ConversAnalyzer v1 energy levels — categorical classification used by
 * the existing ConversAnalyzer output schema. Will be replaced by
 * EnergyBand (5-level) in ConversAnalyzer v2 (Story 2.1).
 */
const OBSERVED_ENERGY_LEVELS = ["light", "medium", "heavy"] as const;

// ─── Facet name schema with remap ────────────────────────────────────────────

const ALL_FACETS_SET: ReadonlySet<string> = new Set(ALL_FACETS);

/**
 * Schema that accepts valid facet names OR known hallucinated aliases,
 * remapping aliases to their canonical facet name during decode.
 * Annotated so JSONSchema.make still emits the original enum constraint.
 */
const FacetNameSchema = S.transformOrFail(S.String, S.Literal(...ALL_FACETS), {
	strict: true,
	decode: (raw, _, ast) => {
		if (ALL_FACETS_SET.has(raw)) return ParseResult.succeed(raw as FacetName);
		const remapped = FACET_REMAP[raw];
		if (remapped) return ParseResult.succeed(remapped);
		return ParseResult.fail(new ParseResult.Type(ast, raw, `Unknown facet: "${raw}"`));
	},
	encode: (facet) => ParseResult.succeed(facet),
});

// ─── Per-item raw schema (LLM output: polarity+strength, no deviation) ────

const EvidenceItemRawSchema = S.Struct({
	bigfiveFacet: FacetNameSchema,
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(500)),
});

/** Output type with deviation derived from polarity+strength */
export const EvidenceItemDecodedSchema = S.Struct({
	bigfiveFacet: S.Literal(...ALL_FACETS),
	deviation: S.Int.pipe(S.between(-3, 3)),
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(500)),
});

/**
 * Evidence item decode schema — LLM outputs polarity+strength,
 * deviation is derived via deriveDeviation().
 */
export const EvidenceItemSchema = S.transformOrFail(
	EvidenceItemRawSchema,
	EvidenceItemDecodedSchema,
	{
		strict: true,
		decode: (raw) => {
			const deviation = deriveDeviation(raw.polarity, raw.strength);

			return ParseResult.succeed({
				bigfiveFacet: raw.bigfiveFacet,
				deviation,
				polarity: raw.polarity,
				strength: raw.strength,
				confidence: raw.confidence,
				domain: raw.domain,
				note: raw.note,
			});
		},
		encode: (typed) =>
			ParseResult.succeed({
				bigfiveFacet: typed.bigfiveFacet,
				polarity: typed.polarity,
				strength: typed.strength,
				confidence: typed.confidence,
				domain: typed.domain,
				note: typed.note,
			}),
	},
);

export type EvidenceItem = S.Schema.Type<typeof EvidenceItemDecodedSchema>;

/**
 * JSON Schema source for the v3 extraction prompt — polarity-based output.
 * Polarity is required, deviation is NOT included (LLM outputs polarity+strength only).
 * Used exclusively for JSON Schema generation so the LLM sees the correct tool schema.
 *
 * Story 42-3: v3 polarity-based extraction
 */
export const EvidenceItemJsonSchemaSource = S.Struct({
	bigfiveFacet: S.Literal(...ALL_FACETS),
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(500)),
});

// ─── Strict schema (used for JSON Schema generation → sent to LLM) ──────────

export const EvidenceExtractionSchema = S.Struct({
	evidence: S.Array(EvidenceItemSchema),
	observedEnergyLevel: S.Literal(...OBSERVED_ENERGY_LEVELS),
});

export type EvidenceExtraction = S.Schema.Type<typeof EvidenceExtractionSchema>;

/** JSON Schema for Anthropic tool input_schema — uses Literal enum for bigfiveFacet */
export const evidenceExtractionJsonSchema = JSONSchema.make(
	S.Struct({
		evidence: S.Array(EvidenceItemJsonSchemaSource),
		observedEnergyLevel: S.Literal(...OBSERVED_ENERGY_LEVELS),
	}),
);

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
