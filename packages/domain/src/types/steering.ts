/**
 * Steering Output Type
 *
 * The minimal output of the territory scoring/selection pipeline.
 * Contains only the selected territory ID — prompt builder looks up
 * all other details from the catalog.
 *
 * Part of Epic 21 - Territory-Based Conversation Steering.
 */

import type { TerritoryId } from "./territory";

/**
 * Output of the territory selection pipeline.
 *
 * Intentionally minimal: only the territory ID is passed forward.
 * The prompt builder resolves opener, domains, and energy level
 * from the territory catalog.
 */
export interface SteeringOutput {
	readonly territoryId: TerritoryId;
}
