/**
 * Prompt Builder Tests — Story 28-4 (Skeleton Swap)
 *
 * Tests for the 2-layer prompt compositor that assembles Nerin's system prompt
 * from common (stable) + steering (per-turn) layers.
 *
 * Story 28-4: Replaces the 4-tier system with 2-layer skeleton-based composition.
 * Templates from Story 28-3 drive the steering section. No more dynamic Tier 2 selection.
 */
import { describe, expect, it } from "vitest";

import type { LifeDomain } from "../../../constants/life-domain";
import {
	BELIEFS_IN_ACTION,
	CLOSING_EXCHANGE,
	CONVERSATION_INSTINCTS,
	CONVERSATION_MODE,
	getPressureModifier,
	HUMOR_GUARDRAILS,
	MIRROR_GUARDRAILS,
	OBSERVATION_QUALITY_COMMON,
	ORIGIN_STORY,
	PUSHBACK_HANDLING,
	QUALITY_INSTINCT,
	REFLECT,
	SAFETY_GUARDRAILS,
	STEERING_PREFIX,
	STORY_PULLING,
} from "../../../constants/nerin/index";
import { NERIN_PERSONA } from "../../../constants/nerin-persona";
import type {
	BridgePromptInput,
	ClosePromptInput,
	ContradictionTarget,
	ConvergenceTarget,
	DomainScore,
	ExplorePromptInput,
	ObservationFocus,
	OpenPromptInput,
} from "../../../types/pacing";
import type { TerritoryId } from "../../../types/territory";
import { buildPrompt } from "../prompt-builder";

// ─── Helpers ────────────────────────────────────────────────────────

const tid = (s: string) => s as TerritoryId;

/** All common layer modules (always loaded). */
const COMMON_MODULES = [
	ORIGIN_STORY,
	CONVERSATION_MODE,
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	QUALITY_INSTINCT,
	MIRROR_GUARDRAILS,
	HUMOR_GUARDRAILS,
	SAFETY_GUARDRAILS,
	PUSHBACK_HANDLING,
	REFLECT,
	STORY_PULLING,
	OBSERVATION_QUALITY_COMMON,
];

function makeOpenInput(territory = "creative-pursuits"): OpenPromptInput {
	return {
		intent: "open",
		territory: tid(territory),
	};
}

function makeExploreInput(
	overrides: Partial<Omit<ExplorePromptInput, "intent">> = {},
): ExplorePromptInput {
	return {
		intent: "explore",
		territory: tid("creative-pursuits"),
		entryPressure: "direct",
		observationFocus: { type: "relate" },
		...overrides,
	};
}

function makeCloseInput(
	overrides: Partial<Omit<ClosePromptInput, "intent" | "entryPressure">> = {},
): ClosePromptInput {
	return {
		intent: "close",
		territory: tid("creative-pursuits"),
		entryPressure: "direct",
		observationFocus: { type: "relate" },
		...overrides,
	};
}

// ─── Common Layer (Always-On) ────────────────────────────────────────

describe("common layer — always included", () => {
	it("includes NERIN_PERSONA in all intents", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const close = buildPrompt(makeCloseInput());

		expect(open.systemPrompt).toContain(NERIN_PERSONA);
		expect(explore.systemPrompt).toContain(NERIN_PERSONA);
		expect(close.systemPrompt).toContain(NERIN_PERSONA);
	});

	it("includes all 12 common modules in every prompt", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const close = buildPrompt(makeCloseInput());

		for (const mod of COMMON_MODULES) {
			expect(open.systemPrompt).toContain(mod);
			expect(explore.systemPrompt).toContain(mod);
			expect(close.systemPrompt).toContain(mod);
		}
	});
});

// ─── Steering Section Position ──────────────────────────────────────

describe("steering section position", () => {
	it("steering section appears after persona and common modules", () => {
		const result = buildPrompt(makeExploreInput());

		// Persona should come before steering prefix
		const personaIndex = result.systemPrompt.indexOf(NERIN_PERSONA);
		const steeringIndex = result.systemPrompt.indexOf(STEERING_PREFIX);

		expect(personaIndex).toBeLessThan(steeringIndex);
		expect(personaIndex).toBeGreaterThanOrEqual(0);
		expect(steeringIndex).toBeGreaterThanOrEqual(0);
	});

	it("all intents include STEERING_PREFIX", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const close = buildPrompt(makeCloseInput());

		expect(open.systemPrompt).toContain(STEERING_PREFIX);
		expect(explore.systemPrompt).toContain(STEERING_PREFIX);
		expect(close.systemPrompt).toContain(STEERING_PREFIX);
	});
});

