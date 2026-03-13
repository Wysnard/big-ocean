/**
 * Prompt Builder Tests — Story 27-2
 *
 * Tests for the modular prompt compositor that assembles Nerin's system prompt
 * from 4 tiers based on the Governor's PromptBuilderInput.
 *
 * Tests verify: correct module selection per intent, observation focus translation,
 * entry pressure modifiers, contradiction framing safety, and tier composition.
 */
import { describe, expect, it } from "vitest";

import type { LifeDomain } from "../../../constants/life-domain";
import { NERIN_PERSONA } from "../../../constants/nerin-persona";
import {
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	CONVERSATION_MODE,
	HUMOR_GUARDRAILS,
	INTERNAL_TRACKING,
	MIRROR_GUARDRAILS,
	MIRRORS_AMPLIFY,
	MIRRORS_EXPLORE,
	OBSERVATION_QUALITY,
	QUALITY_INSTINCT,
	REFLECT,
	STORY_PULLING,
	THREADING,
} from "../../../constants/nerin/index";
import type {
	AmplifyPromptInput,
	ContradictionTarget,
	ConvergenceTarget,
	DomainScore,
	ExplorePromptInput,
	ObservationFocus,
	OpenPromptInput,
} from "../../../types/pacing";
import type { TerritoryId } from "../../../types/territory";
import { buildPrompt, translateObservationFocus } from "../prompt-builder";

// ─── Helpers ────────────────────────────────────────────────────────

const tid = (s: string) => s as TerritoryId;

const TIER_1_MODULES = [
	CONVERSATION_MODE,
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	QUALITY_INSTINCT,
	MIRROR_GUARDRAILS,
	HUMOR_GUARDRAILS,
	INTERNAL_TRACKING,
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

function makeAmplifyInput(
	overrides: Partial<Omit<AmplifyPromptInput, "intent" | "entryPressure">> = {},
): AmplifyPromptInput {
	return {
		intent: "amplify",
		territory: tid("creative-pursuits"),
		entryPressure: "direct",
		observationFocus: { type: "relate" },
		...overrides,
	};
}

// ─── Tier 1 (Always-On) ─────────────────────────────────────────────

describe("Tier 1 — always included", () => {
	it("includes NERIN_PERSONA in all intents", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(NERIN_PERSONA);
		expect(explore.systemPrompt).toContain(NERIN_PERSONA);
		expect(amplify.systemPrompt).toContain(NERIN_PERSONA);
	});

	it("includes all 7 core identity modules in every prompt", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		for (const mod of TIER_1_MODULES) {
			expect(open.systemPrompt).toContain(mod);
			expect(explore.systemPrompt).toContain(mod);
			expect(amplify.systemPrompt).toContain(mod);
		}
	});
});

// ─── Open Intent ────────────────────────────────────────────────────

describe("open intent", () => {
	it("loads only REFLECT in Tier 2", () => {
		const result = buildPrompt(makeOpenInput());

		expect(result.systemPrompt).toContain(REFLECT);
		expect(result.systemPrompt).not.toContain(STORY_PULLING);
		expect(result.systemPrompt).not.toContain(THREADING);
		expect(result.systemPrompt).not.toContain(MIRRORS_EXPLORE);
		expect(result.systemPrompt).not.toContain(MIRRORS_AMPLIFY);
		expect(result.systemPrompt).not.toContain(OBSERVATION_QUALITY);
	});

	it("includes territory opener as suggested direction", () => {
		const result = buildPrompt(makeOpenInput());
		// Should contain the territory opener text
		expect(result.systemPrompt).toContain("TERRITORY GUIDANCE");
	});

	it("does not include observation focus instruction", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.systemPrompt).not.toContain("OBSERVATION FOCUS");
	});

	it("reports correct tier2Modules", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.tier2Modules).toEqual(["REFLECT"]);
	});
});

// ─── Explore Intent ─────────────────────────────────────────────────

