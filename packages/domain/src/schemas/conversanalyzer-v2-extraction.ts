/**
 * ConversAnalyzer v2 Extraction Schemas
 *
 * Effect Schema definitions for ConversAnalyzer v2 structured output.
 * v2 adds dual extraction: userState (energy + telling) alongside evidence.
 *
 * Provides:
 * - Strict schema: all-or-nothing validation (for Tier 1 retry)
 * - Lenient schema: independent field parsing with defaults (for Tier 2 fallback)
 *
 * Story 24-1: ConversAnalyzer v2 Schemas & Repository Methods
 */

import { Either, JSONSchema } from "effect";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { ENERGY_BANDS, TELLING_BANDS } from "../types/pacing";
import type { EvidenceItem } from "./evidence-extraction";
import { EvidenceItemSchema } from "./evidence-extraction";

// ─── UserState schema ────────────────────────────────────────────────────────

export const UserStateSchema = S.Struct({
	energyBand: S.Literal(...ENERGY_BANDS),
	tellingBand: S.Literal(...TELLING_BANDS),
	energyReason: S.String.pipe(S.maxLength(500)),
	tellingReason: S.String.pipe(S.maxLength(500)),
	withinMessageShift: S.Boolean,
});

export type UserState = S.Schema.Type<typeof UserStateSchema>;

// ─── Strict schema (all-or-nothing validation) ──────────────────────────────

export const ConversanalyzerV2ToolOutput = S.Struct({
	userState: UserStateSchema,
	evidence: S.Array(EvidenceItemSchema),
});

export type ConversanalyzerV2Extraction = S.Schema.Type<typeof ConversanalyzerV2ToolOutput>;

/** JSON Schema for Anthropic tool input_schema (v2) */
export const conversanalyzerV2JsonSchema = JSONSchema.make(ConversanalyzerV2ToolOutput);

// ─── Lenient schema (independent parsing with defaults) ──────────────────────

/** Default userState values for lenient fallback */
const DEFAULT_USER_STATE: UserState = {
	energyBand: "steady",
	tellingBand: "mixed",
	energyReason: "",
	tellingReason: "",
	withinMessageShift: false,
};

/** Raw schema that accepts unknown userState fields and evidence items */
const RawV2ExtractionSchema = S.Struct({
	userState: S.Unknown,
	evidence: S.Array(S.Unknown),
});

/**
 * Lenient v2 schema that parses userState fields independently and
 * filters invalid evidence items instead of rejecting the entire extraction.
 *
 * - Valid userState fields are kept; invalid fields get defaults
 * - Invalid evidence items are discarded; valid items are kept
 * - Partial success is preserved on both sides
 */
export const LenientConversanalyzerV2ToolOutput = S.transformOrFail(
	RawV2ExtractionSchema,
	ConversanalyzerV2ToolOutput,
	{
		strict: true,
		decode: (raw) => {
			// Parse userState fields independently, building a mutable draft
			const rawState = raw.userState as Record<string, unknown> | null | undefined;

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

			const parsedState: UserState = {
				energyBand,
				tellingBand,
				energyReason,
				tellingReason,
				withinMessageShift,
			};

			// Filter evidence items individually
			const decodeItem = S.decodeUnknownEither(EvidenceItemSchema);
			const validItems: Array<EvidenceItem> = [];
			for (const item of raw.evidence) {
				const result = decodeItem(item);
				if (Either.isRight(result)) {
					validItems.push(result.right);
				}
			}

			return ParseResult.succeed({
				userState: parsedState,
				evidence: validItems,
			});
		},
		encode: (typed) => ParseResult.succeed({ ...typed, userState: typed.userState as unknown }),
	},
);

// ─── Decode helpers ──────────────────────────────────────────────────────────

/** Decode with strict schema — all-or-nothing */
export const decodeConversanalyzerV2Strict = S.decodeUnknownSync(ConversanalyzerV2ToolOutput);

/** Decode with lenient schema — independent field parsing with defaults */
export const decodeConversanalyzerV2Lenient = S.decodeUnknownSync(
	LenientConversanalyzerV2ToolOutput,
);
