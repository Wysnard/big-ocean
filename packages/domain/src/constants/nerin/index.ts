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
 */

// Tier 1 — Core Identity (always-on)
export { CONVERSATION_MODE } from "./conversation-mode";
export { BELIEFS_IN_ACTION } from "./beliefs-in-action";
export { CONVERSATION_INSTINCTS } from "./conversation-instincts";
export { QUALITY_INSTINCT } from "./quality-instinct";
export { MIRROR_GUARDRAILS } from "./mirror-guardrails";
export { HUMOR_GUARDRAILS } from "./humor-guardrails";
export { INTERNAL_TRACKING } from "./internal-tracking";

// Tier 2 — Intent-Contextual
export { STORY_PULLING } from "./story-pulling";
export { REFLECT } from "./reflect";
export { THREADING } from "./threading";
export { OBSERVATION_QUALITY } from "./observation-quality";
export { MIRRORS_EXPLORE } from "./mirrors-explore";
export { MIRRORS_AMPLIFY } from "./mirrors-amplify";
