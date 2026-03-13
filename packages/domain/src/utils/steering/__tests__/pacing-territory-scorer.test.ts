/**
 * Pacing Territory Scorer Tests — Story 25-2
 *
 * Pure function tests for the evolved 5-term additive territory scorer.
 * Tests cover: coverageGain, adjacency, conversationSkew, energyMalus,
 * freshnessPenalty, scoreAllTerritoriesV2, and edge cases.
 */
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { FacetName } from "../../../constants/big-five";
import type { Territory, TerritoryId } from "../../../types/territory";
import { TerritoryIdSchema } from "../../../types/territory";
import type { FacetMetrics } from "../../formula";
import {
	computeAdjacency,
	computeConversationSkew,
	computeCoverageGainV2,
	computeEnergyMalus,
	computeFacetPriority,
	computeFreshnessPenaltyV2,
	PACING_SCORER_DEFAULTS,
	scoreAllTerritoriesV2,
} from "../pacing-territory-scorer";

// ─── Helpers ──────────────────────────────────────────────────────────

const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

function makeTerritory(overrides: Partial<Territory> & { id: string }): Territory {
	return {
		id: tid(overrides.id),
		expectedEnergy: overrides.expectedEnergy ?? 0.42,
		domains: overrides.domains ?? ["work", "relationships"],
		expectedFacets: overrides.expectedFacets ?? ["imagination", "intellect", "artistic_interests"],
		opener: overrides.opener ?? "Test opener",
	};
}

const config = PACING_SCORER_DEFAULTS;

// ─── computeFacetPriority ────────────────────────────────────────────

describe("computeFacetPriority", () => {
	it("returns maximum priority for facets with no evidence", () => {
		const metrics = new Map<FacetName, FacetMetrics>();
		const priority = computeFacetPriority("imagination", metrics, config);
		// alpha * max(0, C_target - 0) + beta * max(0, P_target - 0)
		const expected = config.priorityAlpha * config.C_target + config.priorityBeta * config.P_target;
		expect(priority).toBeCloseTo(expected, 6);
	});

	it("returns 0 for facets at or above target confidence and signal power", () => {
		const metrics = new Map<FacetName, FacetMetrics>([
			[
				"imagination",
				{
					score: 10,
					confidence: 0.9,
					signalPower: 0.6,
					domainWeights: new Map(),
				},
			],
		]);
		const priority = computeFacetPriority("imagination", metrics, config);
		expect(priority).toBe(0);
	});

	it("returns partial priority for partially-covered facets", () => {
		const metrics = new Map<FacetName, FacetMetrics>([
			[
				"imagination",
				{
					score: 10,
					confidence: 0.5,
					signalPower: 0.3,
					domainWeights: new Map(),
				},
			],
		]);
		const priority = computeFacetPriority("imagination", metrics, config);
		// alpha * max(0, 0.75 - 0.5) + beta * max(0, 0.5 - 0.3)
		const expected = config.priorityAlpha * 0.25 + config.priorityBeta * 0.2;
		expect(priority).toBeCloseTo(expected, 6);
	});
});

// ─── computeCoverageGainV2 ──────────────────────────────────────────

