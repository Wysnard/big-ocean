/**
 * Nerin Agent System Prompt Builder
 *
 * Pure function that constructs the system prompt for the Nerin conversational agent.
 * Composes NERIN_PERSONA (shared identity) + CHAT_CONTEXT (conversation-specific rules).
 */

import { CHAT_CONTEXT } from "../constants/nerin-chat-context";
import { NERIN_PERSONA } from "../constants/nerin-persona";

/**
 * Build dynamic system prompt based on steering hint
 *
 * @param steeringHint - Natural language hint for conversation direction (optional)
 * @returns System prompt for Nerin agent
 */
export function buildChatSystemPrompt(steeringHint?: string): string {
	let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;

	// Add steering hint if provided (facet-level guidance from orchestrator)
	if (steeringHint) {
		prompt += `

STEERING PRIORITY:
${steeringHint}
This is your next exploration target. Transition to this territory within your next 1-2 responses. You don't need to be abrupt — bridge from the current topic naturally, but don't delay. If the current thread has given you something useful, that's your bridge: "That's interesting — it connects to something I've been curious about..." Then shift.`;
	}

	return prompt;
}
