/**
 * Character Bible Decomposition Tests (Story 27-1)
 *
 * Verifies that the monolithic CHAT_CONTEXT has been properly decomposed
 * into modular Tier 1 (always-on) and Tier 2 (intent-contextual) modules.
 */

import { describe, expect, it } from "vitest";

// Tier 1 — Core Identity (always-on)
import { CONVERSATION_MODE } from "../conversation-mode";
import { BELIEFS_IN_ACTION } from "../beliefs-in-action";
import { CONVERSATION_INSTINCTS } from "../conversation-instincts";
import { QUALITY_INSTINCT } from "../quality-instinct";
import { MIRROR_GUARDRAILS } from "../mirror-guardrails";
import { HUMOR_GUARDRAILS } from "../humor-guardrails";
import { INTERNAL_TRACKING } from "../internal-tracking";
import { OBSERVATION_QUALITY_COMMON } from "../observation-quality-common";
import { THREADING_COMMON } from "../threading-common";

// Tier 2 — Intent-Contextual
import { STORY_PULLING } from "../story-pulling";
import { REFLECT } from "../reflect";
// Contextual mirror system (Story 29-3) — replaces MIRRORS_EXPLORE / MIRRORS_AMPLIFY
import { getMirrorsForContext } from "../contextual-mirrors";

// Original monolith — verify backward compatibility
import { CHAT_CONTEXT } from "../../nerin-chat-context";

// Barrel export
import * as nerinModules from "../index";

