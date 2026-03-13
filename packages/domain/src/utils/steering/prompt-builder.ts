/**
 * Prompt Builder — Story 27-2
 *
 * Deterministic prompt compositor that assembles Nerin's system prompt
 * from modular tiers based on the Governor's PromptBuilderInput.
 *
 * 4-tier composition:
 * 1. NERIN_PERSONA — universal identity
 * 2. Core identity modules (Tier 1 — always included)
 * 3. Question modules (Tier 2 — included/excluded per intent)
 * 4. Steering section (per-turn — territory + observation focus)
 *
 * Pure function — no Effect dependencies, no I/O.
 *
 * @see {@link file://_bmad-output/planning-artifacts/epics-conversation-pacing.md} Story 5.2
 */

import {
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	CONVERSATION_MODE,
	HUMOR_GUARDRAILS,
	MIRROR_GUARDRAILS,
	MIRRORS_AMPLIFY,
	MIRRORS_EXPLORE,
	OBSERVATION_QUALITY,
	QUALITY_INSTINCT,
	REFLECT,
	STORY_PULLING,
	THREADING,
} from "../../constants/nerin/index";
import { NERIN_PERSONA } from "../../constants/nerin-persona";
import { TERRITORY_CATALOG } from "../../constants/territory-catalog";
import type { EntryPressure, ObservationFocus, PromptBuilderInput } from "../../types/pacing";

// ─── Types ──────────────────────────────────────────────────────────

/** Output of the prompt builder — the composed system prompt with metadata. */
export interface PromptBuilderOutput {
	/** The fully composed system prompt for Nerin */
	readonly systemPrompt: string;
	/** Names of Tier 2 modules loaded for this intent */
	readonly tier2Modules: readonly string[];
	/** The steering section (territory + observation) for debugging */
	readonly steeringSection: string;
}

// ─── Tier 1 Assembly ────────────────────────────────────────────────

/** All Tier 1 (always-on) modules in canonical order. */
const TIER_1_MODULES = [
	CONVERSATION_MODE,
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	QUALITY_INSTINCT,
	MIRROR_GUARDRAILS,
	HUMOR_GUARDRAILS,
] as const;

function assembleTier1(): string {
	return TIER_1_MODULES.join("\n\n");
}

// ─── Tier 2 Module Selection ────────────────────────────────────────

interface Tier2Selection {
	readonly modules: readonly string[];
	readonly moduleNames: readonly string[];
}

/** Response format guidance — only loaded for explore intent.
 * Open and amplify have their own response formats. */
const EXPLORE_RESPONSE_FORMAT = `Your responses can take different shapes depending on the moment:
- Observation + question in the same breath
- Just a question — no preamble needed when it speaks for itself
- Just empathy — let a moment breathe without immediately asking something
- A choice: "Are you more X, Y, or Z? I'm curious"
- Circle back: "You mentioned X before — that stuck with me"

Keep responses concise — 2-4 sentences typically. Longer when something deserves it, shorter when brevity hits harder.

At most one direct question per response.`;

function selectTier2Modules(intent: PromptBuilderInput["intent"]): Tier2Selection {
	switch (intent) {
		case "open":
			return {
				modules: [REFLECT],
				moduleNames: ["REFLECT"],
			};
		case "explore":
			return {
				modules: [STORY_PULLING, REFLECT, THREADING, MIRRORS_EXPLORE, EXPLORE_RESPONSE_FORMAT],
				moduleNames: [
					"STORY_PULLING",
					"REFLECT",
					"THREADING",
					"MIRRORS_EXPLORE",
					"EXPLORE_RESPONSE_FORMAT",
				],
			};
		case "amplify":
			return {
				modules: [OBSERVATION_QUALITY, MIRRORS_AMPLIFY],
				moduleNames: ["OBSERVATION_QUALITY", "MIRRORS_AMPLIFY"],
			};
	}
}

// ─── Observation Focus Translation ──────────────────────────────────

/**
 * Translate an ObservationFocus into a natural language instruction for Nerin.
 *
 * - Relate: connect naturally
 * - Noticing: domain compass (not facet target)
 * - Contradiction: fascination framing (never verdict)
 * - Convergence: pattern recognition
 */
