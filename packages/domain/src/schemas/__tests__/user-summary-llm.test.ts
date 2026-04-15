import { Either } from "effect";
import { describe, expect, it } from "vitest";
import { decodeUserSummaryLlmPayload } from "../user-summary-llm";

describe("decodeUserSummaryLlmPayload", () => {
	it("accepts valid payload object", () => {
		const raw = {
			themes: [{ theme: "A", description: "B" }],
			quote_bank: [{ quote: "hello" }],
			summary_text: "Summary here.",
		};
		const out = decodeUserSummaryLlmPayload(raw);
		expect(Either.isRight(out)).toBe(true);
		if (Either.isRight(out)) {
			expect(out.right.quoteBank).toHaveLength(1);
			expect(out.right.summaryText).toBe("Summary here.");
		}
	});

	it("parses JSON string and strips fences", () => {
		const json = `{"themes":[{"theme":"t","description":"d"}],"quote_bank":[],"summary_text":"x"}`;
		const fenced = `\`\`\`json\n${json}\n\`\`\``;
		const out = decodeUserSummaryLlmPayload(fenced);
		expect(Either.isRight(out)).toBe(true);
	});

	it("normalizes snake_case optional fields to camelCase", () => {
		const raw = {
			themes: [{ theme: "A", description: "B", theme_age: 5, last_corroborated: "2026-01-01" }],
			quote_bank: [{ quote: "hello", theme_tag: "A" }],
			summary_text: "Summary.",
		};
		const out = decodeUserSummaryLlmPayload(raw);
		expect(Either.isRight(out)).toBe(true);
		if (Either.isRight(out)) {
			expect(out.right.themes[0]).toEqual(
				expect.objectContaining({ themeAge: 5, lastCorroborated: "2026-01-01" }),
			);
			expect(out.right.quoteBank[0]).toEqual(expect.objectContaining({ themeTag: "A" }));
		}
	});

	it("rejects more than 50 quotes", () => {
		const quotes = Array.from({ length: 51 }, (_, i) => ({ quote: `q${i}` }));
		const out = decodeUserSummaryLlmPayload({
			themes: [],
			quote_bank: quotes,
			summary_text: "x",
		});
		expect(Either.isLeft(out)).toBe(true);
	});
});
