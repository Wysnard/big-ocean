import { describe, expect, it } from "vitest";
import { GREETING_MESSAGES, OPENING_QUESTIONS, pickOpeningQuestion } from "../nerin-greeting";

describe("nerin-greeting", () => {
	describe("GREETING_MESSAGES", () => {
		it("has exactly 2 fixed messages", () => {
			expect(GREETING_MESSAGES).toHaveLength(2);
		});

		it("message 1 introduces Nerin as a personality dive master", () => {
			expect(GREETING_MESSAGES[0]).toContain("Nerin");
			expect(GREETING_MESSAGES[0]).toContain("personality dive master");
		});

		it("message 2 encourages messy/contradictory answers", () => {
			expect(GREETING_MESSAGES[1]).toContain("messy, contradictory");
		});

		it("does not contain instructional language", () => {
			for (const msg of GREETING_MESSAGES) {
				expect(msg).not.toContain("the more openly");
				expect(msg).not.toContain("the more honest");
				expect(msg).not.toContain("judgment-free");
			}
		});
	});

	describe("OPENING_QUESTIONS", () => {
		it("has exactly 6 questions", () => {
			expect(OPENING_QUESTIONS).toHaveLength(6);
		});

		it("all questions end with a question mark or contain a question", () => {
			for (const q of OPENING_QUESTIONS) {
				expect(q).toContain("?");
			}
		});
	});

	describe("pickOpeningQuestion", () => {
		it("returns a question from the pool", () => {
			const question = pickOpeningQuestion(() => 0);
			expect(OPENING_QUESTIONS).toContain(question);
		});

		it("returns different questions for different random values", () => {
			const q1 = pickOpeningQuestion(() => 0);
			const q2 = pickOpeningQuestion(() => 0.99);
			expect(q1).not.toBe(q2);
		});

		it("handles edge case random values", () => {
			const qZero = pickOpeningQuestion(() => 0);
			expect(qZero).toBe(OPENING_QUESTIONS[0]);

			const qAlmostOne = pickOpeningQuestion(() => 0.999);
			expect(qAlmostOne).toBe(OPENING_QUESTIONS[5]);
		});
	});
});