export function translateObservationFocus(focus: ObservationFocus): string {
	switch (focus.type) {
		case "relate":
			return "Connect naturally to what they just shared. No special observation — be present and genuine.";
		case "noticing":
			return `Something is shifting in ${focus.domain} — you're seeing it, let them see it too. Frame it as curiosity, not diagnosis.`;
		case "contradiction":
			return (
				`Something interesting — ${focus.target.facet} shows up differently in ` +
				`${focus.target.pair[0].domain} vs ${focus.target.pair[1].domain}. ` +
				`Frame this as fascination, never as a verdict. ` +
				`Always curiosity and wonder, never judgment or labeling.`
			);
		case "convergence": {
			const domainNames = focus.target.domains.map((d) => d.domain).join(", ");
			return (
				`A pattern is emerging — ${focus.target.facet} shows up consistently across ${domainNames}. ` +
				`Name what you're seeing. This consistency is meaningful — it suggests something core about who they are.`
			);
		}
	}
}

// ─── Entry Pressure Modifiers ───────────────────────────────────────

function buildTerritoryGuidanceWithPressure(
	territory: { opener: string; domains: readonly [string, string] },
	entryPressure: EntryPressure,
): string {
	const domainList = territory.domains.join(", ");

	let directionInstruction: string;
	switch (entryPressure) {
		case "direct":
			directionInstruction = `Suggested direction — you could explore something like: "${territory.opener}"
This is a suggestion, not a script. Follow the natural flow of conversation. If the person is already in an interesting thread, stay with it. Use this as a direction to steer toward when there's a natural opening.`;
			break;
		case "angled":
			directionInstruction = `Consider approaching from a related angle rather than directly: "${territory.opener}"
Don't lead with this topic head-on. Find an adjacent thread from what they've already shared and let it naturally bend toward this territory. The approach matters more than the destination.`;
			break;
		case "soft":
			directionInstruction = `If there's a natural opening, you might gently touch on: "${territory.opener}"
This territory is a stretch from where they are energetically. Only go here if the conversation naturally drifts this way. Don't force it — there's always next turn.`;
			break;
	}

	return `
TERRITORY GUIDANCE:
Domain area: ${domainList}

${directionInstruction}`;
}

// ─── Steering Section Builder ───────────────────────────────────────

function buildSteeringSection(input: PromptBuilderInput): string {
	const territory = TERRITORY_CATALOG.get(input.territory);

	if (!territory) {
		throw new Error(
			`Territory not found in catalog: "${input.territory}". ` +
				"This indicates a mismatch between steering output and the territory catalog.",
		);
	}

	// Open intent: territory guidance only, no observation
	if (input.intent === "open") {
		return buildTerritoryGuidanceWithPressure(territory, "direct");
	}

	// Explore / Amplify: territory guidance + observation focus
	const entryPressure = input.entryPressure;
	const territorySection = buildTerritoryGuidanceWithPressure(territory, entryPressure);
	const focusTranslation = translateObservationFocus(input.observationFocus);

	let observationSection = `\nOBSERVATION FOCUS:\n${focusTranslation}`;

	// Amplify gets additional formatting permission
	if (input.intent === "amplify") {
		observationSection += `

AMPLIFY MODE:
This is a closing turn. You have permission to be bold and declarative.
Respond in 3-6 sentences — take the space you need.
Make declarative statements about the user based on what you've observed.
This is your moment to show what you've been building toward.`;
	}

	return `${territorySection}\n${observationSection}`;
}

// ─── Main Build Function ────────────────────────────────────────────

/**
 * Build the complete system prompt for Nerin from modular tiers.
 *
 * Composes 4 tiers:
 * 1. NERIN_PERSONA (universal identity)
 * 2. Core identity modules (always-on)
 * 3. Question modules (per intent)
 * 4. Steering section (territory + observation)
 *
 * @param input - PromptBuilderInput from the Move Governor
 * @returns PromptBuilderOutput with composed prompt and metadata
 * @throws Error if territory ID is not found in the catalog
 */
export function buildPrompt(input: PromptBuilderInput): PromptBuilderOutput {
	// Tier 1: Persona + Core Identity
	const persona = NERIN_PERSONA;
	const tier1 = assembleTier1();

	// Tier 2: Intent-specific modules
	const tier2 = selectTier2Modules(input.intent);
	const tier2Content = tier2.modules.join("\n\n");

	// Tier 4: Steering section (territory + observation)
	const steeringSection = buildSteeringSection(input);

	// Compose the full prompt
	const systemPrompt = [persona, tier1, tier2Content, steeringSection].join("\n\n");

	return {
		systemPrompt,
		tier2Modules: tier2.moduleNames,
		steeringSection,
	};
}
