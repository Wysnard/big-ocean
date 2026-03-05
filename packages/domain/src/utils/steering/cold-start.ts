/**
 * Cold-Start Territory Selection — Story 21-4
 *
 * Selects from curated light-energy territories for the first N messages
 * before the scoring formula takes over. Pure functions, no Effect dependencies.
 *
 * FR6: Cold-start territory selection for first 3 messages using
 * curated light-energy territories (territory subset, not separate system).
 */

import type { SteeringOutput } from "../../types/steering";
import type { TerritoryId } from "../../types/territory";
import { type ScoredTerritory, selectTerritory } from "./territory-scorer";

// ─── Cold-Start Selection ────────────────────────────────────────────

/**
 * Select a territory from the cold-start pool using round-robin.
 *
 * @param messageIndex - 0-based index of the current user message
 * @param coldStartTerritories - Curated light-energy territory IDs
 * @returns SteeringOutput with the selected territory ID
 */
export function selectColdStartTerritory(
	messageIndex: number,
	coldStartTerritories: readonly TerritoryId[],
): SteeringOutput {
	const idx = messageIndex % coldStartTerritories.length;
	return { territoryId: coldStartTerritories[idx]! };
}

// ─── Gateway Function ────────────────────────────────────────────────

/**
 * Single entry point for territory selection — cold-start or scoring.
 *
 * If messageCount < coldStartThreshold, uses round-robin from cold-start pool.
 * Otherwise, delegates to the scoring-based selectTerritory().
 *
 * @param params.messageCount - Number of user messages so far (0-based)
 * @param params.coldStartThreshold - Messages before scoring takes over (from AppConfig)
 * @param params.coldStartTerritories - Curated light-energy territory IDs
 * @param params.scoredTerritories - Pre-scored territories from scoreAllTerritories()
 * @returns SteeringOutput with the selected territory ID
 */
export function selectTerritoryWithColdStart(params: {
	readonly messageCount: number;
	readonly coldStartThreshold: number;
	readonly coldStartTerritories: readonly TerritoryId[];
	readonly scoredTerritories: ScoredTerritory[];
}): SteeringOutput {
	if (params.messageCount < params.coldStartThreshold) {
		return selectColdStartTerritory(params.messageCount, params.coldStartTerritories);
	}

	return selectTerritory(params.scoredTerritories);
}
