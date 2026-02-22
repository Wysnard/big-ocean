import { describe, expect, it } from "vitest";
import { NERIN_FAREWELL_MESSAGES, pickFarewellMessage } from "../nerin-farewell";

describe("nerin-farewell", () => {
	describe("NERIN_FAREWELL_MESSAGES", () => {
		it("has exactly 3 farewell messages", () => {
			expect(NERIN_FAREWELL_MESSAGES).toHaveLength(3);
		});

		it("message 1 matches AC #2 verbatim", () => {
			expect(NERIN_FAREWELL_MESSAGES[0]).toBe(
				"We've gone somewhere real today. I'm going to sit with everything you've told me — and I want to write something for you. Give me a moment.",
			);
		});

		it("message 2 matches AC #2 verbatim", () => {
			expect(NERIN_FAREWELL_MESSAGES[1]).toBe(
				"This was a good dive. I've been quietly building a picture of you this whole time — and I think you'll find it interesting. Let me put it together.",
			);
		});

		it("message 3 matches AC #2 verbatim", () => {
			expect(NERIN_FAREWELL_MESSAGES[2]).toBe(
				"Thank you for going there with me. There's a thread running through everything you've said today — I want to take a moment to trace it properly. I'll have something for you soon.",
			);
		});

		it("all messages are warm and anticipation-building (no analysis, no summary)", () => {
			for (const msg of NERIN_FAREWELL_MESSAGES) {
				expect(msg).not.toContain("personality");
				expect(msg).not.toContain("profile");
				expect(msg).not.toContain("results");
				expect(msg).not.toContain("score");
			}
		});

		it("all messages are 2-3 sentences", () => {
			for (const msg of NERIN_FAREWELL_MESSAGES) {
				// Count sentences by splitting on '. ' or end-of-string periods
				const sentences = msg.split(/\.\s/).filter((s) => s.length > 0);
				expect(sentences.length).toBeGreaterThanOrEqual(2);
				expect(sentences.length).toBeLessThanOrEqual(3);
			}
		});
	});

	describe("pickFarewellMessage", () => {
		it("returns a message from the pool", () => {
			const message = pickFarewellMessage(() => 0);
			expect(NERIN_FAREWELL_MESSAGES).toContain(message);
		});

		it("returns different messages for different random values", () => {
			const m1 = pickFarewellMessage(() => 0);
			const m2 = pickFarewellMessage(() => 0.99);
			expect(m1).not.toBe(m2);
		});

		it("handles edge case random values", () => {
			const mZero = pickFarewellMessage(() => 0);
			expect(mZero).toBe(NERIN_FAREWELL_MESSAGES[0]);

			const mAlmostOne = pickFarewellMessage(() => 0.999);
			expect(mAlmostOne).toBe(NERIN_FAREWELL_MESSAGES[2]);
		});

		it("returns first message as fallback", () => {
			// Defensive: if somehow index is out of bounds
			const mFirst = pickFarewellMessage(() => 0);
			expect(mFirst).toBe(NERIN_FAREWELL_MESSAGES[0]);
		});
	});
});