describe("computeCoverageGainV2", () => {
	it("returns equal coverageGain for all territories at cold start", () => {
		const emptyMetrics = new Map<FacetName, FacetMetrics>();
		const t3facets = makeTerritory({
			id: "three-facets",
			expectedFacets: ["imagination", "intellect", "artistic_interests"],
		});
		const t5facets = makeTerritory({
			id: "five-facets",
			expectedFacets: ["imagination", "intellect", "artistic_interests", "trust", "altruism"],
		});

		const gain3 = computeCoverageGainV2(t3facets, emptyMetrics, 0, config);
		const gain5 = computeCoverageGainV2(t5facets, emptyMetrics, 0, config);

		// With empty metrics, all priorities are equal, and source normalization
		// ensures same gain regardless of facet count
		expect(gain3).toBeCloseTo(gain5, 6);
	});

	it("returns sqrt(1) = 1 when all facets have max priority and max_priority > 0", () => {
		const emptyMetrics = new Map<FacetName, FacetMetrics>();
		const maxPriority =
			config.priorityAlpha * config.C_target + config.priorityBeta * config.P_target;
		const territory = makeTerritory({
			id: "test",
			expectedFacets: ["imagination", "intellect"],
		});

		const gain = computeCoverageGainV2(territory, emptyMetrics, maxPriority, config);
		// Each facet: baseYield = 0.5, ratio = 1.0 -> sum = 0.5 + 0.5 = 1.0 -> sqrt(1.0) = 1.0
		expect(gain).toBeCloseTo(1.0, 6);
	});

	it("decreases as facets gain evidence (diminishing returns via sqrt)", () => {
		const territory = makeTerritory({
			id: "test",
			expectedFacets: ["imagination", "intellect"],
		});
		const maxPriority =
			config.priorityAlpha * config.C_target + config.priorityBeta * config.P_target;

		// No evidence: full priority
		const emptyMetrics = new Map<FacetName, FacetMetrics>();
		const gainFull = computeCoverageGainV2(territory, emptyMetrics, maxPriority, config);

		// Partial evidence: imagination is partially covered
		const partialMetrics = new Map<FacetName, FacetMetrics>([
			[
				"imagination",
				{
					score: 10,
					confidence: 0.5,
					signalPower: 0.3,
					domainWeights: new Map(),
				},
			],
		]);
		const gainPartial = computeCoverageGainV2(territory, partialMetrics, maxPriority, config);

		expect(gainPartial).toBeLessThan(gainFull);
	});

	it("returns 0 for territory with no expected facets", () => {
		const territory = makeTerritory({
			id: "empty",
			expectedFacets: [] as unknown as readonly FacetName[],
		});
		const gain = computeCoverageGainV2(territory, new Map(), 1.0, config);
		expect(gain).toBe(0);
	});
});

// ─── computeAdjacency ──────────────────────────────────────────────

describe("computeAdjacency", () => {
	it("returns 1.0 for self-adjacency (same territory)", () => {
		const territory = makeTerritory({
			id: "same",
			domains: ["work", "relationships"],
			expectedFacets: ["imagination", "intellect"],
		});
		expect(computeAdjacency(territory, territory, config)).toBeCloseTo(1.0, 6);
	});

	it("returns high adjacency for territories sharing both domains", () => {
		const current = makeTerritory({
			id: "current",
			domains: ["work", "relationships"],
			expectedFacets: ["imagination"],
		});
		const candidate = makeTerritory({
			id: "candidate",
			domains: ["work", "relationships"],
			expectedFacets: ["intellect"],
		});
		const adj = computeAdjacency(current, candidate, config);
		// Domain Jaccard = 2/2 = 1.0, facet Jaccard = 0/2 = 0
		// 0.8 * 1.0 + 0.2 * 0 = 0.8
		expect(adj).toBeCloseTo(0.8, 6);
	});

	it("returns lower adjacency for territories with no shared domains or facets", () => {
		const current = makeTerritory({
			id: "current",
			domains: ["work", "relationships"],
			expectedFacets: ["imagination", "intellect"],
		});
		const candidate = makeTerritory({
			id: "candidate",
			domains: ["leisure", "solo"],
			expectedFacets: ["trust", "altruism"],
		});
		const adj = computeAdjacency(current, candidate, config);
		// Domain Jaccard = 0/4 = 0, facet Jaccard = 0/4 = 0
		expect(adj).toBeCloseTo(0, 6);
	});

	it("computes correct Jaccard for partial domain overlap", () => {
		const current = makeTerritory({
			id: "current",
			domains: ["work", "relationships"],
			expectedFacets: ["imagination", "intellect"],
		});
		const candidate = makeTerritory({
			id: "candidate",
			domains: ["work", "solo"],
			expectedFacets: ["imagination", "trust"],
		});
		const adj = computeAdjacency(current, candidate, config);
		// Domain Jaccard = 1/3, facet Jaccard = 1/3
		// 0.8 * (1/3) + 0.2 * (1/3) = 1/3
		expect(adj).toBeCloseTo(1 / 3, 4);
	});
});

// ─── computeConversationSkew ────────────────────────────────────────

