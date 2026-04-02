/**
 * ConversAnalyzer Extraction Schemas
 *
 * Effect Schema definitions for split ConversAnalyzer structured output.
 * Two independent LLM calls: user state + evidence.
 *
 * Provides per-call:
 * - Strict schema: all-or-nothing validation (for Tier 1 retry)
 * - Lenient schema: independent field parsing with defaults (for Tier 2 fallback)
 *
 * Story 24-1, Story 42-2 (split calls)
 */

import { Either, JSONSchema } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { ENERGY_BANDS, TELLING_BANDS } from "../types/pacing";
import type { EvidenceItem } from "./evidence-extraction";
import { EvidenceItemJsonSchemaSource, EvidenceItemSchema } from "./evidence-extraction";

// ─── UserState schema ────────────────────────────────────────────────────────

export const UserStateSchema = S.Struct({
	energyBand: S.Literal(...ENERGY_BANDS),
	tellingBand: S.Literal(...TELLING_BANDS),
	energyReason: S.String.pipe(S.maxLength(500)),
	tellingReason: S.String.pipe(S.maxLength(500)),
	withinMessageShift: S.Boolean,
});

export type UserState = S.Schema.Type<typeof UserStateSchema>;

/** Default userState values for lenient fallback */
const DEFAULT_USER_STATE: UserState = {
	energyBand: "steady",
	tellingBand: "mixed",
	energyReason: "",
	tellingReason: "",
	withinMessageShift: false,
};

// ─── UserState-only schemas ─────────────────────────────────────────────────

// --- UserState-only strict schema ---

export const UserStateOnlyToolOutput = UserStateSchema;

export type UserStateOnlyExtraction = S.Schema.Type<typeof UserStateSchema>;

/** JSON Schema for Anthropic tool input_schema — user state only */
export const userStateOnlyJsonSchema = JSONSchema.make(UserStateSchema);

// --- UserState-only lenient schema ---

/** Raw schema that accepts unknown fields for lenient user state parsing */
const RawUserStateOnlySchema = S.Unknown;

const DecodedUserStateOnlySchema = UserStateSchema;

export const LenientUserStateOnlyToolOutput = S.transformOrFail(
	RawUserStateOnlySchema,
	DecodedUserStateOnlySchema,
	{
		strict: true,
		decode: (raw) => {
			const rawState = raw as Record<string, unknown> | null | undefined;

			let energyBand = DEFAULT_USER_STATE.energyBand;
			let tellingBand = DEFAULT_USER_STATE.tellingBand;
			let energyReason = DEFAULT_USER_STATE.energyReason;
			let tellingReason = DEFAULT_USER_STATE.tellingReason;
			let withinMessageShift = DEFAULT_USER_STATE.withinMessageShift;

			if (rawState && typeof rawState === "object") {
				const energyResult = S.decodeUnknownEither(S.Literal(...ENERGY_BANDS))(rawState.energyBand);
				if (Either.isRight(energyResult)) {
					energyBand = energyResult.right;
				}

				const tellingResult = S.decodeUnknownEither(S.Literal(...TELLING_BANDS))(rawState.tellingBand);
				if (Either.isRight(tellingResult)) {
					tellingBand = tellingResult.right;
				}

				const reasonSchema = S.String.pipe(S.maxLength(500));
				const energyReasonResult = S.decodeUnknownEither(reasonSchema)(rawState.energyReason);
				if (Either.isRight(energyReasonResult)) {
					energyReason = energyReasonResult.right;
				}

				const tellingReasonResult = S.decodeUnknownEither(reasonSchema)(rawState.tellingReason);
				if (Either.isRight(tellingReasonResult)) {
					tellingReason = tellingReasonResult.right;
				}

				const shiftResult = S.decodeUnknownEither(S.Boolean)(rawState.withinMessageShift);
				if (Either.isRight(shiftResult)) {
					withinMessageShift = shiftResult.right;
				}
			}

			return ParseResult.succeed({
				energyBand,
				tellingBand,
				energyReason,
				tellingReason,
				withinMessageShift,
			} satisfies UserState);
		},
		encode: (typed) => ParseResult.succeed(typed as unknown),
	},
);

/** Decode user state with strict schema — all-or-nothing */
export const decodeUserStateStrict = S.decodeUnknownSync(UserStateOnlyToolOutput);

/** Decode user state with lenient schema — independent field parsing with defaults */
export const decodeUserStateLenient = S.decodeUnknownSync(LenientUserStateOnlyToolOutput);

// --- Evidence-only strict schema ---

const RawStrictEvidenceOnlySchema = S.Struct({
	evidence: S.Array(S.Unknown),
});

const DecodedEvidenceOnlySchema = S.Struct({
	evidence: S.Array(EvidenceItemSchema),
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
