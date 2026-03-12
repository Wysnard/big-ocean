/**
 * Territory Types for Conversation Steering
 *
 * Territories are thematic conversation areas (e.g., "creative pursuits", "social dynamics")
 * that guide Nerin's exploration of personality facets through natural topics.
 * Each territory maps to expected Big Five facets and has a continuous expected energy
 * value controlling conversational depth.
 *
 * Evolved from categorical energy levels (light/medium/heavy) to continuous [0, 1]
 * expected energy for the unified territory scorer (Story 23-2, FR3).
 *
 * Part of Epic 21 - Territory-Based Conversation Steering.
 * Evolved in Epic 23 - Conversation Pacing Pipeline.
 */

import type { Schema } from "effect";
import { Schema as S } from "effect";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";

/**
 * Branded Schema for TerritoryId
 *
 * Territory IDs are descriptive slugs (e.g., "creative-pursuits", "social-dynamics").
 * Stored as snapshot strings (not FK) to survive catalog evolution.
 */
export const TerritoryIdSchema = S.String.pipe(S.brand("TerritoryId"));

/** Branded TerritoryId type — use TerritoryIdSchema to create instances */
export type TerritoryId = Schema.Schema.Type<typeof TerritoryIdSchema>;

/**
 * Territory Definition
 *
 * A thematic conversation area with mapped personality facets.
 * The territory system replaces direct facet-targeting with organic,
 * topic-driven exploration.
 *
 * `expectedEnergy` is a continuous [0, 1] value measuring the typical cost
 * of honest engagement with this territory's opener. Anchor: 0.5 = comfort
 * threshold (zero drain in the pacing formula).
 *
 * `domains` is an exact 2-tuple — every territory has exactly 2 life domains.
 */
export interface Territory {
	/** Unique territory identifier (branded slug) */
	readonly id: TerritoryId;
	/** Expected energy cost of honest engagement, continuous [0, 1] */
	readonly expectedEnergy: number;
	/** Life domains this territory explores — exactly 2 per territory */
	readonly domains: readonly [LifeDomain, LifeDomain];
	/** Expected Big Five facets surfaced by this territory (3-6) */
	readonly expectedFacets: readonly FacetName[];
	/** Suggested conversation opener for this territory */
	readonly opener: string;
}