describe("explore intent", () => {
	it("loads STORY_PULLING, REFLECT, THREADING, MIRRORS_EXPLORE in Tier 2", () => {
		const result = buildPrompt(makeExploreInput());

		expect(result.systemPrompt).toContain(STORY_PULLING);
		expect(result.systemPrompt).toContain(REFLECT);
		expect(result.systemPrompt).toContain(THREADING);
		expect(result.systemPrompt).toContain(MIRRORS_EXPLORE);
	});

	it("does NOT load amplify-specific modules", () => {
		const result = buildPrompt(makeExploreInput());

		expect(result.systemPrompt).not.toContain(OBSERVATION_QUALITY);
		expect(result.systemPrompt).not.toContain(MIRRORS_AMPLIFY);
	});

	it("reports correct tier2Modules", () => {
		const result = buildPrompt(makeExploreInput());
		expect(result.tier2Modules).toEqual([
			"STORY_PULLING",
			"REFLECT",
			"THREADING",
			"MIRRORS_EXPLORE",
		]);
	});

	it("includes observation focus for relate", () => {
		const result = buildPrompt(
			makeExploreInput({ observationFocus: { type: "relate" } }),
		);
		expect(result.systemPrompt).toContain("OBSERVATION FOCUS");
		expect(result.systemPrompt).toContain("Connect naturally");
	});

	it("includes observation focus for noticing", () => {
		const focus: ObservationFocus = {
			type: "noticing",
			domain: "work" as LifeDomain,
		};
		const result = buildPrompt(makeExploreInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("shifting");
		expect(result.systemPrompt).toContain("work");
	});

	it("includes observation focus for contradiction", () => {
		const domainA: DomainScore = {
			domain: "work" as LifeDomain,
			score: 0.8,
			confidence: 0.7,
		};
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
		expect(result.systemPrompt).toContain("interesting");
		expect(result.systemPrompt).toContain("trust");
		expect(result.systemPrompt).toContain("work");
		expect(result.systemPrompt).toContain("relationships");
	});

	it("includes observation focus for convergence", () => {
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
		expect(result.systemPrompt).toContain("pattern");
		expect(result.systemPrompt).toContain("altruism");
		expect(result.systemPrompt).toContain("work");
		expect(result.systemPrompt).toContain("relationships");
		expect(result.systemPrompt).toContain("family");
	});
});

// ─── Amplify Intent ─────────────────────────────────────────────────

describe("amplify intent", () => {
	it("loads OBSERVATION_QUALITY and MIRRORS_AMPLIFY in Tier 2", () => {
		const result = buildPrompt(makeAmplifyInput());

		expect(result.systemPrompt).toContain(OBSERVATION_QUALITY);
		expect(result.systemPrompt).toContain(MIRRORS_AMPLIFY);
	});

	it("does NOT load STORY_PULLING, THREADING, or MIRRORS_EXPLORE", () => {
		const result = buildPrompt(makeAmplifyInput());

		expect(result.systemPrompt).not.toContain(STORY_PULLING);
		expect(result.systemPrompt).not.toContain(THREADING);
		expect(result.systemPrompt).not.toContain(MIRRORS_EXPLORE);
	});

	it("reports correct tier2Modules", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.tier2Modules).toEqual(["OBSERVATION_QUALITY", "MIRRORS_AMPLIFY"]);
	});

	it("includes bold format permission", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.systemPrompt).toMatch(/bold|declarative|longer/i);
	});

	it("includes observation focus instruction", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.systemPrompt).toContain("OBSERVATION FOCUS");
	});
});

// ─── Entry Pressure ─────────────────────────────────────────────────

describe("entry pressure modifiers", () => {
	it("direct pressure uses opener directly", () => {
		const result = buildPrompt(
			makeExploreInput({ entryPressure: "direct" }),
		);
		expect(result.steeringSection).toMatch(/suggest|direction|explore/i);
	});

	it("angled pressure approaches from adjacent angle", () => {
		const result = buildPrompt(
			makeExploreInput({ entryPressure: "angled" }),
		);
		expect(result.steeringSection).toMatch(/adjacent|related|angle/i);
	});

	it("soft pressure uses gentle mention", () => {
		const result = buildPrompt(
			makeExploreInput({ entryPressure: "soft" }),
		);
		expect(result.steeringSection).toMatch(/gentle|natural opening|touch on/i);
	});
});

// ─── Contradiction Framing ──────────────────────────────────────────

describe("contradiction framing safety", () => {
	const domainA: DomainScore = {
		domain: "work" as LifeDomain,
		score: 0.8,
		confidence: 0.7,
	};
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

	it("uses fascination language", () => {
		const translation = translateObservationFocus({ type: "contradiction", target });
		expect(translation).toMatch(/interesting|fascin/i);
	});

	it("does NOT use verdict language", () => {
		const translation = translateObservationFocus({ type: "contradiction", target });
		expect(translation).not.toMatch(/contradictory|inconsistent|you're actually/i);
	});

	it("names the facet and domains", () => {
		const translation = translateObservationFocus({ type: "contradiction", target });
		expect(translation).toContain("trust");
		expect(translation).toContain("work");
		expect(translation).toContain("family");
	});
});

// ─── Observation Focus Translation ──────────────────────────────────

describe("translateObservationFocus", () => {
	it("relate — connect naturally", () => {
		const result = translateObservationFocus({ type: "relate" });
		expect(result).toContain("Connect naturally");
	});

	it("noticing — domain compass", () => {
		const result = translateObservationFocus({
			type: "noticing",
			domain: "leisure" as LifeDomain,
		});
		expect(result).toContain("shifting");
		expect(result).toContain("leisure");
		// Not a facet target
		expect(result).not.toMatch(/facet|score/i);
	});

	it("convergence — pattern across domains", () => {
		const domains: DomainScore[] = [
			{ domain: "work" as LifeDomain, score: 0.7, confidence: 0.8 },
			{ domain: "relationships" as LifeDomain, score: 0.72, confidence: 0.7 },
			{ domain: "solo" as LifeDomain, score: 0.68, confidence: 0.6 },
		];
		const target: ConvergenceTarget = {
			facet: "self_efficacy" as never,
			domains,
			strength: 0.6,
		};
		const result = translateObservationFocus({ type: "convergence", target });
		expect(result).toContain("pattern");
		expect(result).toContain("self_efficacy");
	});
});

// ─── Error Handling ─────────────────────────────────────────────────

describe("error handling", () => {
	it("throws descriptive error for invalid territory ID", () => {
		expect(() =>
			buildPrompt(makeOpenInput("nonexistent-territory")),
		).toThrow(/territory.*not found/i);
	});
});
