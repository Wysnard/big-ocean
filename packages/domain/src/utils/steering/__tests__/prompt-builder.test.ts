/**
 * Prompt Builder Tests — Story 27-2, updated Story 28-2
 *
 * Tests for the modular prompt compositor that assembles Nerin's system prompt
 * from 4 tiers based on the Governor's PromptBuilderInput.
 *
 * Tests verify: correct module selection per intent, observation focus translation,
 * entry pressure modifiers, contradiction framing safety, and tier composition.
 *
 * Story 28-2: Updated to reflect Common Layer Reform — REFLECT, STORY_PULLING,
 * OBSERVATION_QUALITY_COMMON, THREADING_COMMON promoted to Tier 1.
 */
import { describe, expect, it } from "vitest";

import type { LifeDomain } from "../../../constants/life-domain";
import {
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	CONVERSATION_MODE,
	HUMOR_GUARDRAILS,
	MIRROR_GUARDRAILS,
	MIRRORS_AMPLIFY,
	MIRRORS_EXPLORE,
	OBSERVATION_QUALITY,
	OBSERVATION_QUALITY_COMMON,
	QUALITY_INSTINCT,
	REFLECT,
	STORY_PULLING,
	THREADING_COMMON,
} from "../../../constants/nerin/index";
import { NERIN_PERSONA } from "../../../constants/nerin-persona";
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

/** Original Tier 1 modules (core identity, always-on since Story 27-1). */
const ORIGINAL_TIER_1_MODULES = [
	CONVERSATION_MODE,
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	QUALITY_INSTINCT,
	MIRROR_GUARDRAILS,
	HUMOR_GUARDRAILS,
];

/** Modules promoted to Tier 1 in Story 28-2 (Common Layer Reform). */
const PROMOTED_TIER_1_MODULES = [
	REFLECT,
	STORY_PULLING,
	OBSERVATION_QUALITY_COMMON,
	THREADING_COMMON,
];

/** All Tier 1 modules combined. */
const ALL_TIER_1_MODULES = [...ORIGINAL_TIER_1_MODULES, ...PROMOTED_TIER_1_MODULES];

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

	it("includes all 10 Tier 1 modules in every prompt", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		for (const mod of ALL_TIER_1_MODULES) {
			expect(open.systemPrompt).toContain(mod);
			expect(explore.systemPrompt).toContain(mod);
			expect(amplify.systemPrompt).toContain(mod);
		}
	});

	it("includes REFLECT in common layer for all intents (Story 28-2)", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(REFLECT);
		expect(explore.systemPrompt).toContain(REFLECT);
		expect(amplify.systemPrompt).toContain(REFLECT);
	});

	it("includes STORY_PULLING in common layer for all intents (Story 28-2)", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(STORY_PULLING);
		expect(explore.systemPrompt).toContain(STORY_PULLING);
		expect(amplify.systemPrompt).toContain(STORY_PULLING);
	});

	it("includes OBSERVATION_QUALITY_COMMON in common layer for all intents (Story 28-2)", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(OBSERVATION_QUALITY_COMMON);
		expect(explore.systemPrompt).toContain(OBSERVATION_QUALITY_COMMON);
		expect(amplify.systemPrompt).toContain(OBSERVATION_QUALITY_COMMON);
	});

	it("includes THREADING_COMMON in common layer for all intents (Story 28-2)", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(THREADING_COMMON);
		expect(explore.systemPrompt).toContain(THREADING_COMMON);
		expect(amplify.systemPrompt).toContain(THREADING_COMMON);
	});
});

// ─── Depth Instinct Removal (Story 28-2) ─────────────────────────────

describe("depth instinct removal (Story 28-2)", () => {
	it("CONVERSATION_INSTINCTS does NOT contain unconditional depth instinct", () => {
		expect(CONVERSATION_INSTINCTS).not.toContain("When someone is opening up, you go deeper");
	});

	it("CONVERSATION_INSTINCTS still contains guarded-angle instinct", () => {
		expect(CONVERSATION_INSTINCTS).toContain("When guarded, you change angle");
	});

	it("no prompt output contains unconditional depth instinct", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).not.toContain("When someone is opening up, you go deeper");
		expect(explore.systemPrompt).not.toContain("When someone is opening up, you go deeper");
		expect(amplify.systemPrompt).not.toContain("When someone is opening up, you go deeper");
	});
});

