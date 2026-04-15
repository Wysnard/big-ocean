/**
 * UserSummary LLM JSON shape (Story 7.1).
 * Validates Haiku structured output before persistence.
 */

import { Schema as S } from "@effect/schema";
import { Either } from "effect";
import type {
	UserSummaryQuoteEntry,
	UserSummaryThemeEntry,
} from "../repositories/user-summary.repository";

const UserSummaryThemeEntrySchema = S.Struct({
	theme: S.String,
	description: S.String,
	themeAge: S.optional(S.Number),
	lastCorroborated: S.optional(S.String),
});

const UserSummaryQuoteEntrySchema = S.Struct({
	quote: S.String,
	themeTag: S.optional(S.String),
	context: S.optional(S.String),
});

/** LLM returns snake_case keys to match DB columns. */
export const UserSummaryLlmPayloadSchema = S.Struct({
	themes: S.Array(UserSummaryThemeEntrySchema),
	quote_bank: S.Array(UserSummaryQuoteEntrySchema),
	summary_text: S.String,
});

export type UserSummaryLlmPayload = S.Schema.Type<typeof UserSummaryLlmPayloadSchema>;

const decodePayload = S.decodeUnknownEither(UserSummaryLlmPayloadSchema);

const MAX_QUOTES = 50;

export interface DecodeUserSummaryLlmPayloadResult {
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
}

const snakeToCamelMap: Record<string, string> = {
	theme_age: "themeAge",
	last_corroborated: "lastCorroborated",
	theme_tag: "themeTag",
};

function normalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		result[snakeToCamelMap[k] ?? k] = v;
	}
	return result;
}

function normalizePayload(value: unknown): unknown {
	if (typeof value !== "object" || value === null) return value;
	const obj = value as Record<string, unknown>;
	const themes = Array.isArray(obj.themes)
		? obj.themes.map((t) =>
				typeof t === "object" && t !== null ? normalizeKeys(t as Record<string, unknown>) : t,
			)
		: obj.themes;
	const quoteBank = Array.isArray(obj.quote_bank)
		? obj.quote_bank.map((q) =>
				typeof q === "object" && q !== null ? normalizeKeys(q as Record<string, unknown>) : q,
			)
		: obj.quote_bank;
	return { ...obj, themes, quote_bank: quoteBank };
}

/**
 * Parse and validate LLM JSON (object or raw string).
 * Normalizes snake_case optional fields to camelCase before validation.
 * Enforces quote_bank length ≤ 50.
 */
export const decodeUserSummaryLlmPayload = (
	raw: unknown,
): Either.Either<DecodeUserSummaryLlmPayloadResult, string> => {
	let value: unknown = raw;
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		const unfenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
		try {
			value = JSON.parse(unfenced) as unknown;
		} catch {
			return Either.left("UserSummary LLM output is not valid JSON");
		}
	}

	value = normalizePayload(value);

	const decoded = decodePayload(value);
	if (Either.isLeft(decoded)) {
		return Either.left(`UserSummary LLM output failed schema validation: ${String(decoded.left)}`);
	}
	const payload = decoded.right;
	if (payload.quote_bank.length > MAX_QUOTES) {
		return Either.left(`quote_bank exceeds maximum of ${MAX_QUOTES} entries`);
	}
	return Either.right({
		themes: payload.themes,
		quoteBank: payload.quote_bank,
		summaryText: payload.summary_text,
	});
};
