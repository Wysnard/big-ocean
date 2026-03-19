/**
 * Prompt Builder — Story 28-4 (Skeleton Swap)
 *
 * Deterministic prompt compositor that assembles Nerin's system prompt
 * from 2 layers based on the Governor's PromptBuilderInput.
 *
 * 2-layer composition:
 * 1. Common layer — NERIN_PERSONA + always-on identity modules
 * 2. Steering layer — STEERING_PREFIX + rendered intent x observation template
 *    + entry pressure modifier (per-turn)
 *
 * Replaces the previous 4-tier system (Story 27-2, 28-2).
 * Templates from Story 28-3 drive the steering section.
 *
 * Pure function — no Effect dependencies, no I/O.
 */

import { getMirrorsForContext } from "../../constants/nerin/contextual-mirrors";
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
	renderSteeringTemplate,
	SAFETY_GUARDRAILS,
	STEERING_PREFIX,
	STORY_PULLING,
	THREADING_COMMON,
} from "../../constants/nerin/index";
import {
	BRIDGE_NEGATIVE_CONSTRAINT,
	renderTemplate,
} from "../../constants/nerin/steering-templates";
import { NERIN_PERSONA } from "../../constants/nerin-persona";
import { TERRITORY_CATALOG } from "../../constants/territory-catalog";
import type { ObservationFocus, PromptBuilderInput } from "../../types/pacing";

// ─── Types ──────────────────────────────────────────────────────────

/** Output of the prompt builder — the composed system prompt with metadata. */
export interface PromptBuilderOutput {
	/** The fully composed system prompt for Nerin */
	readonly systemPrompt: string;
	/** The intent x observation template key used (e.g., "explore:noticing") */
	readonly templateKey: string;
	/** The steering section (prefix + template + pressure) for debugging */
	readonly steeringSection: string;
	/** The contextual mirror set included in the prompt, or null if no mirrors (e.g., open intent) */
	readonly mirrorSet: string | null;
}

// ─── Common Layer Assembly ──────────────────────────────────────────

/** All common (always-on) modules in canonical order. */
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
	THREADING_COMMON,
	CLOSING_EXCHANGE,
] as const;

function assembleCommonLayer(): string {
	return [NERIN_PERSONA, ...COMMON_MODULES].join("\n\n");
}

// ─── Steering Section Builder ───────────────────────────────────────

/**
 * Derive the observation focus for the given input.
 * Open intent always uses relate; explore/bridge/close carry their own focus.
 */
function getObservationFocus(input: PromptBuilderInput): ObservationFocus {
	if (input.intent === "open") {
		return { type: "relate" };
	}
	return input.observationFocus;
}

/**
 * Build the steering section from template + pressure modifier.
 *
 * Structure:
 * - STEERING_PREFIX
 * - Rendered intent x observation template
 * - Soft negative constraint (bridge intent only)
 * - Entry pressure modifier (for explore, bridge, and close intents)
 */
function buildSteeringSection(
	input: PromptBuilderInput,
	territory: { readonly name: string; readonly description: string },
	previousTerritoryData?: { readonly name: string; readonly description: string },
): { section: string; templateKey: string } {
	const focus = getObservationFocus(input);
	const templateKey = `${input.intent}:${focus.type}`;

	const renderedTemplate =
		input.intent === "bridge"
			? renderSteeringTemplate("bridge", focus, territory, previousTerritoryData)
			: renderSteeringTemplate(input.intent, focus, territory);

	const parts = [STEERING_PREFIX, renderedTemplate];

	// Append soft negative constraint for bridge intent
	if (input.intent === "bridge" && previousTerritoryData) {
		const constraint = renderTemplate(BRIDGE_NEGATIVE_CONSTRAINT, {
			"previousTerritory.name": previousTerritoryData.name,
		});
		parts.push(constraint);
	}

	// Append pressure modifier for explore, bridge, and close intents
	if (input.intent === "explore" || input.intent === "bridge" || input.intent === "close") {
		parts.push(getPressureModifier(input.entryPressure));
	}

	return {
		section: parts.join("\n\n"),
		templateKey,
	};
}

// ─── Main Build Function ────────────────────────────────────────────

/**
 * Build the complete system prompt for Nerin from 2 layers.
 *
 * Composes:
 * 1. Common layer (persona + always-on modules)
 * 2. Steering layer (prefix + template + pressure)
 *
 * @param input - PromptBuilderInput from the Move Governor
 * @returns PromptBuilderOutput with composed prompt and metadata
 * @throws Error if territory ID is not found in the catalog
 */
export function buildPrompt(input: PromptBuilderInput): PromptBuilderOutput {
	const territory = TERRITORY_CATALOG.get(input.territory);

	if (!territory) {
		throw new Error(
			`Territory not found in catalog: "${input.territory}". ` +
				"This indicates a mismatch between steering output and the territory catalog.",
		);
	}

	// Look up previous territory for bridge intent
	let previousTerritoryData: { readonly name: string; readonly description: string } | undefined;
	if (input.intent === "bridge") {
		const prevTerritory = TERRITORY_CATALOG.get(input.previousTerritory);
		if (!prevTerritory) {
			throw new Error(
				`Previous territory not found in catalog: "${input.previousTerritory}". ` +
					"This indicates a mismatch between steering output and the territory catalog.",
			);
		}
		previousTerritoryData = prevTerritory;
	}

	// Layer 1: Common (stable)
	const commonLayer = assembleCommonLayer();

	// Layer 2: Steering (per-turn)
	const { section: steeringSection, templateKey } = buildSteeringSection(
		input,
		territory,
		previousTerritoryData,
	);

	// Contextual mirrors — loaded by intent x observation
	const focus = getObservationFocus(input);
	const mirrorSet = getMirrorsForContext(input.intent, focus.type);

	// Compose: common + steering + mirrors (if present)
	const parts = [commonLayer, steeringSection];
	if (mirrorSet) {
		parts.push(mirrorSet);
	}
	const systemPrompt = parts.join("\n\n");

	return {
		systemPrompt,
		templateKey,
		steeringSection,
		mirrorSet,
	};
}
