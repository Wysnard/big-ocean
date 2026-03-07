/**
 * Nerin Agent System Prompt Builder
 *
 * Pure function that constructs the system prompt for the Nerin conversational agent.
 * Composes NERIN_PERSONA (shared identity) + CHAT_CONTEXT (conversation-specific rules).
 *
 * Story 21-5: Territory-based steering via territory prompt content.
 */

import { CHAT_CONTEXT } from "../constants/nerin-chat-context";
import { NERIN_PERSONA } from "../constants/nerin-persona";
import {
	buildTerritorySystemPromptSection,
	type TerritoryPromptContent,
} from "./steering/territory-prompt-builder";

/**
 * Parameters for building the chat system prompt
 */
export interface ChatSystemPromptParams {
	/** Territory prompt content (Story 21-5) — adds territory guidance section */
	territoryPrompt?: TerritoryPromptContent;
}

/**
 * Build dynamic system prompt with optional territory steering
 *
 * @param params - Territory steering parameters
 * @returns System prompt for Nerin agent
 */
export function buildChatSystemPrompt(params: ChatSystemPromptParams = {}): string {
	const { territoryPrompt } = params;
	let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;

	if (territoryPrompt) {
		prompt += buildTerritorySystemPromptSection(territoryPrompt);
	}

	return prompt;
}
