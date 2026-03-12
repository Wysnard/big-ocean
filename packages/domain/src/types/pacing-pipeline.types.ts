/**
 * Pacing Pipeline Types
 *
 * Types for the conversation pacing pipeline (Epic 23 - Conversation Pacing).
 * These types define the two-axis state model (energy x telling),
 * extraction tiers, session phases, and selection rules used by
 * the assessment_exchange table and pipeline layers.
 *
 * Story 23-3: Exchange Table & Schema Migration
 */

/**
 * Energy Band — 5-level classification of user message energy.
 * Maps to continuous [0, 1] via mapEnergyBand():
 * minimal=0.1, low=0.3, steady=0.5, high=0.7, very_high=0.9
 */
export type EnergyBand = "minimal" | "low" | "steady" | "high" | "very_high";

export const ENERGY_BANDS = [
	"minimal",
	"low",
	"steady",
	"high",
	"very_high",
] as const satisfies readonly EnergyBand[];

/**
 * Telling Band — 5-level classification of user self-disclosure style.
 * Maps to continuous [0, 1] via mapTellingBand():
 * fully_compliant=0.0, mostly_compliant=0.25, mixed=0.5,
 * mostly_self_propelled=0.75, strongly_self_propelled=1.0
 */
export type TellingBand =
	| "fully_compliant"
	| "mostly_compliant"
	| "mixed"
	| "mostly_self_propelled"
	| "strongly_self_propelled";

export const TELLING_BANDS = [
	"fully_compliant",
	"mostly_compliant",
	"mixed",
	"mostly_self_propelled",
	"strongly_self_propelled",
] as const satisfies readonly TellingBand[];

/**
 * Extraction Tier — which retry tier produced the extraction result.
 * 1 = strict schema succeeded, 2 = lenient schema, 3 = neutral defaults
 */
export type ExtractionTier = 1 | 2 | 3;

/**
 * Session Phase — current phase of the conversation session.
 * Derived from turn number and session state.
 */
export type SessionPhase = "opening" | "exploring" | "amplifying";

/**
 * Transition Type — how the current exchange transitioned from the previous.
 */
export type TransitionType = "normal" | "energy_shift" | "territory_change";

/**
 * Selection Rule — which code path was used to select the territory.
 */
export type SelectionRule = "cold_start" | "argmax" | "argmax_amplify";
