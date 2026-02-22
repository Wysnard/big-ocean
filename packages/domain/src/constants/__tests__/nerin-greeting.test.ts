import { describe, expect, it } from "vitest";
import { GREETING_MESSAGES, OPENING_QUESTIONS, pickOpeningQuestion } from "../nerin-greeting";

describe("nerin-greeting", () => {
	describe("GREETING_MESSAGES", () => {
		it("has exactly 1 fixed message", () => {
			expect(GREETING_MESSAGES).toHaveLength(1);
		});

		it("message 1 is the exact Prototype K verbatim text", () => {
			expect(GREETING_MESSAGES[0]).toBe(
				"Hey — I'm Nerin 👋 We're about to have a conversation, and by the end I'll write you something about what I noticed. No quizzes, no right answers — just talk honestly and the messy, contradictory stuff is welcome 🤿",
			);
		});

		it("message 1 introduces Nerin and creates portrait anticipation", () => {
			expect(GREETING_MESSAGES[0]).toContain("Nerin");
			expect(GREETING_MESSAGES[0]).toContain("write you something");
			expect(GREETING_MESSAGES[0]).not.toContain("personality dive master");
		});

		it("message 1 includes messy/contradictory permission", () => {
			expect(GREETING_MESSAGES[0]).toContain("messy, contradictory");
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

		it("does not contain the beach question", () => {
			for (const q of OPENING_QUESTIONS) {
				expect(q).not.toContain("at the beach");
				expect(q).not.toContain("🌊");
			}
		});

		it("question 2 uses Prototype K wording (Free weekend ahead)", () => {
			expect(OPENING_QUESTIONS[1]).toContain("Free weekend ahead");
			expect(OPENING_QUESTIONS[1]).not.toContain("When you've got a free weekend");
		});

		it("contains the boring true thing question (belief #3 primer)", () => {
			const boringQuestion = OPENING_QUESTIONS.find((q) => q.includes("boring true thing"));
			expect(boringQuestion).toBeDefined();
			expect(boringQuestion).toContain("most interesting");
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