// ─── Open Intent ────────────────────────────────────────────────────

describe("open intent", () => {
	it("loads no Tier 2 modules (Story 28-2 — REFLECT promoted to Tier 1)", () => {
		const result = buildPrompt(makeOpenInput());

		// REFLECT is in Tier 1 now, not Tier 2
		expect(result.tier2Modules).toEqual([]);

		// These should NOT be in the prompt at all (not Tier 1, not Tier 2 for open)
		expect(result.systemPrompt).not.toContain(MIRRORS_EXPLORE);
		expect(result.systemPrompt).not.toContain(MIRRORS_AMPLIFY);
		expect(result.systemPrompt).not.toContain(OBSERVATION_QUALITY);
	});

	it("includes territory opener as suggested direction", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.systemPrompt).toContain("TERRITORY GUIDANCE");
	});

	it("does not include observation focus instruction", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.systemPrompt).not.toContain("OBSERVATION FOCUS");
	});

	it("reports empty tier2Modules", () => {
		const result = buildPrompt(makeOpenInput());
		expect(result.tier2Modules).toEqual([]);
	});
});

// ─── Explore Intent ─────────────────────────────────────────────────

describe("explore intent", () => {
	it("loads MIRRORS_EXPLORE and EXPLORE_RESPONSE_FORMAT in Tier 2", () => {
		const result = buildPrompt(makeExploreInput());

		expect(result.systemPrompt).toContain(MIRRORS_EXPLORE);
	});

	it("does NOT load amplify-specific modules", () => {
		const result = buildPrompt(makeExploreInput());

		expect(result.systemPrompt).not.toContain(OBSERVATION_QUALITY);
		expect(result.systemPrompt).not.toContain(MIRRORS_AMPLIFY);
	});

	it("reports correct tier2Modules (Story 28-2 — promoted modules removed)", () => {
		const result = buildPrompt(makeExploreInput());
		expect(result.tier2Modules).toEqual(["MIRRORS_EXPLORE", "EXPLORE_RESPONSE_FORMAT"]);
	});

	it("includes observation focus for relate", () => {
		const result = buildPrompt(makeExploreInput({ observationFocus: { type: "relate" } }));
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

	it("does NOT load MIRRORS_EXPLORE in amplify", () => {
		const result = buildPrompt(makeAmplifyInput());

		expect(result.systemPrompt).not.toContain(MIRRORS_EXPLORE);
	});

	it("reports correct tier2Modules", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.tier2Modules).toEqual(["OBSERVATION_QUALITY", "MIRRORS_AMPLIFY"]);
	});

	it("includes bold format permission with 3-6 sentence guidance", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.systemPrompt).toMatch(/bold|declarative/i);
		expect(result.systemPrompt).toContain("3-6 sentences");
	});

	it("includes observation focus instruction", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.systemPrompt).toContain("OBSERVATION FOCUS");
	});
});

// ─── Entry Pressure ─────────────────────────────────────────────────

describe("entry pressure modifiers", () => {
	it("direct pressure uses opener directly", () => {
		const result = buildPrompt(makeExploreInput({ entryPressure: "direct" }));
		expect(result.steeringSection).toMatch(/suggest|direction|explore/i);
	});

	it("angled pressure approaches from adjacent angle", () => {
		const result = buildPrompt(makeExploreInput({ entryPressure: "angled" }));
		expect(result.steeringSection).toMatch(/adjacent|related|angle/i);
	});

	it("soft pressure uses gentle mention", () => {
		const result = buildPrompt(makeExploreInput({ entryPressure: "soft" }));
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
		expect(() => buildPrompt(makeOpenInput("nonexistent-territory"))).toThrow(
			/territory.*not found/i,
		);
	});
});