describe("computeConversationSkew", () => {
	const totalTurns = 25;

	it("boosts light territories in early session (turn 2)", () => {
		// Light territory (expectedEnergy < 0.38)
		const skew = computeConversationSkew(0.25, 2, totalTurns, config);
		expect(skew).toBeGreaterThan(0);
	});

	it("does not boost heavy territories in early session", () => {
		const skew = computeConversationSkew(0.65, 2, totalTurns, config);
		expect(skew).toBe(0);
	});

	it("boosts heavy territories in late session (turn 22)", () => {
		// Heavy territory (expectedEnergy >= 0.55)
		const skew = computeConversationSkew(0.65, 22, totalTurns, config);
		expect(skew).toBeGreaterThan(0);
	});

	it("does not boost light territories in late session", () => {
		const skew = computeConversationSkew(0.25, 22, totalTurns, config);
		expect(skew).toBe(0);
	});

	it("returns 0 for mid session (turn 12)", () => {
		// Light territory - mid session
		const skewLight = computeConversationSkew(0.25, 12, totalTurns, config);
		// Heavy territory - mid session
		const skewHeavy = computeConversationSkew(0.65, 12, totalTurns, config);
		expect(skewLight).toBe(0);
		expect(skewHeavy).toBe(0);
	});

	it("returns 0 for medium-energy territories at any turn", () => {
		const skewEarly = computeConversationSkew(0.45, 2, totalTurns, config);
		const skewMid = computeConversationSkew(0.45, 12, totalTurns, config);
		const skewLate = computeConversationSkew(0.45, 22, totalTurns, config);
		expect(skewEarly).toBe(0);
		expect(skewMid).toBe(0);
		expect(skewLate).toBe(0);
	});

	it("ramps early skew linearly from 0 to earlySkewMax", () => {
		// Turn 1 is at fraction 1/25 = 0.04, within earlySkewEnd (0.2)
		const skewT1 = computeConversationSkew(0.25, 1, totalTurns, config);
		// Turn 5 is at fraction 5/25 = 0.2, at boundary
		const skewT5 = computeConversationSkew(0.25, 5, totalTurns, config);
		expect(skewT5).toBeGreaterThanOrEqual(skewT1);
		expect(skewT5).toBeCloseTo(config.earlySkewMax, 6);
	});
});

// ─── computeEnergyMalus ────────────────────────────────────────────

describe("computeEnergyMalus", () => {
	it("returns 0 when territory expectedEnergy matches E_target", () => {
		expect(computeEnergyMalus(0.5, 0.5, config.w_e)).toBe(0);
	});

	it("returns quadratic penalty for energy mismatch", () => {
		const malus = computeEnergyMalus(0.7, 0.3, config.w_e);
		// w_e * (0.7 - 0.3)^2 = 0.3 * 0.16 = 0.048
		expect(malus).toBeCloseTo(config.w_e * 0.16, 6);
	});

	it("penalizes larger gaps more severely (quadratic)", () => {
		const smallGap = computeEnergyMalus(0.5, 0.4, config.w_e);
		const largeGap = computeEnergyMalus(0.5, 0.1, config.w_e);
		expect(largeGap).toBeGreaterThan(smallGap);
		// The ratio should be proportional to gap^2
		const smallGapSq = 0.1 * 0.1;
		const largeGapSq = 0.4 * 0.4;
		expect(largeGap / smallGap).toBeCloseTo(largeGapSq / smallGapSq, 4);
	});
});

// ─── computeFreshnessPenaltyV2 ──────────────────────────────────────

