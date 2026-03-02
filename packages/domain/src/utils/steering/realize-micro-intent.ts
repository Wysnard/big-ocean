/**
 * Micro-Intent Realizer (Story 17.2, Decision 11)
 *
 * Pure function that transforms a steering target (facet + domain) into a
 * structured micro-intent for natural conversation steering. Replaces raw
 * "Explore {facet} through {domain}" directives with varied questioning styles.
 */
import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";

// ─── Types ───────────────────────────────────────────────────────────

export const INTENT_TYPES = [
	"story_pull",
	"tradeoff_probe",
	"contradiction_surface",
	"domain_shift",
	"depth_push",
] as const;

export type IntentType = (typeof INTENT_TYPES)[number];

export interface MicroIntent {
	readonly intent: IntentType;
	readonly domain: LifeDomain;
	readonly bridgeHint?: "map_same_theme" | "confirm_scope" | "contrast_domains";
	readonly questionStyle?: "open" | "choice";
}

export interface RealizeMicroIntentInput {
	readonly targetFacet: FacetName;
	readonly targetDomain: LifeDomain;
	readonly previousDomain: LifeDomain | null;
	readonly domainStreak: number;
	readonly turnIndex: number;
	readonly nearingEnd: boolean;
	readonly recentIntentTypes: readonly IntentType[];
}

// ─── Constants ───────────────────────────────────────────────────────

/** Maximum consecutive probes before forcing a different intent */
const MAX_CONSECUTIVE_PROBES = 2;

/** Turn index threshold for early conversation (prefer story_pull) */
const EARLY_TURN_THRESHOLD = 6;

/** Domain streak threshold for depth_push */
const DEPTH_PUSH_STREAK_THRESHOLD = 3;

// ─── Bridge Hints ────────────────────────────────────────────────────

const BRIDGE_HINTS = ["map_same_theme", "confirm_scope", "contrast_domains"] as const;

// ─── Implementation ──────────────────────────────────────────────────

/**
 * Checks if the last N recent intents are all the same type.
 */
function hasConsecutiveIntents(recent: readonly IntentType[], type: IntentType, count: number): boolean {
	if (recent.length < count) return false;
	const lastN = recent.slice(-count);
	return lastN.every((t) => t === type);
}

/**
 * Select a bridge hint for domain shifts based on turn index for variety.
 */
function selectBridgeHint(turnIndex: number): MicroIntent["bridgeHint"] {
	return BRIDGE_HINTS[turnIndex % BRIDGE_HINTS.length];
}

/**
 * Select question style alternating based on turn index.
 */
function selectQuestionStyle(turnIndex: number): MicroIntent["questionStyle"] {
	return turnIndex % 2 === 0 ? "open" : "choice";
}

/**
 * Realize a micro-intent from steering target and conversation context.
 *
 * Intent selection priority:
 * 1. nearingEnd → depth_push (wind down with depth)
 * 2. domain shift needed → domain_shift (with bridge hint)
 * 3. deep in same domain (streak >= 3) → depth_push
 * 4. early conversation (turnIndex < 6) → story_pull
 * 5. mid/late conversation → cycle between tradeoff_probe, contradiction_surface, story_pull
 *
 * Guardrail: max 2 consecutive tradeoff_probes.
 */
export function realizeMicroIntent(input: RealizeMicroIntentInput): MicroIntent {
	const { targetDomain, previousDomain, domainStreak, turnIndex, nearingEnd, recentIntentTypes } = input;

	const questionStyle = selectQuestionStyle(turnIndex);

	// 1. Nearing end → depth_push to wind down reflectively
	if (nearingEnd) {
		return { intent: "depth_push", domain: targetDomain, questionStyle };
	}

	// 2. Domain shift needed
	if (previousDomain !== null && targetDomain !== previousDomain) {
		return {
			intent: "domain_shift",
			domain: targetDomain,
			bridgeHint: selectBridgeHint(turnIndex),
			questionStyle,
		};
	}

	// 3. Deep in same domain → depth_push
	if (domainStreak >= DEPTH_PUSH_STREAK_THRESHOLD) {
		return { intent: "depth_push", domain: targetDomain, questionStyle };
	}

	// 4. Early conversation → story_pull
	if (turnIndex < EARLY_TURN_THRESHOLD) {
		return { intent: "story_pull", domain: targetDomain, questionStyle };
	}

	// 5. Mid/late conversation → cycle through intents
	const cycleIntents: IntentType[] = ["tradeoff_probe", "contradiction_surface", "story_pull"];
	let selectedIntent = cycleIntents[turnIndex % cycleIntents.length] as IntentType;

	// Guardrail: avoid 3rd consecutive tradeoff_probe
	if (
		selectedIntent === "tradeoff_probe" &&
		hasConsecutiveIntents(recentIntentTypes, "tradeoff_probe", MAX_CONSECUTIVE_PROBES)
	) {
		selectedIntent = "story_pull";
	}

	return { intent: selectedIntent, domain: targetDomain, questionStyle };
}
