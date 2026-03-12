/**
 * Territory Scoring & Selection — Story 21-3
 *
 * Pure functions that score all territories and select the best one
 * based on coverage needs, energy fit, and freshness.
 *
 * All configurable via TerritoryScorerConfig (extracted from AppConfig).
 * No Effect dependencies — pure functions only.
 *
 * territory_score = coverage_value x energy_fit x freshness_bonus
 */

import type { AppConfigService } from "../../config/app-config";
import type { FacetName } from "../../constants/big-five";
import type { EvidenceInput } from "../../types/evidence";
import type { SteeringOutput } from "../../types/steering";
import type { Territory, TerritoryId } from "../../types/territory";
import { computeEnergyFit, type DRSConfig } from "./drs";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Territory scorer configuration — extracted from AppConfig for pure function usage.
 */
export interface TerritoryScorerConfig {
	readonly minEvidenceThreshold: number;
	readonly maxTerritoryVisits: number;
	readonly freshnessRate: number;
	readonly freshnessMin: number;
	readonly freshnessMax: number;
}

/**
 * Visit history for territories in the current conversation.
 * Maps territory ID to visit count and last visit exchange index.
 */
export type TerritoryVisitHistory = ReadonlyMap<
	TerritoryId,
	{ readonly visitCount: number; readonly lastVisitExchange: number }
>;

/**
 * A scored territory with breakdown of scoring components.
 */
export interface ScoredTerritory {
	readonly territory: Territory;
	readonly score: number;
	readonly coverageValue: number;
	readonly energyFit: number;
	readonly freshnessBonus: number;
}

// ─── Utility ────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

// ─── Coverage Value ─────────────────────────────────────────────────

/**
 * Compute the proportion of a territory's expected facets that are "thin"
 * (below the minimum evidence threshold).
 *
 * Uses raw evidence counts per facet — facets not in the map are treated as 0.
 * Returns 0 for territories with 0 expected facets (edge case).
 */
export function computeCoverageValue(
	territory: Territory,
	facetEvidenceCounts: ReadonlyMap<FacetName, number>,
	config: TerritoryScorerConfig,
): number {
	if (territory.expectedFacets.length === 0) return 0;

	let thinCount = 0;
	for (const facet of territory.expectedFacets) {
		const count = facetEvidenceCounts.get(facet) ?? 0;
		if (count < config.minEvidenceThreshold) {
			thinCount++;
		}
	}

	return thinCount / territory.expectedFacets.length;
}

// ─── Freshness Bonus ────────────────────────────────────────────────

/**
 * Compute the freshness bonus for a territory based on visit history.
 *
 * Never-visited territories get the maximum bonus (1.2).
 * Just-visited territories are neutral (1.0).
 * Bonus grows by freshnessRate per exchange since last visit.
 * Capped at freshnessMax (1.2) per failure mode analysis.
 */
export function computeFreshnessBonus(
	territoryId: TerritoryId,
	visitHistory: TerritoryVisitHistory,
	currentExchange: number,
	config: TerritoryScorerConfig,
): number {
	const history = visitHistory.get(territoryId);

	if (!history) {
		return config.freshnessMax;
	}

	const exchangesSinceLastVisit = currentExchange - history.lastVisitExchange;
	return clamp(
		1.0 + exchangesSinceLastVisit * config.freshnessRate,
		config.freshnessMin,
		config.freshnessMax,
	);
}

// ─── Score Territory ────────────────────────────────────────────────

/**
 * Compute the final score for a territory.
 *
 * territory_score = coverage_value x energy_fit x freshness_bonus
 */
export function scoreTerritory(
	coverageValue: number,
	energyFit: number,
	freshnessBonus: number,
): number {
	return coverageValue * energyFit * freshnessBonus;
}

// ─── Score All Territories ──────────────────────────────────────────

/**
 * Score all territories in the catalog and return them ranked by score (descending).
 *
 * Territories at their visit cap receive a score of 0 (FR18).
 */
export function scoreAllTerritories(
	catalog: ReadonlyMap<TerritoryId, Territory>,
	facetEvidenceCounts: ReadonlyMap<FacetName, number>,
	drs: number,
	visitHistory: TerritoryVisitHistory,
	currentExchange: number,
	drsConfig: DRSConfig,
	scorerConfig: TerritoryScorerConfig,
): ScoredTerritory[] {
	const scored: ScoredTerritory[] = [];

	for (const [, territory] of catalog) {
		const coverageValue = computeCoverageValue(territory, facetEvidenceCounts, scorerConfig);
		const energyFit = computeEnergyFit(drs, territory.expectedEnergy, drsConfig);
		const freshnessBonus = computeFreshnessBonus(
			territory.id,
			visitHistory,
			currentExchange,
			scorerConfig,
		);

		const visitInfo = visitHistory.get(territory.id);
		const atCap = visitInfo !== undefined && visitInfo.visitCount >= scorerConfig.maxTerritoryVisits;

		const score = atCap ? 0 : scoreTerritory(coverageValue, energyFit, freshnessBonus);

		scored.push({ territory, score, coverageValue, energyFit, freshnessBonus });
	}

	scored.sort((a, b) => b.score - a.score);
	return scored;
}

// ─── Select Territory ───────────────────────────────────────────────

/**
 * Select the best territory from scored results.
 *
 * Returns the highest-scoring territory as a SteeringOutput.
 * If all territories have score 0 (all capped), falls back to the
 * territory with the highest coverage_value.
 */
export function selectTerritory(scoredTerritories: ScoredTerritory[]): SteeringOutput {
	const best = scoredTerritories[0];

	if (best && best.score > 0) {
		return { territoryId: best.territory.id };
	}

	// Fallback: all scores are 0 — pick highest coverage value
	let fallback = scoredTerritories[0]!;
	for (const st of scoredTerritories) {
		if (st.coverageValue > fallback.coverageValue) {
			fallback = st;
		}
	}

	return { territoryId: fallback.territory.id };
}

// ─── Helper: Build Facet Evidence Counts ────────────────────────────

/**
 * Build a map of facet name -> evidence count from raw evidence items.
 *
 * Used by the pipeline to prepare input for computeCoverageValue().
 */
export function buildFacetEvidenceCounts(
	evidence: readonly EvidenceInput[],
): ReadonlyMap<FacetName, number> {
	const counts = new Map<FacetName, number>();

	for (const e of evidence) {
		const current = counts.get(e.bigfiveFacet) ?? 0;
		counts.set(e.bigfiveFacet, current + 1);
	}

	return counts;
}

// ─── Config Extraction ──────────────────────────────────────────────

/**
 * Extract territory scorer config from AppConfigService.
 * Keeps scoring functions pure by accepting a focused config object.
 */
export function extractTerritoryScorerConfig(config: AppConfigService): TerritoryScorerConfig {
	return {
		minEvidenceThreshold: config.territoryMinEvidenceThreshold,
		maxTerritoryVisits: config.territoryMaxVisits,
		freshnessRate: config.territoryFreshnessRate,
		freshnessMin: config.territoryFreshnessMin,
		freshnessMax: config.territoryFreshnessMax,
	};
}
