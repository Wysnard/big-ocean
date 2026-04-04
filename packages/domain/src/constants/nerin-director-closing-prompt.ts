/**
 * Nerin Director Closing Prompt (Story 43-3, ADR-DM-2/DM-5)
 *
 * Closing variant of the Director system prompt, swapped in on the last turn.
 * Instructs the Director to make the boldest observation and leave the user
 * wanting more. Nerin Actor doesn't know it's the last turn — the brief's
 * content naturally produces a bolder response.
 *
 * After Nerin Actor's streamed response, a static farewell message is appended
 * (from existing nerin-farewell.ts).
 */

import { NERIN_DIRECTOR_PROMPT } from "./nerin-director-prompt";

/**
 * Nerin Director closing system prompt — used on the final exchange only.
 *
 * Appends closing-specific instructions to the base Director prompt.
 * Per ADR-DM-2: "pipeline detects the last turn and swaps the Director
 * system prompt to a closing variant."
 */
export const NERIN_DIRECTOR_CLOSING_PROMPT = `${NERIN_DIRECTOR_PROMPT}

FINAL EXCHANGE:
This is the final exchange. Make your boldest observation — name the core tension or pattern you've been watching build across the entire conversation. Don't hold back. This is the moment to surface the thing you've been noticing but haven't said yet.

The observation beat is mandatory for this brief. Pick the most revealing thread — the one that would make the user feel genuinely seen. The question beat should leave them wanting more — something they'll think about after the conversation ends.

End with something that makes the portrait feel anticipated, not obligatory.`;
