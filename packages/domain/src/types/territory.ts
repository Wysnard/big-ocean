/**
 * Territory Types for Conversation Steering
 *
 * Territories are thematic conversation areas (e.g., "creative pursuits", "social dynamics")
 * that guide Nerin's exploration of personality facets through natural topics.
 * Each territory maps to expected Big Five facets and has an energy level
 * controlling conversational depth.
 *
 * Part of Epic 21 - Territory-Based Conversation Steering.
 */

import type { Schema } from "effect";
import { Schema as S } from "effect";
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";

/**
 * Energy Levels for Territory Pacing
 *
 * Controls conversational depth and emotional weight:
 * - light: Low-stakes, approachable topics (early conversation)
 * - medium: Moderate depth, some self-reflection
 * - heavy: Deep, emotionally weighty exploration
 */
export const ENERGY_LEVELS = ["light", "medium", "heavy"] as const;

export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

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
 */
export interface Territory {
	/** Unique territory identifier (branded slug) */
	readonly id: TerritoryId;
	/** Conversation energy/depth level */
	readonly energyLevel: EnergyLevel;
	/** Life domains this territory explores (1-3) */
	readonly domains: readonly LifeDomain[];
	/** Expected Big Five facets surfaced by this territory (3-6) */
	readonly expectedFacets: readonly FacetName[];
	/** Suggested conversation opener for this territory */
	readonly opener: string;
}