// ─── Open Intent ────────────────────────────────────────────────────

describe("open intent", () => {
	it("uses open x relate template with territory params", () => {
		const result = buildPrompt(makeOpenInput());
		// Template: "This is your first question. You're curious about {territory.name} — {territory.description}."
		expect(result.systemPrompt).toContain("first question");
		expect(result.systemPrompt).toContain("Creative Pursuits");
		expect(result.systemPrompt).toContain("what they make or imagine when nobody's watching");
	});

	it("does not include pressure modifier", () => {
		const result = buildPrompt(makeOpenInput());
		// No pressure modifier for open intent
		expect(result.systemPrompt).not.toContain(getPressureModifier("direct"));
		expect(result.systemPrompt).not.toContain(getPressureModifier("angled"));
		expect(result.systemPrompt).not.toContain(getPressureModifier("soft"));
	});

	it("has templateKey open:relate", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.templateKey).toBe("open:relate");
	});
});

// ─── Explore Intent ─────────────────────────────────────────────────

describe("explore intent", () => {
	it("uses explore x relate template with territory params", () => {
		const result = buildPrompt(makeExploreInput({ observationFocus: { type: "relate" } }));
		expect(result.systemPrompt).toContain("Connect naturally");
		expect(result.systemPrompt).toContain("Creative Pursuits");
	});

	it("uses explore x noticing template with domain param", () => {
		const focus: ObservationFocus = { type: "noticing", domain: "work" as LifeDomain };
		const result = buildPrompt(makeExploreInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("landed");
		expect(result.systemPrompt).toContain("work");
	});

	it("uses explore x contradiction template", () => {
		const domainA: DomainScore = { domain: "work" as LifeDomain, score: 0.8, confidence: 0.7 };
		const domainB: DomainScore = {
			domain: "relationships" as LifeDomain,
			score: 0.3,
			confidence: 0.6,
		};
		const target: ContradictionTarget = {
			facet: "trust" as never,
			pair: [domainA, domainB],
			strength: 0.5,
		};
		const focus: ObservationFocus = { type: "contradiction", target };
		const result = buildPrompt(makeExploreInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("trust");
		expect(result.systemPrompt).toContain("work");
		expect(result.systemPrompt).toContain("relationships");
	});

	it("uses explore x convergence template", () => {
		const domains: DomainScore[] = [
			{ domain: "work" as LifeDomain, score: 0.7, confidence: 0.8 },
			{ domain: "relationships" as LifeDomain, score: 0.72, confidence: 0.7 },
			{ domain: "family" as LifeDomain, score: 0.68, confidence: 0.6 },
		];
		const target: ConvergenceTarget = {
			facet: "altruism" as never,
			domains,
			strength: 0.6,
		};
		const focus: ObservationFocus = { type: "convergence", target };
		const result = buildPrompt(makeExploreInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("altruism");
		expect(result.systemPrompt).toContain("work");
		expect(result.systemPrompt).toContain("relationships");
		expect(result.systemPrompt).toContain("family");
	});

	it("appends pressure modifier for direct", () => {
		const result = buildPrompt(makeExploreInput({ entryPressure: "direct" }));
		expect(result.systemPrompt).toContain(getPressureModifier("direct"));
	});

	it("appends pressure modifier for angled", () => {
		const result = buildPrompt(makeExploreInput({ entryPressure: "angled" }));
		expect(result.systemPrompt).toContain(getPressureModifier("angled"));
	});

	it("appends pressure modifier for soft", () => {
		const result = buildPrompt(makeExploreInput({ entryPressure: "soft" }));
		expect(result.systemPrompt).toContain(getPressureModifier("soft"));
	});

	it("has templateKey matching intent:observation", () => {
		const result = buildPrompt(makeExploreInput({ observationFocus: { type: "relate" } }));
		expect(result.templateKey).toBe("explore:relate");

		const noticing = buildPrompt(
			makeExploreInput({
				observationFocus: { type: "noticing", domain: "work" as LifeDomain },
			}),
		);
		expect(noticing.templateKey).toBe("explore:noticing");
	});
});

// ─── Close Intent ───────────────────────────────────────────────────

describe("close intent", () => {
	it("uses close x relate template", () => {
		const result = buildPrompt(makeCloseInput());
		expect(result.systemPrompt).toContain("last response");
	});

	it("uses close x noticing template", () => {
		const focus: ObservationFocus = { type: "noticing", domain: "leisure" as LifeDomain };
		const result = buildPrompt(makeCloseInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("last response");
		expect(result.systemPrompt).toContain("leisure");
	});

	it("uses close x contradiction template", () => {
		const domainA: DomainScore = { domain: "work" as LifeDomain, score: 0.8, confidence: 0.7 };
		const domainB: DomainScore = {
			domain: "family" as LifeDomain,
			score: 0.2,
			confidence: 0.6,
		};
		const target: ContradictionTarget = {
			facet: "trust" as never,
			pair: [domainA, domainB],
			strength: 0.7,
		};
		const focus: ObservationFocus = { type: "contradiction", target };
		const result = buildPrompt(makeCloseInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("trust");
		expect(result.systemPrompt).toContain("work");
		expect(result.systemPrompt).toContain("family");
	});

	it("uses close x convergence template", () => {
		const domains: DomainScore[] = [
			{ domain: "work" as LifeDomain, score: 0.7, confidence: 0.8 },
			{ domain: "relationships" as LifeDomain, score: 0.72, confidence: 0.7 },
			{ domain: "health" as LifeDomain, score: 0.68, confidence: 0.6 },
		];
		const target: ConvergenceTarget = {
			facet: "self_efficacy" as never,
			domains,
			strength: 0.6,
		};
		const focus: ObservationFocus = { type: "convergence", target };
		const result = buildPrompt(makeCloseInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("self_efficacy");
		expect(result.systemPrompt).toContain("work");
	});

	it("appends pressure modifier", () => {
		const result = buildPrompt(makeCloseInput());
		expect(result.systemPrompt).toContain(getPressureModifier("direct"));
	});

	it("has templateKey matching intent:observation", () => {
		const result = buildPrompt(makeCloseInput());
		expect(result.templateKey).toBe("close:relate");
	});
});

// ─── Bridge Intent ──────────────────────────────────────────────────

function makeBridgeInput(
	overrides: Partial<Omit<BridgePromptInput, "intent">> = {},
): BridgePromptInput {
	return {
		intent: "bridge",
		territory: tid("daily-routines"),
		previousTerritory: tid("creative-pursuits"),
		entryPressure: "angled",
		observationFocus: { type: "relate" },
		...overrides,
	};
}

describe("bridge intent", () => {
	it("uses bridge-specific template (not explore fallback)", () => {
		const result = buildPrompt(makeBridgeInput());
		// Bridge template mentions previousTerritory name — explore template does not
		expect(result.systemPrompt).toContain("Creative Pursuits"); // previousTerritory.name
		// Bridge template mentions newTerritory description
		expect(result.systemPrompt).toContain("how they structure their time"); // newTerritory.description
		// Bridge x relate has 3-tier fallback content
		expect(result.systemPrompt).toContain("come back to it");
	});

	it("includes soft negative constraint with previousTerritory name", () => {
		const result = buildPrompt(makeBridgeInput());
		expect(result.systemPrompt).toContain("Don't pull the conversation back");
		expect(result.systemPrompt).toContain("Creative Pursuits");
	});

	it("includes both territory references in output", () => {
		const result = buildPrompt(makeBridgeInput());
		// previousTerritory name appears in template and negative constraint
		expect(result.systemPrompt).toContain("Creative Pursuits");
		// newTerritory description appears in template
		expect(result.systemPrompt).toContain(
			"how they structure their time and what they protect in it",
		);
	});

	it("appends pressure modifier for angled", () => {
		const result = buildPrompt(makeBridgeInput({ entryPressure: "angled" }));
		expect(result.systemPrompt).toContain(getPressureModifier("angled"));
	});

	it("appends pressure modifier for direct", () => {
		const result = buildPrompt(makeBridgeInput({ entryPressure: "direct" }));
		expect(result.systemPrompt).toContain(getPressureModifier("direct"));
	});

	it("appends pressure modifier for soft", () => {
		const result = buildPrompt(makeBridgeInput({ entryPressure: "soft" }));
		expect(result.systemPrompt).toContain(getPressureModifier("soft"));
	});

	it("has templateKey bridge:relate", () => {
		const result = buildPrompt(makeBridgeInput());
		expect(result.templateKey).toBe("bridge:relate");
	});

	it("has templateKey bridge:noticing", () => {
		const focus: ObservationFocus = { type: "noticing", domain: "work" as LifeDomain };
		const result = buildPrompt(makeBridgeInput({ observationFocus: focus }));
		expect(result.templateKey).toBe("bridge:noticing");
	});

	it("includes all common modules", () => {
		const result = buildPrompt(makeBridgeInput());
		for (const mod of COMMON_MODULES) {
			expect(result.systemPrompt).toContain(mod);
		}
	});

	it("throws descriptive error for invalid previousTerritory", () => {
		expect(() =>
			buildPrompt(makeBridgeInput({ previousTerritory: tid("nonexistent-territory") })),
		).toThrow(/territory.*not found/i);
	});
});

// ─── Contextual Mirrors (Story 29-3) ────────────────────────────────

describe("contextual mirrors", () => {
	it("open intent has no mirrors in output", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.mirrorSet).toBeNull();
		expect(result.systemPrompt).not.toContain("NATURAL WORLD MIRRORS");
	});

	it("explore x relate includes mirrors with all 13 entries", () => {
		const result = buildPrompt(makeExploreInput({ observationFocus: { type: "relate" } }));
		expect(result.mirrorSet).not.toBeNull();
		expect(result.systemPrompt).toContain("NATURAL WORLD MIRRORS");
		expect(result.mirrorSet).toContain("Hermit Crab");
		expect(result.mirrorSet).toContain("Mola Mola");
	});

	it("explore x noticing includes observation-specific mirror subset", () => {
		const focus: ObservationFocus = { type: "noticing", domain: "work" as LifeDomain };
		const result = buildPrompt(makeExploreInput({ observationFocus: focus }));
		expect(result.mirrorSet).not.toBeNull();
		expect(result.mirrorSet).toContain("Hermit Crab");
		expect(result.mirrorSet).toContain("Volcanic Vents");
		expect(result.mirrorSet).not.toContain("Ghost Net");
	});

	it("bridge x relate includes mirrors", () => {
		const result = buildPrompt(makeBridgeInput());
		expect(result.mirrorSet).not.toBeNull();
		expect(result.systemPrompt).toContain("NATURAL WORLD MIRRORS");
	});

	it("close includes closing mirrors", () => {
		const result = buildPrompt(makeCloseInput());
		expect(result.mirrorSet).not.toBeNull();
		expect(result.mirrorSet).toContain("Ghost Net");
		expect(result.mirrorSet).toContain("Mimic Octopus");
		expect(result.mirrorSet).toContain("Volcanic Vents");
		expect(result.mirrorSet).toContain("Mola Mola");
		expect(result.mirrorSet).not.toContain("Hermit Crab");
	});

	it("all non-null mirror sets include guardrail text", () => {
		const explore = buildPrompt(makeExploreInput());
		const bridge = buildPrompt(makeBridgeInput());
		const close = buildPrompt(makeCloseInput());

		const guardrail = "You can discover new mirrors in the moment";
		expect(explore.mirrorSet).toContain(guardrail);
		expect(bridge.mirrorSet).toContain(guardrail);
		expect(close.mirrorSet).toContain(guardrail);
	});

	it("mirrors appear after steering section in system prompt", () => {
		const result = buildPrompt(makeExploreInput());
		const steeringIndex = result.systemPrompt.indexOf(STEERING_PREFIX);
		const mirrorIndex = result.systemPrompt.indexOf("NATURAL WORLD MIRRORS");
		expect(mirrorIndex).toBeGreaterThan(steeringIndex);
	});
});

// ─── Removed Content ────────────────────────────────────────────────

describe("removed content (4-tier artifacts)", () => {
	it("does not contain EXPLORE_RESPONSE_FORMAT content", () => {
		const result = buildPrompt(makeExploreInput());
		expect(result.systemPrompt).not.toContain("Your responses can take different shapes");
	});

	it("does not contain old TERRITORY GUIDANCE header", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const close = buildPrompt(makeCloseInput());

		expect(open.systemPrompt).not.toContain("TERRITORY GUIDANCE");
		expect(explore.systemPrompt).not.toContain("TERRITORY GUIDANCE");
		expect(close.systemPrompt).not.toContain("TERRITORY GUIDANCE");
	});

	it("does not contain old OBSERVATION FOCUS header", () => {
		const explore = buildPrompt(makeExploreInput());
		expect(explore.systemPrompt).not.toContain("OBSERVATION FOCUS:");
	});

	it("does not contain old AMPLIFY MODE block", () => {
		const close = buildPrompt(makeCloseInput());
		expect(close.systemPrompt).not.toContain("AMPLIFY MODE:");
	});

	it("output has no tier2Modules property", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result).not.toHaveProperty("tier2Modules");
	});
});

// ─── Output Shape ───────────────────────────────────────────────────

describe("output shape", () => {
	it("has systemPrompt, steeringSection, and templateKey", () => {
		const result = buildPrompt(makeExploreInput());
		expect(result).toHaveProperty("systemPrompt");
		expect(result).toHaveProperty("steeringSection");
		expect(result).toHaveProperty("templateKey");
		expect(typeof result.systemPrompt).toBe("string");
		expect(typeof result.steeringSection).toBe("string");
		expect(typeof result.templateKey).toBe("string");
	});

	it("steeringSection contains the rendered template", () => {
		const result = buildPrompt(makeExploreInput());
		expect(result.steeringSection).toContain(STEERING_PREFIX);
		expect(result.steeringSection).toContain("Connect naturally");
	});
});

// ─── Word Budget (Story 31-2) ──────────────────────────────────────

describe("common layer word budget", () => {
	it("common layer stays within budget (1,500-2,500 words)", () => {
		const result = buildPrompt(makeOpenInput());
		// Extract common layer: everything before the steering prefix
		const steeringStart = result.systemPrompt.indexOf(STEERING_PREFIX);
		const commonLayer = result.systemPrompt.slice(0, steeringStart);
		const wordCount = commonLayer.split(/\s+/).filter((w) => w.length > 0).length;
		// Budget: common layer (persona + 14 modules) should stay within 1,500-2,500 words
		// to keep LLM context costs reasonable. Current: ~2,500 words.
		expect(wordCount).toBeGreaterThanOrEqual(1500);
		expect(wordCount).toBeLessThanOrEqual(2500);
	});
});

// ─── Story 31-2 New Modules ────────────────────────────────────────

describe("Story 31-2 — character quality modules", () => {
	it("includes ORIGIN_STORY with Big Ocean setting", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.systemPrompt).toContain("Big Ocean");
		expect(result.systemPrompt).toContain("Vincent");
	});

	it("includes SAFETY_GUARDRAILS with diagnostic prohibition", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.systemPrompt).toContain("diagnostic language");
	});

	it("includes PUSHBACK_HANDLING with reframe guidance", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.systemPrompt).toContain("WHEN THEY PUSH BACK");
	});
});

// ─── Story 31-3 New Module ───────────────────────────────────────────

describe("Story 31-3 — closing exchange module", () => {
	it("CLOSING_EXCHANGE only included in close intent (not open/explore)", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		expect(open.systemPrompt).not.toContain("WHEN THE CONVERSATION IS CLOSING");
		expect(explore.systemPrompt).not.toContain("WHEN THE CONVERSATION IS CLOSING");
	});

	it("CLOSING_EXCHANGE present in close intent prompt", () => {
		const result = buildPrompt(makeCloseInput());
		expect(result.systemPrompt).toContain(CLOSING_EXCHANGE);
	});
});

// ─── Error Handling ─────────────────────────────────────────────────

describe("error handling", () => {
	it("throws descriptive error for invalid territory ID", () => {
		expect(() => buildPrompt(makeOpenInput("nonexistent-territory"))).toThrow(
			/territory.*not found/i,
		);
	});
});
