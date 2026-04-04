/**
 * ConversAnalyzer Extraction Schemas
 *
 * Effect Schema definitions for ConversAnalyzer evidence extraction structured output.
 * User-state schemas removed in Story 43-6 (Director reads energy/telling natively).
 *
 * Provides:
 * - Strict schema: all-or-nothing validation (for Tier 1 retry)
 * - Lenient schema: independent field parsing with defaults (for Tier 2 fallback)
 *
 * Story 24-1, Story 42-2 (split calls), Story 43-6 (strip user-state)
 */

import { Either, JSONSchema } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { EvidenceItem } from "./evidence-extraction";
import {
	EvidenceItemDecodedSchema,
	EvidenceItemJsonSchemaSource,
	EvidenceItemSchema,
} from "./evidence-extraction";

// --- Evidence-only strict schema ---

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

/** JSON Schema for Anthropic tool input_schema — evidence only */
export const evidenceOnlyJsonSchema = JSONSchema.make(
	S.Struct({
		evidence: S.Array(EvidenceItemJsonSchemaSource),
	}),
);

// --- Evidence-only lenient schema ---

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
