/**
 * ConversAnalyzer Extraction Schemas
 *
 * Effect Schema definitions for ConversAnalyzer evidence extraction structured output.
 * User-state schemas removed in Story 43-6 (Director reads energy/telling natively).
 *
 * Provides:
 * - Flat schemas (v3): strict/lenient flat evidence array — legacy, used by existing pipeline
 * - Facet-map schemas (v4): Record<FacetName, Item[]> — forces LLM to consider all 30 facets
 * - Domain-facet-map schemas (v5): Record<DomainName, Record<FacetName, Item[]>> — forces LLM to consider all domains × facets
 *
 * Story 24-1, Story 42-2 (split calls), Story 43-6 (strip user-state)
 */

import { Either, JSONSchema } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { ALL_FACETS } from "../constants/big-five";
import { LIFE_DOMAINS } from "../constants/life-domain";
import type { EvidenceItem } from "./evidence-extraction";
import {
	DomainFacetMapItemJsonSchemaSource,
	type DomainFacetMapItemRaw,
	EvidenceItemDecodedSchema,
	EvidenceItemJsonSchemaSource,
	EvidenceItemSchema,
	FacetMapItemJsonSchemaSource,
	type FacetMapItemRaw,
} from "./evidence-extraction";

// ─── Flat evidence schemas (v3 — legacy) ────────────────────────────────────

const RawStrictEvidenceOnlySchema = S.Struct({
	evidence: S.Array(S.Unknown),
});

const DecodedEvidenceOnlySchema = S.Struct({
	evidence: S.Array(EvidenceItemDecodedSchema),
});

export const EvidenceOnlyToolOutput = S.transformOrFail(
	RawStrictEvidenceOnlySchema,
	DecodedEvidenceOnlySchema,
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
			return ParseResult.succeed({ evidence: validItems });
		},
		encode: (typed) => ParseResult.succeed(typed),
	},
);

export type EvidenceOnlyExtraction = S.Schema.Type<typeof DecodedEvidenceOnlySchema>;

/** JSON Schema for Anthropic tool input_schema — flat evidence array */
export const evidenceOnlyJsonSchema = JSONSchema.make(
	S.Struct({
		evidence: S.Array(EvidenceItemJsonSchemaSource),
	}),
);

const RawLenientEvidenceOnlySchema = S.Struct({
	evidence: S.Array(S.Unknown),
});

export const LenientEvidenceOnlyToolOutput = S.transformOrFail(
	RawLenientEvidenceOnlySchema,
	DecodedEvidenceOnlySchema,
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
			return ParseResult.succeed({ evidence: validItems });
		},
		encode: (typed) => ParseResult.succeed(typed),
	},
);

/** Decode evidence with strict schema */
export const decodeEvidenceStrict = S.decodeUnknownSync(EvidenceOnlyToolOutput);

/** Decode evidence with lenient schema — filters invalid items */
export const decodeEvidenceLenient = S.decodeUnknownSync(LenientEvidenceOnlyToolOutput);

// ─── Facet-map schemas (v4) ─────────────────────────────────────────────────

/**
 * JSON Schema for facet-map extraction — Record<FacetName, Item[]>.
 * All 30 facets are required keys. Empty array = no evidence found.
 * Items do NOT contain bigfiveFacet — the key IS the facet.
 */
export const facetMapJsonSchema = JSONSchema.make(
	S.Record({
		key: S.Literal(...ALL_FACETS),
		value: S.Array(FacetMapItemJsonSchemaSource),
	}),
);

/**
 * Raw facet-map schema — accepts Record<string, unknown[]> from LLM.
 * Each key is a facet name, each value is an array of raw evidence items.
 */
const RawFacetMapSchema = S.Record({
	key: S.String,
	value: S.Array(S.Unknown),
});

/**
 * Facet-map transform: Record<FacetName, RawItem[]> → { evidence: EvidenceItem[] }.
 * Iterates all 30 facet keys, injects bigfiveFacet from the key, derives deviation.
 * Lenient — skips individual items that fail validation, keeps valid ones.
 * Downstream pipeline receives the same { evidence: EvidenceItem[] } shape.
 */
