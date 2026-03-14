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
	CONVERSATION_INSTINCTS,
	CONVERSATION_MODE,
	getPressureModifier,
	HUMOR_GUARDRAILS,
	MIRROR_GUARDRAILS,
	OBSERVATION_QUALITY_COMMON,
	QUALITY_INSTINCT,
	REFLECT,
	STEERING_PREFIX,
	STORY_PULLING,
	THREADING_COMMON,
} from "../../../constants/nerin/index";
import { NERIN_PERSONA } from "../../../constants/nerin-persona";
import type {
	AmplifyPromptInput,
	BridgePromptInput,
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
	CONVERSATION_MODE,
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	QUALITY_INSTINCT,
	MIRROR_GUARDRAILS,
	HUMOR_GUARDRAILS,
	REFLECT,
	STORY_PULLING,
	OBSERVATION_QUALITY_COMMON,
	THREADING_COMMON,
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

// ─── Common Layer (Always-On) ────────────────────────────────────────

describe("common layer — always included", () => {
	it("includes NERIN_PERSONA in all intents", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(NERIN_PERSONA);
		expect(explore.systemPrompt).toContain(NERIN_PERSONA);
		expect(amplify.systemPrompt).toContain(NERIN_PERSONA);
	});

	it("includes all 10 common modules in every prompt", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		for (const mod of COMMON_MODULES) {
			expect(open.systemPrompt).toContain(mod);
			expect(explore.systemPrompt).toContain(mod);
			expect(amplify.systemPrompt).toContain(mod);
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
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).toContain(STEERING_PREFIX);
		expect(explore.systemPrompt).toContain(STEERING_PREFIX);
		expect(amplify.systemPrompt).toContain(STEERING_PREFIX);
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
		expect(result.systemPrompt).toContain("shifting");
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

// ─── Amplify Intent ─────────────────────────────────────────────────

describe("amplify intent", () => {
	it("uses amplify x relate template", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.systemPrompt).toContain("last question");
	});

	it("uses amplify x noticing template", () => {
		const focus: ObservationFocus = { type: "noticing", domain: "leisure" as LifeDomain };
		const result = buildPrompt(makeAmplifyInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("last question");
		expect(result.systemPrompt).toContain("leisure");
	});

	it("uses amplify x contradiction template", () => {
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
		const result = buildPrompt(makeAmplifyInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("trust");
		expect(result.systemPrompt).toContain("work");
		expect(result.systemPrompt).toContain("family");
	});

	it("uses amplify x convergence template", () => {
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
		const focus: ObservationFocus = { type: "convergence", target };
		const result = buildPrompt(makeAmplifyInput({ observationFocus: focus }));
		expect(result.systemPrompt).toContain("self_efficacy");
		expect(result.systemPrompt).toContain("work");
	});

	it("appends pressure modifier", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.systemPrompt).toContain(getPressureModifier("direct"));
	});

	it("has templateKey matching intent:observation", () => {
		const result = buildPrompt(makeAmplifyInput());
		expect(result.templateKey).toBe("amplify:relate");
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

// ─── Removed Content ────────────────────────────────────────────────

describe("removed content (4-tier artifacts)", () => {
	it("does not contain EXPLORE_RESPONSE_FORMAT content", () => {
		const result = buildPrompt(makeExploreInput());
		expect(result.systemPrompt).not.toContain("Your responses can take different shapes");
	});

	it("does not contain old TERRITORY GUIDANCE header", () => {
		const open = buildPrompt(makeOpenInput());
		const explore = buildPrompt(makeExploreInput());
		const amplify = buildPrompt(makeAmplifyInput());

		expect(open.systemPrompt).not.toContain("TERRITORY GUIDANCE");
		expect(explore.systemPrompt).not.toContain("TERRITORY GUIDANCE");
		expect(amplify.systemPrompt).not.toContain("TERRITORY GUIDANCE");
	});

	it("does not contain old OBSERVATION FOCUS header", () => {
		const explore = buildPrompt(makeExploreInput());
		expect(explore.systemPrompt).not.toContain("OBSERVATION FOCUS:");
	});

	it("does not contain old AMPLIFY MODE block", () => {
		const amplify = buildPrompt(makeAmplifyInput());
		expect(amplify.systemPrompt).not.toContain("AMPLIFY MODE:");
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

// ─── Error Handling ─────────────────────────────────────────────────

describe("error handling", () => {
	it("throws descriptive error for invalid territory ID", () => {
		expect(() => buildPrompt(makeOpenInput("nonexistent-territory"))).toThrow(
			/territory.*not found/i,
		);
	});
});
