/**
 * Pacing Territory Scorer — Story 25-2
 *
 * Evolved territory scorer using a 5-term additive formula:
 *   score = coverageGain + adjacency + conversationSkew - energyMalus - freshnessPenalty
 *
 * Replaces the multiplicative scorer from Story 21-3 for the conversation pacing pipeline.
 * Pure functions only — no Effect dependencies, no database, no I/O.
 *
 * @see {@link file://_bmad-output/planning-artifacts/epics-conversation-pacing.md} Story 3.2
 */

import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import type {
	RankedTerritory,
	TerritoryScoreBreakdown,
	TerritoryScorerOutput,
} from "../../types/pacing";
import type { Territory, TerritoryId } from "../../types/territory";
import type { FacetMetrics } from "../formula";

// ─── Config ─────────────────────────────────────────────────────────

/**
 * Configuration for the pacing territory scorer.
 * All constants are simulation-derived defaults; easily adjustable for calibration.
 */
export interface PacingScorerConfig {
	/** Energy malus weight — controls penalty for energy mismatch */
	readonly w_e: number;
	/** Freshness penalty weight — controls penalty for recently-visited territories */
	readonly w_f: number;
	/** Turns before freshness penalty fully decays */
	readonly cooldown: number;
	/** Weight of domain similarity in adjacency computation */
	readonly domainAdjWeight: number;
	/** Weight of facet similarity in adjacency computation */
	readonly facetAdjWeight: number;
	/** Turn fraction where early skew ramp ends */
	readonly earlySkewEnd: number;
	/** Maximum early skew boost for light territories */
	readonly earlySkewMax: number;
	/** Turn fraction where late skew ramp starts */
	readonly lateSkewStart: number;
	/** Maximum late skew boost for heavy territories */
	readonly lateSkewMax: number;
	/** Confidence gap weight for priority computation */
	readonly priorityAlpha: number;
	/** Signal power gap weight for priority computation */
	readonly priorityBeta: number;
	/** Target confidence level */
	readonly C_target: number;
	/** Target signal power level */
	readonly P_target: number;
}

export const PACING_SCORER_DEFAULTS: PacingScorerConfig = {
	w_e: 0.3,
	w_f: 0.2,
	cooldown: 5,
	domainAdjWeight: 0.8,
	facetAdjWeight: 0.2,
	earlySkewEnd: 0.2,
	earlySkewMax: 0.2,
	lateSkewStart: 0.7,
	lateSkewMax: 1.0,
	priorityAlpha: 1.0,
	priorityBeta: 0.8,
	C_target: 0.75,
	P_target: 0.5,
} as const;

// ─── Energy Thresholds ──────────────────────────────────────────────

/** Territory is "light" if expectedEnergy below this */
const LIGHT_ENERGY_THRESHOLD = 0.38;
/** Territory is "heavy" if expectedEnergy at or above this */
const HEAVY_ENERGY_THRESHOLD = 0.55;

// ─── Facet Priority ─────────────────────────────────────────────────

/**
 * Compute the priority of a single facet based on coverage gaps.
 * Same formula as computeSteeringTarget: alpha * max(0, C_target - conf) + beta * max(0, P_target - sp)
 *
 * Facets with no evidence get maximum priority.
 */
export function computeFacetPriority(
	facet: FacetName,
	facetMetrics: ReadonlyMap<FacetName, FacetMetrics>,
	config: PacingScorerConfig,
): number {
	const m = facetMetrics.get(facet);
	const confidence = m ? m.confidence : 0;
	const signalPower = m ? m.signalPower : 0;

	return (
		config.priorityAlpha * Math.max(0, config.C_target - confidence) +
		config.priorityBeta * Math.max(0, config.P_target - signalPower)
	);
}

// ─── Coverage Gain ──────────────────────────────────────────────────

/**
 * Compute coverage gain for a territory using source-normalized priority yields.
 *
 * coverageGain = sqrt(sum(baseYield * priority_f / priority_max))
 *
 * Source normalization: baseYield = 1 / |expectedFacets| ensures territories
 * with different facet counts score equally at cold start.
 *
 * When priorityMax is 0 (all facets fully covered), returns 0.
 */
export function computeCoverageGainV2(
	territory: Territory,
	facetMetrics: ReadonlyMap<FacetName, FacetMetrics>,
	priorityMax: number,
	config: PacingScorerConfig,
): number {
	if (territory.expectedFacets.length === 0) return 0;
	if (priorityMax <= 0) return 0;

	const baseYield = 1 / territory.expectedFacets.length;
	let sum = 0;

	for (const facet of territory.expectedFacets) {
		const priority = computeFacetPriority(facet, facetMetrics, config);
		sum += baseYield * (priority / priorityMax);
	}

	return Math.min(1, Math.sqrt(sum));
}

// ─── Adjacency ──────────────────────────────────────────────────────

/**
 * Compute Jaccard similarity between two sets.
 */
function jaccardSimilarity<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>): number {
	let intersectionSize = 0;
	for (const item of setA) {
		if (setB.has(item)) intersectionSize++;
	}
	const unionSize = setA.size + setB.size - intersectionSize;
	if (unionSize === 0) return 1.0; // Both empty = identical
	return intersectionSize / unionSize;
}

/**
 * Compute adjacency between the current territory and a candidate territory.
 *
 * adjacency = domainAdjWeight * domainJaccard + facetAdjWeight * facetJaccard
 *
 * Self-adjacency is always 1.0 (Jaccard of identical sets = 1.0).
 */
