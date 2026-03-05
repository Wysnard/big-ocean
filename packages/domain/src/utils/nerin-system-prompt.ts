/**
 * Nerin Agent System Prompt Builder
 *
 * Pure function that constructs the system prompt for the Nerin conversational agent.
 * Composes NERIN_PERSONA (shared identity) + CHAT_CONTEXT (conversation-specific rules).
 *
 * Story 9.2: Updated to accept structured (targetDomain, targetFacet) instead of free-text steeringHint.
 * Story 17.2: Added MicroIntent support for natural steering via micro-intents.
 * Story 21-5: Added territory prompt support — when provided, replaces facet-targeting with territory guidance.
 */

import type { FacetName } from "../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../constants/facet-prompt-definitions";
import type { LifeDomain } from "../constants/life-domain";
import { CHAT_CONTEXT } from "../constants/nerin-chat-context";
import { NERIN_PERSONA } from "../constants/nerin-persona";
import type { MicroIntent } from "./steering/realize-micro-intent";
import {
	buildTerritorySystemPromptSection,
	type TerritoryPromptContent,
} from "./steering/territory-prompt-builder";

/**
 * Parameters for building the chat system prompt
 *
 * When `territoryPrompt` is provided, it takes precedence over
 * `targetDomain`, `targetFacet`, and `microIntent` (which are ignored).
 */
export interface ChatSystemPromptParams {
	targetDomain?: LifeDomain;
	targetFacet?: FacetName;
	/** Structured micro-intent (Story 17.2) — when provided, replaces raw steering format */
	microIntent?: MicroIntent;
	/** Territory prompt content (Story 21-5) — when provided, replaces all facet-targeting steering */
	territoryPrompt?: TerritoryPromptContent;
}

/** Intent descriptions for Nerin prompt injection */
const INTENT_DESCRIPTIONS: Record<MicroIntent["intent"], string> = {
	story_pull:
		"Draw out a specific story or experience. Ask them to walk you through a moment, a decision, a day. Concrete narrative reveals personality naturally.",
	tradeoff_probe:
		"Present a tradeoff or tension relevant to this facet. 'Would you rather X or Y?' or 'What wins when A conflicts with B?' Choices reveal priorities.",
	contradiction_surface:
		"You've noticed a tension or contradiction in what they've shared. Surface it gently — not as a gotcha, but as genuine curiosity about their complexity.",
	domain_shift:
		"Shift the conversation to a new life domain. Bridge naturally from the current topic — find a thread that connects both domains.",
	depth_push:
		"Go deeper in the current territory. They've given you something interesting — push on it. Why does it matter? What does it mean to them?",
};

const BRIDGE_DESCRIPTIONS: Record<NonNullable<MicroIntent["bridgeHint"]>, string> = {
	map_same_theme:
		"Find the same theme in the new domain — 'You mentioned X at work, I'm curious how that plays out in...'",
	confirm_scope: "Confirm the shift — 'We've been talking about X, I want to zoom out to...'",
	contrast_domains:
		"Use contrast — 'That's how you are at work. Are you different when it comes to...'",
};

const STYLE_DESCRIPTIONS: Record<NonNullable<MicroIntent["questionStyle"]>, string> = {
	open: "Use an open-ended question — invite them to explore freely.",
	choice:
		"Offer a choice or comparison — 'Are you more X or Y?' Give them something concrete to react to.",
};

/**
 * Build the micro-intent steering section for Nerin's prompt.
 */
function buildMicroIntentSection(microIntent: MicroIntent, targetFacet: FacetName): string {
	const facetDefinition = FACET_PROMPT_DEFINITIONS[targetFacet];
	const intentDesc = INTENT_DESCRIPTIONS[microIntent.intent];

	let section = `

STEERING PRIORITY:
Intent: ${microIntent.intent}
Domain: ${microIntent.domain}
Facet target: ${targetFacet} — ${facetDefinition}

${intentDesc}`;

	if (microIntent.bridgeHint) {
		section += `\nBridge approach: ${BRIDGE_DESCRIPTIONS[microIntent.bridgeHint]}`;
	}

	if (microIntent.questionStyle) {
		section += `\nQuestion style: ${STYLE_DESCRIPTIONS[microIntent.questionStyle]}`;
	}

	section += "\n\nAt most one direct question per response.";

	return section;
}

/**
 * Build dynamic system prompt with optional structured steering and farewell winding-down
 *
 * @param params - Steering and conversation state parameters
 * @returns System prompt for Nerin agent
 */
export function buildChatSystemPrompt(params: ChatSystemPromptParams = {}): string {
	const { targetDomain, targetFacet, microIntent, territoryPrompt } = params;
	let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;

	if (territoryPrompt) {
		// Story 21-5: Territory-based guidance — takes precedence over all facet-targeting
		prompt += buildTerritorySystemPromptSection(territoryPrompt);
	} else if (microIntent && targetFacet) {
		// Story 17.2: Structured micro-intent format
		prompt += buildMicroIntentSection(microIntent, targetFacet);
	} else if (targetDomain && targetFacet) {
		// Legacy: raw steering format (backward compatibility)
		const facetDefinition = FACET_PROMPT_DEFINITIONS[targetFacet];
		prompt += `

STEERING PRIORITY:
Explore the "${targetFacet}" facet through their "${targetDomain}" life domain.
Facet definition: ${facetDefinition}
This is your next exploration target. Transition to this territory within your next 1-2 responses. You don't need to be abrupt — bridge from the current topic naturally, but don't delay. If the current thread has given you something useful, that's your bridge: "That's interesting — it connects to something I've been curious about..." Then shift.`;
	}

	return prompt;
}