export const FacetMapToolOutput = S.transformOrFail(RawFacetMapSchema, DecodedEvidenceOnlySchema, {
	strict: true,
	decode: (raw) => {
		const record = raw as Record<string, readonly unknown[]>;
		const validItems: Array<EvidenceItem> = [];

		for (const facet of ALL_FACETS) {
			const items = record[facet];
			if (!Array.isArray(items)) continue;

			for (const item of items) {
				if (typeof item !== "object" || item === null) continue;
				const rawItem = item as FacetMapItemRaw;

				// Inject bigfiveFacet from key + build full raw item for EvidenceItemSchema
				const fullItem = { ...rawItem, bigfiveFacet: facet, reasoning: rawItem.reasoning ?? "" };
				const result = S.decodeUnknownEither(EvidenceItemSchema)(fullItem);
				if (Either.isRight(result)) {
					validItems.push(result.right);
				}
			}
		}

		return ParseResult.succeed({ evidence: validItems });
	},
	encode: (typed) =>
		ParseResult.succeed(
			Object.fromEntries(
				ALL_FACETS.map((facet) => [
					facet,
					typed.evidence
						.filter((e) => e.bigfiveFacet === facet)
						.map((e) => ({
							reasoning: "",
							polarity: e.polarity,
							strength: e.strength,
							confidence: e.confidence,
							domain: e.domain,
							note: e.note,
						})),
				]),
			) as Record<string, readonly unknown[]>,
		),
});

/** Decode facet-map LLM output → { evidence: EvidenceItem[] } */
export const decodeFacetMap = S.decodeUnknownSync(FacetMapToolOutput);

// ─── Domain-facet-map schemas (v5) ─────────────────────────────────────────

/**
 * JSON Schema for domain-facet-map extraction — Record<DomainName, Record<FacetName, Item[]>>.
 * All 6 domains are required outer keys. All 30 facets are required inner keys.
 * Items do NOT contain bigfiveFacet or domain — both are derived from keys.
 */
export const domainFacetMapJsonSchema = JSONSchema.make(
	S.Record({
		key: S.Literal(...LIFE_DOMAINS),
		value: S.Record({
			key: S.Literal(...ALL_FACETS),
			value: S.Array(DomainFacetMapItemJsonSchemaSource),
		}),
	}),
);

/**
 * Raw domain-facet-map schema — accepts Record<string, Record<string, unknown[]>> from LLM.
 */
const RawDomainFacetMapSchema = S.Record({
	key: S.String,
	value: S.Record({
		key: S.String,
		value: S.Array(S.Unknown),
	}),
});

/**
 * Domain-facet-map transform: Record<Domain, Record<Facet, Item[]>> → { evidence: EvidenceItem[] }.
 * Iterates all domains × all facets, injects both from keys.
 * Lenient — skips individual items that fail validation, keeps valid ones.
 * Downstream pipeline receives the same { evidence: EvidenceItem[] } shape.
 */
export const DomainFacetMapToolOutput = S.transformOrFail(
	RawDomainFacetMapSchema,
	DecodedEvidenceOnlySchema,
	{
		strict: true,
		decode: (raw) => {
			const outerRecord = raw as Record<string, Record<string, readonly unknown[]>>;
			const validItems: Array<EvidenceItem> = [];

			for (const domain of LIFE_DOMAINS) {
				const facetRecord = outerRecord[domain];
				if (typeof facetRecord !== "object" || facetRecord === null) continue;

				for (const facet of ALL_FACETS) {
					const items = facetRecord[facet];
					if (!Array.isArray(items)) continue;

					for (const item of items) {
						if (typeof item !== "object" || item === null) continue;
						const rawItem = item as DomainFacetMapItemRaw;

						// Inject domain from outer key + facet from inner key
						const fullItem = {
							...rawItem,
							bigfiveFacet: facet,
							domain,
							reasoning: rawItem.reasoning ?? "",
						};
						const result = S.decodeUnknownEither(EvidenceItemSchema)(fullItem);
						if (Either.isRight(result)) {
							validItems.push(result.right);
						}
					}
				}
			}

			return ParseResult.succeed({ evidence: validItems });
		},
		encode: (typed) => {
			const result: Record<string, Record<string, unknown[]>> = {};
			for (const domain of LIFE_DOMAINS) {
				const facetRecord: Record<string, unknown[]> = {};
				for (const facet of ALL_FACETS) {
					facetRecord[facet] = typed.evidence
						.filter((e) => e.domain === domain && e.bigfiveFacet === facet)
						.map((e) => ({
							reasoning: "",
							polarity: e.polarity,
							strength: e.strength,
							confidence: e.confidence,
							note: e.note,
						}));
				}
				result[domain] = facetRecord;
			}
			return ParseResult.succeed(result as Record<string, Record<string, readonly unknown[]>>);
		},
	},
);

/** Decode domain-facet-map LLM output → { evidence: EvidenceItem[] } */
export const decodeDomainFacetMap = S.decodeUnknownSync(DomainFacetMapToolOutput);
