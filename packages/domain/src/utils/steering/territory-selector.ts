/**
 * Territory Selector — Story 25-3
 *
 * Pure function that picks a territory from the scorer's ranked list
 * via deterministic rules based on turn position:
 *
 * - Turn 1 (cold start): score-perimeter pool with deterministic random pick
 * - Turns 2-24 (steady state): argmax (top-1, tiebreak by catalog order)
 * - Turn 25 (finale): argmax (same as steady-state; closing behavior is in the Governor)
 *
 * Also provides observability annotations: sessionPhase and transitionType.
 *
 * No Effect dependencies — pure functions only.
 *
 * @see {@link file://_bmad-output/planning-artifacts/epics-conversation-pacing.md} Story 3.3
 */

import type { TerritoryScorerOutput, TerritorySelectorOutput } from "../../types/pacing";
import type { TerritoryId } from "../../types/territory";

// ─── Constants ──────────────────────────────────────────────────────

/**
 * Score range within which territories are included in the cold-start pool.
 * Territories with score >= (topScore - COLD_START_PERIMETER) are eligible.
 */
export const COLD_START_PERIMETER = 0.15;

// ─── Deterministic Hash ─────────────────────────────────────────────

/**
 * Simple deterministic hash for seed-based random selection.
 * Uses a variant of the xorshift32 algorithm.
 * Returns a value in [0, 1).
 */
function seededRandom(seed: number): number {
	let s = seed | 0;
	// Ensure non-zero
	if (s === 0) s = 1;
	s ^= s << 13;
	s ^= s >> 17;
	s ^= s << 5;
	return ((s < 0 ? ~s + 1 : s) % 1000000) / 1000000;
}

// ─── Selection Rules ────────────────────────────────────────────────

/**
 * Cold-start perimeter selection for turn 1.
 *
 * Takes the top score, builds a pool of all territories within
 * COLD_START_PERIMETER of that score, then picks deterministically
 * using the provided seed.
 */
function selectColdStartPerimeter(
	input: TerritoryScorerOutput,
	seed: number,
): TerritorySelectorOutput {
	const first = input.ranked[0];
	if (!first) {
		throw new Error("ranked list is empty — scorer invariant violated");
	}
	const threshold = first.score - COLD_START_PERIMETER;

	// Build the perimeter pool
	const pool = input.ranked.filter((t) => t.score >= threshold);

	// Deterministic pick from pool using seed
	const index = Math.floor(seededRandom(seed) * pool.length);
	const selected = pool[index] ?? first;

	return {
		selectedTerritory: selected.territoryId,
		selectionRule: "cold-start-perimeter",
		selectionSeed: seed,
		scorerOutput: input,
	};
}

/**
 * Argmax selection for turns 2+.
 *
 * Picks the top-1 territory from the ranked list.
 * Tiebreak is by catalog order (already maintained by the scorer's sort stability).
 */
function selectArgmax(input: TerritoryScorerOutput): TerritorySelectorOutput {
	const first = input.ranked[0];
	if (!first) {
		throw new Error("ranked list is empty — scorer invariant violated");
	}
	return {
		selectedTerritory: first.territoryId,
		selectionRule: "argmax",
		selectionSeed: undefined,
		scorerOutput: input,
	};
}

// ─── Main Selector ──────────────────────────────────────────────────

/**
 * Select a territory from the scorer's ranked list.
 *
 * Applies one of three deterministic rules based on turn position:
 * - Turn 1: cold-start-perimeter (random pick from top-score pool)
 * - Turns 2-24: argmax (top-1)
 * - Turn 25 (finale): argmax (closing behavior lives in the Governor)
 *
 * @param input - Output from the territory scorer with ranked territories
 * @param seed - Optional seed for cold-start deterministic random pick
 * @returns TerritorySelectorOutput with selection metadata
 */
export function selectTerritoryV2(
	input: TerritoryScorerOutput,
	seed?: number,
): TerritorySelectorOutput {
	// Turn 1: cold-start-perimeter
	if (input.turnNumber === 1) {
		return selectColdStartPerimeter(input, seed ?? 0);
	}

	// Turns 2+: argmax (includes finale turn)
	return selectArgmax(input);
}

// ─── Observability Annotations ──────────────────────────────────────

/** Session phase — observability annotation, not part of inter-layer contract. */
export type SelectorSessionPhase = "opening" | "exploring" | "closing";

/** Transition type — observability annotation, not part of inter-layer contract. */
export type SelectorTransitionType = "continue" | "transition";

/**
 * Derive the session phase from turn position.
 *
 * - Turn 1: "opening"
 * - Final turn (turnNumber === totalTurns): "closing"
 * - Otherwise: "exploring"
 */
export function deriveSessionPhase(turnNumber: number, totalTurns: number): SelectorSessionPhase {
	if (turnNumber === 1) return "opening";
	if (turnNumber === totalTurns) return "closing";
	return "exploring";
}

/**
 * Derive the transition type from territory selection.
 *
 * - Same territory: "continue"
 * - Different territory: "transition"
 */
export function deriveTransitionType(
	selectedTerritory: TerritoryId,
	currentTerritory: TerritoryId,
): SelectorTransitionType {
	return selectedTerritory === currentTerritory ? "continue" : "transition";
}