describe("Character Bible Decomposition (Story 27-1)", () => {
	describe("Tier 1 — Core Identity (always-on)", () => {
		it("CONVERSATION_MODE is a non-empty string", () => {
			expect(typeof CONVERSATION_MODE).toBe("string");
			expect(CONVERSATION_MODE.length).toBeGreaterThan(0);
		});

		it("BELIEFS_IN_ACTION is a non-empty string", () => {
			expect(typeof BELIEFS_IN_ACTION).toBe("string");
			expect(BELIEFS_IN_ACTION.length).toBeGreaterThan(0);
		});

		it("CONVERSATION_INSTINCTS is a non-empty string", () => {
			expect(typeof CONVERSATION_INSTINCTS).toBe("string");
			expect(CONVERSATION_INSTINCTS.length).toBeGreaterThan(0);
		});

		it("QUALITY_INSTINCT is a non-empty string", () => {
			expect(typeof QUALITY_INSTINCT).toBe("string");
			expect(QUALITY_INSTINCT.length).toBeGreaterThan(0);
		});

		it("MIRROR_GUARDRAILS is a non-empty string", () => {
			expect(typeof MIRROR_GUARDRAILS).toBe("string");
			expect(MIRROR_GUARDRAILS.length).toBeGreaterThan(0);
		});

		it("HUMOR_GUARDRAILS is a non-empty string", () => {
			expect(typeof HUMOR_GUARDRAILS).toBe("string");
			expect(HUMOR_GUARDRAILS.length).toBeGreaterThan(0);
		});

		it("INTERNAL_TRACKING is a non-empty string", () => {
			expect(typeof INTERNAL_TRACKING).toBe("string");
			expect(INTERNAL_TRACKING.length).toBeGreaterThan(0);
		});
	});

	describe("Tier 2 — Intent-Contextual", () => {
		it("STORY_PULLING is a non-empty string", () => {
			expect(typeof STORY_PULLING).toBe("string");
			expect(STORY_PULLING.length).toBeGreaterThan(0);
		});

		it("REFLECT is a non-empty string", () => {
			expect(typeof REFLECT).toBe("string");
			expect(REFLECT.length).toBeGreaterThan(0);
		});

		it("getMirrorsForContext returns contextual mirrors for explore", () => {
			const result = getMirrorsForContext("explore", "relate");
			expect(typeof result).toBe("string");
			expect(result!.length).toBeGreaterThan(0);
		});

		it("getMirrorsForContext returns contextual mirrors for close", () => {
			const result = getMirrorsForContext("close", "relate");
			expect(typeof result).toBe("string");
			expect(result!.length).toBeGreaterThan(0);
		});
	});

	describe("No content lost", () => {
		const exploreMirrors = getMirrorsForContext("explore", "relate") ?? "";
		const closeMirrors = getMirrorsForContext("close", "relate") ?? "";
		const allModules = [
			CONVERSATION_MODE,
			BELIEFS_IN_ACTION,
			CONVERSATION_INSTINCTS,
			QUALITY_INSTINCT,
			MIRROR_GUARDRAILS,
			HUMOR_GUARDRAILS,
			INTERNAL_TRACKING,
			STORY_PULLING,
			REFLECT,
			OBSERVATION_QUALITY_COMMON,
			THREADING_COMMON,
			exploreMirrors,
			closeMirrors,
		].join("\n");

		it("contains CONVERSATION MODE frame", () => {
			expect(allModules).toContain("THE CONVERSATION IS THE ASSESSMENT");
		});

		it("contains beliefs", () => {
			expect(allModules).toContain(
				"PEOPLE DISCOVER MORE WHEN THEY FEEL SAFE TO EXPLORE",
			);
		});

		it("contains story-pulling patterns", () => {
			expect(allModules).toContain(
				"Tell me about a time when you had to choose",
			);
		});

		it("contains threading guidance (dissolved into threading-common)", () => {
			expect(allModules).toContain(
				"you're always tracking threads",
			);
		});

		it("contains mirror reference library", () => {
			expect(allModules).toContain("Hermit Crab");
			expect(allModules).toContain("Ghost Net");
			expect(allModules).toContain("Pilot Fish");
		});

		it("contains humor guardrails", () => {
			expect(allModules).toContain(
				"Humor must land for BOTH of you",
			);
		});

		it("contains internal tracking", () => {
			expect(allModules).toContain("You are silently tracking");
		});

		it("contains observation quality guidance", () => {
			expect(allModules).toContain("The observation shows you're listening");
		});

		it("contains vulnerability response", () => {
			expect(allModules).toContain("MEET VULNERABILITY FIRST");
		});

		it("contains normalization patterns", () => {
			expect(allModules).toContain("IT'S OKAY TO NOT KNOW");
		});

		it("contains emoji guidance", () => {
			expect(allModules).toContain("Emojis punctuate emotional beats");
		});
	});

	describe("Eliminated sections", () => {
		const exploreMirrors2 = getMirrorsForContext("explore", "relate") ?? "";
		const closeMirrors2 = getMirrorsForContext("close", "relate") ?? "";
		const allModules = [
			CONVERSATION_MODE,
			BELIEFS_IN_ACTION,
			CONVERSATION_INSTINCTS,
			QUALITY_INSTINCT,
			MIRROR_GUARDRAILS,
			HUMOR_GUARDRAILS,
			INTERNAL_TRACKING,
			STORY_PULLING,
			REFLECT,
			OBSERVATION_QUALITY_COMMON,
			THREADING_COMMON,
			exploreMirrors2,
			closeMirrors2,
		].join("\n");

		it("does not contain QUESTIONING STYLE as a standalone section header", () => {
			// QUESTIONING STYLE section was folded into intent instructions
			expect(allModules).not.toContain("QUESTIONING STYLE:");
		});

		it("does not contain RESPONSE_PALETTE section", () => {
			expect(allModules).not.toContain("RESPONSE_PALETTE");
		});
	});

	describe("CONVERSATION_INSTINCTS — instincts only, no directives", () => {
		it("does not contain 'Never tell people how to behave'", () => {
			// This is a directive, not an instinct — removed per architecture spec
			expect(CONVERSATION_INSTINCTS).not.toContain(
				"Never tell people how to behave in the conversation",
			);
		});

		it("contains instinct-level behaviors", () => {
			// Should preserve the instinct patterns
			expect(CONVERSATION_INSTINCTS).toContain("MEET VULNERABILITY FIRST");
		});
	});

	describe("Contextual mirrors — explore x relate includes all 13 mirrors", () => {
		const exploreMirrors3 = getMirrorsForContext("explore", "relate");
		const exploreExpected = [
			"Hermit Crab",
			"Ghost Net",
			"Pilot Fish",
			"Tide Pool",
			"Mimic Octopus",
			"Clownfish",
			"Dolphin Echolocation",
			"Bioluminescence",
			"Parrotfish",
			"Sea Urchin",
			"Coral Reef",
			"Volcanic Vents",
			"Mola Mola",
		];

		it("contains all 13 expected mirrors", () => {
			expect(exploreMirrors3).not.toBeNull();
			for (const mirror of exploreExpected) {
				expect(exploreMirrors3).toContain(mirror);
			}
		});
	});

	describe("Contextual mirrors — close includes 4 mirrors", () => {
		const closeMirrors3 = getMirrorsForContext("close", "relate");
		const closeExpected = [
			"Ghost Net",
			"Mimic Octopus",
			"Volcanic Vents",
			"Mola Mola",
		];

		it("contains all 4 expected mirrors", () => {
			expect(closeMirrors3).not.toBeNull();
			for (const mirror of closeExpected) {
				expect(closeMirrors3).toContain(mirror);
			}
		});

		it("does not contain mirrors exclusive to explore", () => {
			expect(closeMirrors3).not.toContain("Hermit Crab");
			expect(closeMirrors3).not.toContain("Pilot Fish");
			expect(closeMirrors3).not.toContain("Clownfish");
			expect(closeMirrors3).not.toContain("Dolphin Echolocation");
			expect(closeMirrors3).not.toContain("Bioluminescence");
			expect(closeMirrors3).not.toContain("Parrotfish");
			expect(closeMirrors3).not.toContain("Sea Urchin");
			expect(closeMirrors3).not.toContain("Tide Pool");
		});
	});

	describe("Backward compatibility", () => {
		it("original CHAT_CONTEXT export still exists", () => {
			expect(typeof CHAT_CONTEXT).toBe("string");
			expect(CHAT_CONTEXT.length).toBeGreaterThan(0);
		});

		it("original CHAT_CONTEXT content is unchanged", () => {
			// Verify key sections still present in the monolith
			expect(CHAT_CONTEXT).toContain("CONVERSATION MODE:");
			expect(CHAT_CONTEXT).toContain("RELATE > REFLECT");
			expect(CHAT_CONTEXT).toContain("STORY-PULLING");
			expect(CHAT_CONTEXT).toContain("NATURAL WORLD MIRRORS");
			expect(CHAT_CONTEXT).toContain("WHAT STAYS INTERNAL");
		});
	});

	describe("Barrel export", () => {
		it("exports all Tier 1 modules", () => {
			expect(nerinModules.CONVERSATION_MODE).toBe(CONVERSATION_MODE);
			expect(nerinModules.BELIEFS_IN_ACTION).toBe(BELIEFS_IN_ACTION);
			expect(nerinModules.CONVERSATION_INSTINCTS).toBe(CONVERSATION_INSTINCTS);
			expect(nerinModules.QUALITY_INSTINCT).toBe(QUALITY_INSTINCT);
			expect(nerinModules.MIRROR_GUARDRAILS).toBe(MIRROR_GUARDRAILS);
			expect(nerinModules.HUMOR_GUARDRAILS).toBe(HUMOR_GUARDRAILS);
			expect(nerinModules.INTERNAL_TRACKING).toBe(INTERNAL_TRACKING);
		});

		it("exports all Tier 2 modules", () => {
			expect(nerinModules.STORY_PULLING).toBe(STORY_PULLING);
			expect(nerinModules.REFLECT).toBe(REFLECT);
		});

		it("exports getMirrorsForContext from contextual mirrors", () => {
			expect(nerinModules.getMirrorsForContext).toBe(getMirrorsForContext);
		});
	});
});
