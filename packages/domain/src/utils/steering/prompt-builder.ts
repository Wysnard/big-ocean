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

import {
	BELIEFS_IN_ACTION,
	CONVERSATION_INSTINCTS,
	CONVERSATION_MODE,
	HUMOR_GUARDRAILS,
	MIRROR_GUARDRAILS,
	OBSERVATION_QUALITY_COMMON,
	QUALITY_INSTINCT,
	REFLECT,
	STEERING_PREFIX,
	STORY_PULLING,
	THREADING_COMMON,
	getPressureModifier,
	renderSteeringTemplate,
} from "../../constants/nerin/index";
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
}

// ─── Common Layer Assembly ──────────────────────────────────────────

/** All common (always-on) modules in canonical order. */
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
] as const;

function assembleCommonLayer(): string {
	return [NERIN_PERSONA, ...COMMON_MODULES].join("\n\n");
}

// ─── Steering Section Builder ───────────────────────────────────────

/**
 * Derive the observation focus for the given input.
 * Open intent always uses relate; explore/amplify carry their own focus.
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
 * - Entry pressure modifier (for explore and amplify intents)
 */
function buildSteeringSection(
	input: PromptBuilderInput,
	territory: { readonly name: string; readonly description: string },
): { section: string; templateKey: string } {
	const focus = getObservationFocus(input);
	const templateKey = `${input.intent}:${focus.type}`;
	const renderedTemplate = renderSteeringTemplate(input.intent, focus, territory);

	const parts = [STEERING_PREFIX, renderedTemplate];

	// Append pressure modifier for explore and amplify intents
	if (input.intent === "explore" || input.intent === "amplify") {
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

	// Layer 1: Common (stable)
	const commonLayer = assembleCommonLayer();

	// Layer 2: Steering (per-turn)
	const { section: steeringSection, templateKey } = buildSteeringSection(input, territory);

	// Compose: common + steering
	const systemPrompt = [commonLayer, steeringSection].join("\n\n");

	return {
		systemPrompt,
		templateKey,
		steeringSection,
	};
}
