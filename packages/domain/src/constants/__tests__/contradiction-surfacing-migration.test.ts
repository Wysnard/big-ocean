/**
 * Contradiction-Surfacing Migration Tests (Story 22-3)
 *
 * Verifies that contradiction-surfacing was removed from the character bible
 * (chat context) and added to the portrait generator prompt.
 */

import { describe, expect, it } from "vitest";
import { CHAT_CONTEXT } from "../nerin-chat-context";

describe("Story 22-3: Contradiction-Surfacing Migration", () => {
	describe("Character Bible (CHAT_CONTEXT)", () => {
		it("does NOT contain 'CONTRADICTIONS ARE FEATURES' belief block", () => {
			expect(CHAT_CONTEXT).not.toContain("CONTRADICTIONS ARE FEATURES");
			expect(CHAT_CONTEXT).not.toContain("Surface them as threads");
			expect(CHAT_CONTEXT).not.toContain(
				"Contradictions are where the most interesting patterns hide",
			);
		});

		it("retains 'contradictions' in observation + question section as a general technique", () => {
			// The observation section mentions contradiction as something to notice — this is a
			// general observation technique, not contradiction-surfacing strategy
			expect(CHAT_CONTEXT).toContain("a pattern, a contradiction, a moment they rushed past");
		});

		it("retains 'contradictions' in WHAT STAYS INTERNAL as internal tracking", () => {
			expect(CHAT_CONTEXT).toContain("threads, contradictions, themes");
		});

		it("retains 'contradictions' in CONVERSATION MODE as general observation", () => {
			expect(CHAT_CONTEXT).toContain(
				"enthusiasm, contradictions. Every response is both genuine connection",
			);
		});
	});
});