describe("computeFreshnessPenaltyV2", () => {
	it("penalizes the current territory like any other recently-visited territory", () => {
		const currentTid = tid("current");
		const visitHistory = new Map([[currentTid, 3]]);
		// turnsSince = 5 - 3 = 2, penalty = max(0, w_f * (1 - 2/5)) = 0.2 * 0.6 = 0.12
		expect(computeFreshnessPenaltyV2(currentTid, visitHistory, 5, config)).toBeCloseTo(
			config.w_f * (1 - 2 / config.cooldown),
			6,
		);
	});

	it("returns 0 for never-visited territories", () => {
		const visitHistory = new Map<TerritoryId, number>();
		expect(computeFreshnessPenaltyV2(tid("new"), visitHistory, 5, config)).toBe(0);
	});

	it("penalizes recently-visited territory", () => {
		const candidateId = tid("recent");
		const visitHistory = new Map([[candidateId, 4]]); // last visited at turn 4
		const penalty = computeFreshnessPenaltyV2(candidateId, visitHistory, 5, config);
		// turnsSince = 5 - 4 = 1, penalty = max(0, w_f * (1 - 1/5)) = 0.2 * 0.8 = 0.16
		expect(penalty).toBeCloseTo(config.w_f * (1 - 1 / config.cooldown), 6);
	});

	it("penalty decays to 0 after cooldown turns", () => {
		const candidateId = tid("old");
		const visitHistory = new Map([[candidateId, 0]]); // visited at turn 0
		const penalty = computeFreshnessPenaltyV2(candidateId, visitHistory, 5, config);
		// turnsSince = 5 - 0 = 5, penalty = max(0, w_f * (1 - 5/5)) = max(0, 0) = 0
		expect(penalty).toBe(0);
	});

	it("penalty is capped at w_f for just-visited territory", () => {
		const candidateId = tid("just-visited");
		const visitHistory = new Map([[candidateId, 5]]); // visited this turn
		const penalty = computeFreshnessPenaltyV2(candidateId, visitHistory, 5, config);
		// turnsSince = 0, penalty = w_f * (1 - 0/5) = w_f
		expect(penalty).toBeCloseTo(config.w_f, 6);
	});
});

// ─── scoreAllTerritoriesV2 ──────────────────────────────────────────