export function computeAdjacency(
	current: Territory,
	candidate: Territory,
	config: PacingScorerConfig,
): number {
	const currentDomains = new Set<LifeDomain>(current.domains);
	const candidateDomains = new Set<LifeDomain>(candidate.domains);
	const domainSim = jaccardSimilarity(currentDomains, candidateDomains);

	const currentFacets = new Set<FacetName>(current.expectedFacets);
	const candidateFacets = new Set<FacetName>(candidate.expectedFacets);
	const facetSim = jaccardSimilarity(currentFacets, candidateFacets);

	return config.domainAdjWeight * domainSim + config.facetAdjWeight * facetSim;
}

// ─── Conversation Skew ──────────────────────────────────────────────

/**
 * Compute conversation skew boost based on territory energy and session position.
 *
 * - Early session: light territories get a linear ramp from 0 to earlySkewMax
 * - Late session: heavy territories get a linear ramp from 0 to lateSkewMax
 * - Mid session and medium-energy territories: 0
 */
export function computeConversationSkew(
	expectedEnergy: number,
	turnNumber: number,
	totalTurns: number,
	config: PacingScorerConfig,
): number {
	const turnFraction = turnNumber / totalTurns;

	// Early boost for light territories
	if (expectedEnergy < LIGHT_ENERGY_THRESHOLD && turnFraction <= config.earlySkewEnd) {
		const ramp = turnFraction / config.earlySkewEnd;
		return ramp * config.earlySkewMax;
	}

	// Late boost for heavy territories
	if (expectedEnergy >= HEAVY_ENERGY_THRESHOLD && turnFraction >= config.lateSkewStart) {
		const ramp = (turnFraction - config.lateSkewStart) / (1 - config.lateSkewStart);
		return ramp * config.lateSkewMax;
	}

	return 0;
}

// ─── Energy Malus ───────────────────────────────────────────────────

/**
 * Compute quadratic energy malus for a territory.
 *
 * energyMalus = w_e * (expectedEnergy - E_target)^2
 */
export function computeEnergyMalus(expectedEnergy: number, eTarget: number, w_e: number): number {
	const gap = expectedEnergy - eTarget;
	return w_e * gap * gap;
}

// ─── Freshness Penalty ──────────────────────────────────────────────

/**
 * Visit history for the pacing scorer.
 * Maps territory ID to the turn number of the last visit.
 */
export type PacingVisitHistory = ReadonlyMap<TerritoryId, number>;

/**
 * Compute freshness penalty for a territory.
 *
 * - Current territory: 0 (no self-penalty for stability)
 * - Never-visited: 0
 * - Otherwise: max(0, w_f * (1 - turnsSinceLastVisit / cooldown))
 */
export function computeFreshnessPenaltyV2(
	territoryId: TerritoryId,
	visitHistory: PacingVisitHistory,
	turnNumber: number,
	config: PacingScorerConfig,
): number {
	const lastVisitTurn = visitHistory.get(territoryId);
	if (lastVisitTurn === undefined) return 0;

	const turnsSince = turnNumber - lastVisitTurn;
	return Math.max(0, config.w_f * (1 - turnsSince / config.cooldown));
}

// ─── Score All Territories V2 ───────────────────────────────────────

export interface ScoreAllTerritoriesV2Input {
	readonly eTarget: number;
	readonly facetMetrics: ReadonlyMap<FacetName, FacetMetrics>;
	readonly catalog: ReadonlyMap<TerritoryId, Territory>;
	readonly currentTerritory: TerritoryId;
	readonly visitHistory: PacingVisitHistory;
	readonly turnNumber: number;
	readonly totalTurns: number;
	readonly config: PacingScorerConfig;
}

/**
 * Score all territories using the 5-term additive formula and return a
 * TerritoryScorerOutput with territories ranked by score (descending).
 *
 * score = coverageGain + adjacency + conversationSkew - energyMalus - freshnessPenalty
 */
export function scoreAllTerritoriesV2(input: ScoreAllTerritoriesV2Input): TerritoryScorerOutput {
	const {
		eTarget,
		facetMetrics,
		catalog,
		currentTerritory,
		visitHistory,
		turnNumber,
		totalTurns,
		config,
	} = input;

	// Compute max priority across all facets in all territories
	let priorityMax = 0;
	for (const [, territory] of catalog) {
		for (const facet of territory.expectedFacets) {
			const p = computeFacetPriority(facet, facetMetrics, config);
			if (p > priorityMax) priorityMax = p;
		}
	}

	// Look up current territory for adjacency computation
	const currentTerritoryDef = catalog.get(currentTerritory);

	const ranked: RankedTerritory[] = [];

	for (const [, territory] of catalog) {
		const coverageGain = computeCoverageGainV2(territory, facetMetrics, priorityMax, config);

		const adjacency = currentTerritoryDef
			? computeAdjacency(currentTerritoryDef, territory, config)
			: 0;

		const skew = computeConversationSkew(territory.expectedEnergy, turnNumber, totalTurns, config);

		const malus = computeEnergyMalus(territory.expectedEnergy, eTarget, config.w_e);

		const freshness = computeFreshnessPenaltyV2(territory.id, visitHistory, turnNumber, config);

		const score = coverageGain + adjacency + skew - malus - freshness;

		const breakdown: TerritoryScoreBreakdown = {
			coverageGain,
			adjacency,
			skew,
			malus,
			freshness,
		};

		ranked.push({ territoryId: territory.id, score, breakdown });
	}

	// Sort descending by score, then by catalog order (insertion order) for tiebreak
	ranked.sort((a, b) => b.score - a.score);

	return {
		ranked,
		currentTerritory,
		turnNumber,
		totalTurns,
	};
}
