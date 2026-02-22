/**
 * Nerin Agent System Prompt Builder
 *
 * Pure function that constructs the system prompt for the Nerin conversational agent.
 * Composes NERIN_PERSONA (shared identity) + CHAT_CONTEXT (conversation-specific rules).
 *
 * Story 9.2: Updated to accept structured (targetDomain, targetFacet) instead of free-text steeringHint.
 */

import type { FacetName } from "../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../constants/facet-prompt-definitions";
import type { LifeDomain } from "../constants/life-domain";
import { CHAT_CONTEXT } from "../constants/nerin-chat-context";
import { NERIN_PERSONA } from "../constants/nerin-persona";

/**
 * Build dynamic system prompt with optional structured steering
 *
 * @param targetDomain - Life domain to steer toward (optional, undefined for cold start)
 * @param targetFacet - Big Five facet to steer toward (optional, undefined for cold start)
 * @returns System prompt for Nerin agent
 */
export function buildChatSystemPrompt(targetDomain?: LifeDomain, targetFacet?: FacetName): string {
	let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;

	// Add steering section when both domain and facet are provided
	if (targetDomain && targetFacet) {
		const facetDefinition = FACET_PROMPT_DEFINITIONS[targetFacet];
		prompt += `

STEERING PRIORITY:
Explore the "${targetFacet}" facet through their "${targetDomain}" life domain.
Facet definition: ${facetDefinition}
This is your next exploration target. Transition to this territory within your next 1-2 responses. You don't need to be abrupt — bridge from the current topic naturally, but don't delay. If the current thread has given you something useful, that's your bridge: "That's interesting — it connects to something I've been curious about..." Then shift.`;
	}

	return prompt;
}