describe("scoreAllTerritoriesV2", () => {
	const lightTerritory = makeTerritory({
		id: "light-test",
		expectedEnergy: 0.25,
		domains: ["leisure", "solo"],
		expectedFacets: ["imagination", "intellect"],
	});
	const mediumTerritory = makeTerritory({
		id: "medium-test",
		expectedEnergy: 0.42,
		domains: ["work", "relationships"],
		expectedFacets: ["assertiveness", "achievement_striving"],
	});
	const heavyTerritory = makeTerritory({
		id: "heavy-test",
		expectedEnergy: 0.65,
		domains: ["solo", "relationships"],
		expectedFacets: ["vulnerability", "depression"],
	});

	const catalog: ReadonlyMap<TerritoryId, Territory> = new Map([
		[lightTerritory.id, lightTerritory],
		[mediumTerritory.id, mediumTerritory],
		[heavyTerritory.id, heavyTerritory],
	]);

	it("returns all territories sorted by score descending", () => {
		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 5,
			totalTurns: 25,
			config,
		});
		expect(result.ranked).toHaveLength(3);
		for (let i = 1; i < result.ranked.length; i++) {
			// biome-ignore lint/style/noNonNullAssertion: test assertion
			expect(result.ranked[i - 1]!.score).toBeGreaterThanOrEqual(result.ranked[i]!.score);
		}
	});

	it("outputs correct TerritoryScorerOutput structure", () => {
		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 5,
			totalTurns: 25,
			config,
		});

		expect(result.currentTerritory).toBe(mediumTerritory.id);
		expect(result.turnNumber).toBe(5);
		expect(result.totalTurns).toBe(25);

		// Check breakdown structure
		const first = result.ranked[0]!;
		expect(first).toHaveProperty("territoryId");
		expect(first).toHaveProperty("score");
		expect(first.breakdown).toHaveProperty("coverageGain");
		expect(first.breakdown).toHaveProperty("adjacency");
		expect(first.breakdown).toHaveProperty("skew");
		expect(first.breakdown).toHaveProperty("malus");
		expect(first.breakdown).toHaveProperty("freshness");
	});

	it("score = coverageGain + adjacency + skew - malus - freshness", () => {
		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 5,
			totalTurns: 25,
			config,
		});
		for (const r of result.ranked) {
			const { coverageGain, adjacency, skew, malus, freshness } = r.breakdown;
			expect(r.score).toBeCloseTo(coverageGain + adjacency + skew - malus - freshness, 6);
		}
	});

	it("early session boosts light territories via conversationSkew", () => {
		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 2,
			totalTurns: 25,
			config,
		});

		const lightResult = result.ranked.find((r) => r.territoryId === lightTerritory.id)!;
		const heavyResult = result.ranked.find((r) => r.territoryId === heavyTerritory.id)!;
		expect(lightResult.breakdown.skew).toBeGreaterThan(0);
		expect(heavyResult.breakdown.skew).toBe(0);
	});

	it("late session boosts heavy territories via conversationSkew", () => {
		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 22,
			totalTurns: 25,
			config,
		});

		const lightResult = result.ranked.find((r) => r.territoryId === lightTerritory.id)!;
		const heavyResult = result.ranked.find((r) => r.territoryId === heavyTerritory.id)!;
		expect(heavyResult.breakdown.skew).toBeGreaterThan(0);
		expect(lightResult.breakdown.skew).toBe(0);
	});

	it("coverage drives shifts: coverageGain declines as facets get evidence", () => {
		// No evidence
		const resultEmpty = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 10,
			totalTurns: 25,
			config,
		});

		// With evidence on lightTerritory's facets
		const facetMetrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.7, signalPower: 0.45, domainWeights: new Map() }],
			["intellect", { score: 10, confidence: 0.7, signalPower: 0.45, domainWeights: new Map() }],
		]);

		const resultWithEvidence = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics,
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 10,
			totalTurns: 25,
			config,
		});

		const lightEmpty = resultEmpty.ranked.find((r) => r.territoryId === lightTerritory.id)!;
		const lightCovered = resultWithEvidence.ranked.find((r) => r.territoryId === lightTerritory.id)!;
		expect(lightCovered.breakdown.coverageGain).toBeLessThan(lightEmpty.breakdown.coverageGain);
	});

	it("energy malus penalizes territories far from E_target", () => {
		// E_target = 0.25 (low), so heavy territory should have high malus
		const result = scoreAllTerritoriesV2({
			eTarget: 0.25,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory: new Map(),
			turnNumber: 10,
			totalTurns: 25,
			config,
		});

		const lightResult = result.ranked.find((r) => r.territoryId === lightTerritory.id)!;
		const heavyResult = result.ranked.find((r) => r.territoryId === heavyTerritory.id)!;
		expect(heavyResult.breakdown.malus).toBeGreaterThan(lightResult.breakdown.malus);
	});

	it("freshness penalizes recently-visited non-current territories", () => {
		const visitHistory = new Map<TerritoryId, number>([
			[lightTerritory.id, 4], // visited at turn 4
		]);

		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory,
			turnNumber: 5,
			totalTurns: 25,
			config,
		});

		const lightResult = result.ranked.find((r) => r.territoryId === lightTerritory.id)!;
		const heavyResult = result.ranked.find((r) => r.territoryId === heavyTerritory.id)!;
		expect(lightResult.breakdown.freshness).toBeGreaterThan(0);
		expect(heavyResult.breakdown.freshness).toBe(0); // never visited
	});

	it("currentTerritory: null produces 0 adjacency for all candidates (turn 1 scenario)", () => {
		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: null,
			visitHistory: new Map(),
			turnNumber: 1,
			totalTurns: 25,
			config,
		});

		for (const r of result.ranked) {
			expect(r.breakdown.adjacency).toBe(0);
		}
		expect(result.currentTerritory).toBeNull();
	});

	it("current territory receives freshness penalty when recently visited", () => {
		const visitHistory = new Map<TerritoryId, number>([
			[mediumTerritory.id, 4], // visited at turn 4
		]);

		const result = scoreAllTerritoriesV2({
			eTarget: 0.5,
			facetMetrics: new Map(),
			catalog,
			currentTerritory: mediumTerritory.id,
			visitHistory,
			turnNumber: 5,
			totalTurns: 25,
			config,
		});

		const mediumResult = result.ranked.find((r) => r.territoryId === mediumTerritory.id)!;
		// turnsSince = 5 - 4 = 1, penalty = w_f * (1 - 1/5) = 0.2 * 0.8 = 0.16
		expect(mediumResult.breakdown.freshness).toBeCloseTo(config.w_f * (1 - 1 / config.cooldown), 6);
	});
});
