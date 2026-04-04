/**
 * Portrait Prompt Builder
 *
 * Builds the system prompt for portrait generation (personality letter).
 * Extracted from steering/prompt-builder.ts during Director Model cleanup (Story 44-1).
 *
 * Pure function — no Effect dependencies, no I/O.
 */

import { PORTRAIT_CONTEXT } from "../constants/nerin/portrait-context";
import { NERIN_PERSONA } from "../constants/nerin-persona";

/**
 * Build the system prompt for the personality portrait (letter-writing).
 *
 * Uses Nerin's persona + the PORTRAIT_CONTEXT module.
 * ADR-DM-3: ORIGIN_STORY removed — Big Ocean/Vincent grounding now lives in NERIN_PERSONA first sentence.
 *
 * @returns System prompt string for portrait generation
 */
export function buildPortraitPrompt(): string {
	return [NERIN_PERSONA, PORTRAIT_CONTEXT].join("\n\n");
}
