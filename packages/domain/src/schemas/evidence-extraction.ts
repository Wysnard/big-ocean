/**
 * Evidence Extraction Schemas
 *
 * Item-level Effect Schema definitions for ConversAnalyzer evidence extraction.
 * Top-level extraction schemas (strict/lenient) live in conversanalyzer-v2-extraction.ts.
 *
 * Story 10.2 / Fix: hallucinated facet names
 * Story 42-3: v3 polarity-based extraction — LLM outputs polarity+strength, deviation derived
 */

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
	reasoning: S.String,
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
				reasoning: "",
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
	reasoning: S.String,
	bigfiveFacet: S.Literal(...ALL_FACETS),
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(500)),
});

// ─── Facet-map extraction (v4) ──────────────────────────────────────────────

/**
 * LLM output item WITHOUT bigfiveFacet — the facet is the record key.
 * Used for JSON Schema generation in facet-map mode.
 */
export const FacetMapItemJsonSchemaSource = S.Struct({
	reasoning: S.String,
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(500)),
});

/**
 * Raw LLM item without bigfiveFacet — for decode transforms.
 * Facet name is injected from the record key during decode.
 */
const FacetMapItemRawSchema = S.Struct({
	reasoning: S.String,
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	domain: S.Literal(...LIFE_DOMAINS),
	note: S.String.pipe(S.maxLength(500)),
});

export type FacetMapItemRaw = S.Schema.Type<typeof FacetMapItemRawSchema>;

// ─── Domain-facet-map extraction (v5) ──────────────────────────────────────

/**
 * LLM output item WITHOUT bigfiveFacet or domain — both are record keys.
 * Used for JSON Schema generation in domain-facet-map mode.
 * Schema: Record<DomainName, Record<FacetName, Item[]>>
 */
export const DomainFacetMapItemJsonSchemaSource = S.Struct({
	reasoning: S.String,
	polarity: S.Literal("high", "low"),
	strength: S.Literal("weak", "moderate", "strong"),
	confidence: S.Literal("low", "medium", "high"),
	note: S.String.pipe(S.maxLength(500)),
});

export type DomainFacetMapItemRaw = S.Schema.Type<typeof DomainFacetMapItemJsonSchemaSource>;
