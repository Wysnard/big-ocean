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
export { CONVERSATION_INSTINCTS } from "./conversation-instincts";
// Tier 1 — Core Identity (always-on)
export { CONVERSATION_MODE } from "./conversation-mode";
export { HUMOR_GUARDRAILS } from "./humor-guardrails";
export { INTERNAL_TRACKING } from "./internal-tracking";
export { MIRROR_GUARDRAILS } from "./mirror-guardrails";
export { MIRRORS_AMPLIFY } from "./mirrors-amplify";
export { MIRRORS_EXPLORE } from "./mirrors-explore";
export { OBSERVATION_QUALITY } from "./observation-quality";
export { OBSERVATION_QUALITY_COMMON } from "./observation-quality-common";
// Pressure modifiers — entry pressure language (Story 28-3)
export {
	getPressureModifier,
	PRESSURE_ANGLED,
	PRESSURE_DIRECT,
	PRESSURE_SOFT,
} from "./pressure-modifiers";
export { QUALITY_INSTINCT } from "./quality-instinct";
export { REFLECT } from "./reflect";
export { STORY_PULLING } from "./story-pulling";
// Intent x observation steering templates (Story 28-3)
export {
	AMPLIFY_CONTRADICTION_TEMPLATE,
	AMPLIFY_CONVERGENCE_TEMPLATE,
	AMPLIFY_NOTICING_TEMPLATE,
	AMPLIFY_RELATE_TEMPLATE,
	EXPLORE_CONTRADICTION_TEMPLATE,
	EXPLORE_CONVERGENCE_TEMPLATE,
	EXPLORE_NOTICING_TEMPLATE,
	EXPLORE_RELATE_TEMPLATE,
	OPEN_RELATE_TEMPLATE,
	renderSteeringTemplate,
	renderTemplate,
	STEERING_PREFIX,
} from "./steering-templates";
// Tier 2 — Intent-Contextual
export { THREADING } from "./threading";
export { THREADING_COMMON } from "./threading-common";
