/**
 * Conversation Pacing Pipeline Domain Types
 *
 * All types for the six-layer pacing pipeline: energy/telling extraction,
 * adaptive pacing, territory scoring, observation gating, and prompt composition.
 *
 * Part of Epic 23 (Conversation Pacing Pipeline) — Stories 23-1, 23-2.
 */

import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import type { TerritoryId } from "./territory";

// ---------------------------------------------------------------------------
// Task 1: Literal union types
// ---------------------------------------------------------------------------

/**
 * Energy Band — 5-level categorical energy classification.
 *
 * Represents the user's observed conversational energy level
 * as extracted by ConversAnalyzer. Maps to continuous [0, 1]
 * via mapEnergyBand().
 */
export const ENERGY_BANDS = ["minimal", "low", "steady", "high", "very_high"] as const;

export type EnergyBand = (typeof ENERGY_BANDS)[number];

/**
 * Telling Band — 5-level categorical telling classification.
 *
 * Represents how much the user is self-directing the conversation
 * vs following Nerin's lead. Maps to continuous [0, 1]
 * via mapTellingBand().
 */
export const TELLING_BANDS = [
	"fully_compliant",
	"mostly_compliant",
	"mixed",
	"mostly_self_propelled",
	"strongly_self_propelled",
] as const;

export type TellingBand = (typeof TELLING_BANDS)[number];

/**
 * Entry Pressure — controls how directly Nerin enters a territory.
 * Derived from gap between E_target and territory expectedEnergy.
 */
export const ENTRY_PRESSURES = ["direct", "angled", "soft"] as const;

export type EntryPressure = (typeof ENTRY_PRESSURES)[number];

/**
 * Conversational Intent — the Governor's high-level intent for each turn.
 * - open: first visit to a territory (opener question)
 * - explore: mid-conversation depth (observation may fire)
 * - amplify: final-turn crescendo (best observation wins)
 */
export const CONVERSATIONAL_INTENTS = ["open", "explore", "amplify"] as const;

export type ConversationalIntent = (typeof CONVERSATIONAL_INTENTS)[number];

// ---------------------------------------------------------------------------
// Task 2: DomainScore and observation target types
// ---------------------------------------------------------------------------

/** Per-domain facet score with confidence. Used by contradiction/convergence detection. */
export interface DomainScore {
	readonly domain: LifeDomain;
	readonly score: number;
	readonly confidence: number;
}

/**
 * Contradiction Target — a facet showing divergent scores across exactly 2 domains.
 * strength measures how pronounced the contradiction is.
 */
export interface ContradictionTarget {
	readonly facet: FacetName;
	readonly pair: readonly [DomainScore, DomainScore];
	readonly strength: number;
}

/**
 * Convergence Target — a facet showing consistent scores across 3+ domains.
 * strength measures how strong the convergence signal is.
 */
export interface ConvergenceTarget {
	readonly facet: FacetName;
	readonly domains: readonly DomainScore[];
	readonly strength: number;
}

// ---------------------------------------------------------------------------
// Task 3: ObservationFocus discriminated union
// ---------------------------------------------------------------------------

/** Relate — default "no special observation" focus. Nerin relates naturally. */
export interface RelateFocus {
	readonly type: "relate";
}

/** Noticing — Nerin surfaces a pattern observed in a specific life domain. */
export interface NoticingFocus {
	readonly type: "noticing";
	readonly domain: LifeDomain;
}

/** Contradiction — Nerin surfaces a facet showing divergent scores across domains. */
export interface ContradictionFocus {
	readonly type: "contradiction";
	readonly target: ContradictionTarget;
}

/** Convergence — Nerin surfaces a facet showing consistent scores across domains. */
export interface ConvergenceFocus {
	readonly type: "convergence";
	readonly target: ConvergenceTarget;
}

/**
 * ObservationFocus — tagged discriminated union of 4 observation variants.
 * Pattern-match on `type` for TypeScript narrowing.
 */
export type ObservationFocus = RelateFocus | NoticingFocus | ContradictionFocus | ConvergenceFocus;

// ---------------------------------------------------------------------------
// Task 4: PromptBuilderInput discriminated union
// ---------------------------------------------------------------------------

/**
 * Open intent — first visit to a territory. Carries only the territory ID.
 * The prompt builder looks up the opener from the catalog.
 */
export interface OpenPromptInput {
	readonly intent: "open";
	readonly territory: TerritoryId;
}

/**
 * Explore intent — mid-conversation depth exploration.
 * Carries entry pressure calibration and observation focus.
 */
export interface ExplorePromptInput {
	readonly intent: "explore";
	readonly territory: TerritoryId;
	readonly entryPressure: EntryPressure;
	readonly observationFocus: ObservationFocus;
}

/**
 * Amplify intent — final-turn crescendo. Always uses "direct" entry pressure.
 * The best observation focus wins via raw strength competition.
 */
export interface AmplifyPromptInput {
	readonly intent: "amplify";
	readonly territory: TerritoryId;
	readonly entryPressure: "direct";
	readonly observationFocus: ObservationFocus;
}

/**
 * PromptBuilderInput — discriminated union on `intent`.
 * Each variant carries only the fields relevant to that intent.
 */
export type PromptBuilderInput = OpenPromptInput | ExplorePromptInput | AmplifyPromptInput;

// ---------------------------------------------------------------------------
// Task 5: Debug and scorer output types
// ---------------------------------------------------------------------------

/** A candidate observation with its computed strength for gating comparison. */
export interface ObservationCandidate {
	readonly focus: ObservationFocus;
	readonly strength: number;
}

/** Debug info for entry pressure computation. */
export interface EntryPressureDebug {
	readonly level: EntryPressure;
	readonly eTarget: number;
	readonly expectedEnergy: number;
	readonly gap: number;
}

/** Debug info for the observation gating decision. */
export interface ObservationGatingDebug {
	readonly mode: "explore" | "amplify";
	readonly phase: number;
	readonly threshold: number;
	readonly sharedFireCount: number;
	readonly candidates: readonly ObservationCandidate[];
	readonly winner: ObservationFocus | null;
	readonly mutualExclusionApplied: boolean;
}

/** Full debug output from the Move Governor. */
export interface MoveGovernorDebug {
	readonly intent: ConversationalIntent;
	readonly isFinalTurn: boolean;
	readonly entryPressure: EntryPressureDebug;
	readonly observationGating: ObservationGatingDebug;
}

/** Breakdown of the 5-term territory scoring formula. */
export interface TerritoryScoreBreakdown {
	readonly coverageGain: number;
	readonly adjacency: number;
	readonly skew: number;
	readonly malus: number;
	readonly freshness: number;
}

/** A territory with its computed score and breakdown. */
export interface RankedTerritory {
	readonly territoryId: TerritoryId;
	readonly score: number;
	readonly breakdown: TerritoryScoreBreakdown;
}

/** Output of the territory scorer — all territories ranked with context. */
export interface TerritoryScorerOutput {
	readonly ranked: readonly RankedTerritory[];
	readonly currentTerritory: TerritoryId | null;
	readonly turnNumber: number;
	readonly totalTurns: number;
}

/** Output of the territory selector — the chosen territory with selection metadata. */
export interface TerritorySelectorOutput {
	readonly selectedTerritory: TerritoryId;
	readonly selectionRule: string;
	readonly selectionSeed: number | undefined;
	readonly scorerOutput: TerritoryScorerOutput;
}
