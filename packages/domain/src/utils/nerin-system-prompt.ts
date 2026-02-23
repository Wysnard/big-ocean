/**
 * Nerin Agent System Prompt Builder
 *
 * Pure function that constructs the system prompt for the Nerin conversational agent.
 * Composes NERIN_PERSONA (shared identity) + CHAT_CONTEXT (conversation-specific rules).
 *
 * Story 9.2: Updated to accept structured (targetDomain, targetFacet) instead of free-text steeringHint.
 * Story 10.5: Refactored to params object with nearingEnd for farewell winding-down.
 */

import type { FacetName } from "../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../constants/facet-prompt-definitions";
import type { LifeDomain } from "../constants/life-domain";
import { CHAT_CONTEXT } from "../constants/nerin-chat-context";
import { NERIN_PERSONA } from "../constants/nerin-persona";

/**
 * Parameters for building the chat system prompt
 */
export interface ChatSystemPromptParams {
	targetDomain?: LifeDomain;
	targetFacet?: FacetName;
	nearingEnd?: boolean;
}

/**
 * Build dynamic system prompt with optional structured steering and farewell winding-down
 *
 * @param params - Steering and conversation state parameters
 * @returns System prompt for Nerin agent
 */
export function buildChatSystemPrompt(params: ChatSystemPromptParams = {}): string {
	const { targetDomain, targetFacet, nearingEnd } = params;
	let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;

	// When nearingEnd, CONVERSATION CLOSING overrides STEERING PRIORITY to avoid contradictory instructions
	if (nearingEnd) {
		prompt += `

CONVERSATION CLOSING:
The conversation is nearing its natural end. Begin weaving your responses toward a warm, reflective closing.
Acknowledge what you've learned about the person and express genuine appreciation for the conversation.
Do NOT mention any assessment, scores, or results — just naturally wind down.`;
	} else if (targetDomain && targetFacet) {
		// Add steering section when both domain and facet are provided (suppressed during closing)
		const facetDefinition = FACET_PROMPT_DEFINITIONS[targetFacet];
		prompt += `

STEERING PRIORITY:
Explore the "${targetFacet}" facet through their "${targetDomain}" life domain.
Facet definition: ${facetDefinition}
This is your next exploration target. Transition to this territory within your next 1-2 responses. You don't need to be abrupt — bridge from the current topic naturally, but don't delay. If the current thread has given you something useful, that's your bridge: "That's interesting — it connects to something I've been curious about..." Then shift.`;
	}

	return prompt;
}
