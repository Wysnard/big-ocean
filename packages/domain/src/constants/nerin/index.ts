/**
 * Nerin Character Bible — Modular Decomposition
 *
 * Tier 1 (always-on, core identity) and Tier 2 (intent-contextual) modules
 * decomposed from the monolithic CHAT_CONTEXT. Each module is independently
 * loadable by the Prompt Builder (Story 27-2) to assemble intent-specific
 * system prompts.
 *
 * The original CHAT_CONTEXT in nerin-chat-context.ts is preserved unchanged
 * for backward compatibility until Story 27-2 switches to these modules.
 *
 * Story 27-1: Character Bible Decomposition
 * Story 28-2: Common Layer Reform — REFLECT, STORY_PULLING promoted to Tier 1;
 *   OBSERVATION_QUALITY_COMMON and THREADING_COMMON extracted as always-on instincts.
 */

export { BELIEFS_IN_ACTION } from "./beliefs-in-action";
// Story 31-3 — Closing Exchange instinct
export { CLOSING_EXCHANGE } from "./closing-exchange";
// Contextual mirror system — Story 29-3 (replaces MIRRORS_EXPLORE + MIRRORS_AMPLIFY)
export { getMirrorsForContext } from "./contextual-mirrors";
export { CONVERSATION_INSTINCTS } from "./conversation-instincts";
// Tier 1 — Core Identity (always-on)
export { CONVERSATION_MODE } from "./conversation-mode";
export { HUMOR_GUARDRAILS } from "./humor-guardrails";
export { INTERNAL_TRACKING } from "./internal-tracking";
export { MIRROR_GUARDRAILS } from "./mirror-guardrails";
export { OBSERVATION_QUALITY_COMMON } from "./observation-quality-common";
// Story 31-2 — Character Quality modules
export { ORIGIN_STORY } from "./origin-story";
// Pressure modifiers — entry pressure language (Story 28-3)
export {
	getPressureModifier,
	PRESSURE_ANGLED,
	PRESSURE_DIRECT,
	PRESSURE_SOFT,
} from "./pressure-modifiers";
export { PUSHBACK_HANDLING } from "./pushback-handling";
export { QUALITY_INSTINCT } from "./quality-instinct";
export { REFLECT } from "./reflect";
export { SAFETY_GUARDRAILS } from "./safety-guardrails";
// Intent x observation steering templates (Stories 28-3, 29-2)
export {
	BRIDGE_CONTRADICTION_TEMPLATE,
	BRIDGE_CONVERGENCE_TEMPLATE,
	BRIDGE_NEGATIVE_CONSTRAINT,
	BRIDGE_NOTICING_TEMPLATE,
	BRIDGE_RELATE_TEMPLATE,
	CLOSE_CONTRADICTION_TEMPLATE,
	CLOSE_CONVERGENCE_TEMPLATE,
	CLOSE_NOTICING_TEMPLATE,
	CLOSE_RELATE_TEMPLATE,
	EXPLORE_CONTRADICTION_TEMPLATE,
	EXPLORE_CONVERGENCE_TEMPLATE,
	EXPLORE_NOTICING_TEMPLATE,
	EXPLORE_RELATE_TEMPLATE,
	OPEN_RELATE_TEMPLATE,
	renderSteeringTemplate,
	renderTemplate,
	STEERING_PREFIX,
	TEMPLATE_COUNT,
} from "./steering-templates";
export { STORY_PULLING } from "./story-pulling";
export { THREADING_COMMON } from "./threading-common";
