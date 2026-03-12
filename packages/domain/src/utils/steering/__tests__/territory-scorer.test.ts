/**
 * Territory Scorer Tests — Story 21-3
 *
 * Pure function tests for territory scoring and selection.
 * Tests cover: coverage value, freshness bonus, territory scoring,
 * score-all, select, and edge cases (FR4, FR5, FR18).
 */
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { FacetName } from "../../../constants/big-five";
import type { Territory, TerritoryId } from "../../../types/territory";
import { TerritoryIdSchema } from "../../../types/territory";
import type { DRSConfig } from "../drs";
import {
	buildFacetEvidenceCounts,
	computeCoverageValue,
	computeFreshnessBonus,
	extractTerritoryScorerConfig,
	scoreAllTerritories,
	scoreTerritory,
	selectTerritory,
	type TerritoryScorerConfig,
	type TerritoryVisitHistory,
} from "../territory-scorer";

// ─── Helpers ──────────────────────────────────────────────────────────

const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

const defaultScorerConfig: TerritoryScorerConfig = {
	minEvidenceThreshold: 3,
	maxTerritoryVisits: 2,
	freshnessRate: 0.05,
	freshnessMin: 0.8,
	freshnessMax: 1.2,
};

const defaultDRSConfig: DRSConfig = {
	breadthWeight: 0.55,
	engagementWeight: 0.45,
	breadthOffset: 10,
	breadthRange: 15,
	wordCountThreshold: 120,
	evidenceThreshold: 6,
	engagementWordWeight: 0.55,
	engagementEvidenceWeight: 0.45,
	recencyWeights: [1.0, 0.6, 0.3],
	energyWeightLight: 0,
	energyWeightMedium: 1,
	energyWeightHeavy: 2,
	lightFitCenter: 0.55,
	lightFitRange: 0.35,
	mediumFitCenter: 0.55,
	mediumFitRange: 0.35,
	heavyFitCenter: 0.65,
	heavyFitRange: 0.25,
};

function makeTerritory(overrides: Partial<Territory> & { id: string }): Territory {
	return {
		id: tid(overrides.id),
		expectedEnergy: overrides.expectedEnergy ?? 0.42,
		domains: overrides.domains ?? ["work", "relationships"],
		expectedFacets: overrides.expectedFacets ?? ["imagination", "intellect", "artistic_interests"],
		opener: overrides.opener ?? "Test opener",
	};
}

// ─── computeCoverageValue ─────────────────────────────────────────────

describe("computeCoverageValue", () => {
	it("returns 1.0 when all expected facets are thin (below threshold)", () => {
		const territory = makeTerritory({
			id: "test-territory",
			expectedFacets: ["imagination", "intellect", "artistic_interests"],
		});
		// No evidence for any facet
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map();
		expect(computeCoverageValue(territory, evidenceCounts, defaultScorerConfig)).toBe(1);
	});

	it("returns 0.0 when all expected facets are well-covered", () => {
		const territory = makeTerritory({
			id: "test-territory",
			expectedFacets: ["imagination", "intellect", "artistic_interests"],
		});
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map([
			["imagination", 5],
			["intellect", 4],
			["artistic_interests", 3],
		]);
		expect(computeCoverageValue(territory, evidenceCounts, defaultScorerConfig)).toBe(0);
	});

	it("returns proportion of thin facets", () => {
		const territory = makeTerritory({
			id: "test-territory",
			expectedFacets: ["imagination", "intellect", "artistic_interests"],
		});
		// imagination: 5 (covered), intellect: 1 (thin), artistic_interests: 0 (thin)
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map([
			["imagination", 5],
			["intellect", 1],
		]);
		// 2 thin out of 3 = 0.667
		expect(computeCoverageValue(territory, evidenceCounts, defaultScorerConfig)).toBeCloseTo(
			2 / 3,
			3,
		);
	});

	it("treats missing facets as thin (0 evidence)", () => {
		const territory = makeTerritory({
			id: "test-territory",
			expectedFacets: ["imagination", "intellect"],
		});
		// Only imagination has evidence, intellect is missing from map
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map([["imagination", 5]]);
		// 1 thin out of 2 = 0.5
		expect(computeCoverageValue(territory, evidenceCounts, defaultScorerConfig)).toBe(0.5);
	});

	it("returns 0 for territory with 0 expected facets", () => {
		const territory = makeTerritory({
			id: "test-territory",
			expectedFacets: [] as unknown as readonly FacetName[],
		});
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map();
		expect(computeCoverageValue(territory, evidenceCounts, defaultScorerConfig)).toBe(0);
	});

	it("treats exactly-at-threshold as covered", () => {
		const territory = makeTerritory({
			id: "test-territory",
			expectedFacets: ["imagination"],
		});
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map([["imagination", 3]]);
		// 3 is at threshold (3), should be covered (not thin)
		expect(computeCoverageValue(territory, evidenceCounts, defaultScorerConfig)).toBe(0);
	});
});

// ─── computeFreshnessBonus ────────────────────────────────────────────

describe("computeFreshnessBonus", () => {
	it("returns freshnessMax (1.2) for never-visited territories", () => {
		const visitHistory: TerritoryVisitHistory = new Map();
		expect(computeFreshnessBonus(tid("test"), visitHistory, 10, defaultScorerConfig)).toBe(1.2);
	});

	it("returns 1.0 for just-visited territory (0 exchanges since)", () => {
		const visitHistory: TerritoryVisitHistory = new Map([
			[tid("test"), { visitCount: 1, lastVisitExchange: 5 }],
		]);
		expect(computeFreshnessBonus(tid("test"), visitHistory, 5, defaultScorerConfig)).toBe(1.0);
	});

	it("grows by freshnessRate per exchange since last visit", () => {
		const visitHistory: TerritoryVisitHistory = new Map([
			[tid("test"), { visitCount: 1, lastVisitExchange: 5 }],
		]);
		// 4 exchanges since: 1.0 + (4 * 0.05) = 1.2
		expect(computeFreshnessBonus(tid("test"), visitHistory, 9, defaultScorerConfig)).toBe(1.2);
	});

	it("caps at freshnessMax (1.2)", () => {
		const visitHistory: TerritoryVisitHistory = new Map([
			[tid("test"), { visitCount: 1, lastVisitExchange: 0 }],
		]);
		// 20 exchanges since: 1.0 + (20 * 0.05) = 2.0 -> capped at 1.2
		expect(computeFreshnessBonus(tid("test"), visitHistory, 20, defaultScorerConfig)).toBe(1.2);
	});

	it("does not go below freshnessMin (0.8)", () => {
		// Edge case: negative exchanges (shouldn't happen normally)
		const visitHistory: TerritoryVisitHistory = new Map([
			[tid("test"), { visitCount: 1, lastVisitExchange: 10 }],
		]);
		// -5 exchanges since: 1.0 + (-5 * 0.05) = 0.75 -> clamped to 0.8
		expect(computeFreshnessBonus(tid("test"), visitHistory, 5, defaultScorerConfig)).toBe(0.8);
	});

	it("returns intermediate value for 2 exchanges since", () => {
		const visitHistory: TerritoryVisitHistory = new Map([
			[tid("test"), { visitCount: 1, lastVisitExchange: 3 }],
		]);
		// 2 exchanges since: 1.0 + (2 * 0.05) = 1.1
		expect(computeFreshnessBonus(tid("test"), visitHistory, 5, defaultScorerConfig)).toBeCloseTo(
			1.1,
			3,
		);
	});
});

// ─── scoreTerritory ───────────────────────────────────────────────────

describe("scoreTerritory", () => {
	it("returns product of coverage, energyFit, and freshness", () => {
		expect(scoreTerritory(0.8, 0.7, 1.1)).toBeCloseTo(0.8 * 0.7 * 1.1, 3);
	});

	it("returns 0 when any component is 0", () => {
		expect(scoreTerritory(0, 0.7, 1.1)).toBe(0);
		expect(scoreTerritory(0.8, 0, 1.1)).toBe(0);
		expect(scoreTerritory(0.8, 0.7, 0)).toBe(0);
	});

	it("returns max when all components are at their max", () => {
		// coverage=1, energyFit=1, freshness=1.2
		expect(scoreTerritory(1, 1, 1.2)).toBe(1.2);
	});
});

// ─── scoreAllTerritories ──────────────────────────────────────────────

describe("scoreAllTerritories", () => {
	const lightTerritory = makeTerritory({
		id: "light-test",
		expectedEnergy: 0.25,
		expectedFacets: ["imagination", "intellect"],
	});
	const mediumTerritory = makeTerritory({
		id: "medium-test",
		expectedEnergy: 0.42,
		expectedFacets: ["assertiveness", "achievement_striving"],
	});
	const heavyTerritory = makeTerritory({
		id: "heavy-test",
		expectedEnergy: 0.65,
		expectedFacets: ["vulnerability", "depression"],
	});

	const catalog: ReadonlyMap<TerritoryId, Territory> = new Map([
		[lightTerritory.id, lightTerritory],
		[mediumTerritory.id, mediumTerritory],
		[heavyTerritory.id, heavyTerritory],
	]);

	it("returns all territories sorted by score descending", () => {
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map();
		const visitHistory: TerritoryVisitHistory = new Map();
		// DRS = 0.1 -> light territories favored
		const result = scoreAllTerritories(
			catalog,
			evidenceCounts,
			0.1,
			visitHistory,
			0,
			defaultDRSConfig,
			defaultScorerConfig,
		);
		expect(result).toHaveLength(3);
		// Scores should be descending
		for (let i = 1; i < result.length; i++) {
			expect(result[i - 1]?.score).toBeGreaterThanOrEqual(result[i]?.score);
		}
	});

	it("gives score 0 to territories at visit cap (FR18)", () => {
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map();
		const visitHistory: TerritoryVisitHistory = new Map([
			[lightTerritory.id, { visitCount: 2, lastVisitExchange: 1 }],
		]);
		const result = scoreAllTerritories(
			catalog,
			evidenceCounts,
			0.1,
			visitHistory,
			5,
			defaultDRSConfig,
			defaultScorerConfig,
		);
		const lightResult = result.find((s) => s.territory.id === lightTerritory.id);
		expect(lightResult?.score).toBe(0);
	});

	it("deprioritizes high-coverage territories (FR5)", () => {
		// Give light territory's facets plenty of evidence
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map([
			["imagination", 10],
			["intellect", 10],
		]);
		const visitHistory: TerritoryVisitHistory = new Map();
		const result = scoreAllTerritories(
			catalog,
			evidenceCounts,
			0.1,
			visitHistory,
			0,
			defaultDRSConfig,
			defaultScorerConfig,
		);
		const lightResult = result.find((s) => s.territory.id === lightTerritory.id);
		// coverageValue should be 0 since all facets are well-covered
		expect(lightResult?.coverageValue).toBe(0);
		expect(lightResult?.score).toBe(0);
	});

	it("freshness causes territory revisits (FR4)", () => {
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map();
		// Light territory visited recently, medium territory visited long ago
		const visitHistory: TerritoryVisitHistory = new Map([
			[lightTerritory.id, { visitCount: 1, lastVisitExchange: 4 }],
			[mediumTerritory.id, { visitCount: 1, lastVisitExchange: 0 }],
		]);
		const result = scoreAllTerritories(
			catalog,
			evidenceCounts,
			0.1,
			visitHistory,
			5,
			defaultDRSConfig,
			defaultScorerConfig,
		);
		const lightResult = result.find((s) => s.territory.id === lightTerritory.id);
		const mediumResult = result.find((s) => s.territory.id === mediumTerritory.id);
		// Medium territory has higher freshness (5 exchanges since) vs light (1 exchange since)
		expect(mediumResult?.freshnessBonus).toBeGreaterThan(lightResult?.freshnessBonus);
	});

	it("returns correct ScoredTerritory structure", () => {
		const evidenceCounts: ReadonlyMap<FacetName, number> = new Map();
		const visitHistory: TerritoryVisitHistory = new Map();
		const result = scoreAllTerritories(
			catalog,
			evidenceCounts,
			0.5,
			visitHistory,
			0,
			defaultDRSConfig,
			defaultScorerConfig,
		);
		const first = result[0]!;
		expect(first).toHaveProperty("territory");
		expect(first).toHaveProperty("score");
		expect(first).toHaveProperty("coverageValue");
		expect(first).toHaveProperty("energyFit");
		expect(first).toHaveProperty("freshnessBonus");
	});
});

// ─── selectTerritory ──────────────────────────────────────────────────

describe("selectTerritory", () => {
	it("returns the highest-scoring territory", () => {
		const scored = [
			{
				territory: makeTerritory({ id: "best" }),
				score: 0.9,
				coverageValue: 0.8,
				energyFit: 0.9,
				freshnessBonus: 1.2,
			},
			{
				territory: makeTerritory({ id: "second" }),
				score: 0.5,
				coverageValue: 0.6,
				energyFit: 0.7,
				freshnessBonus: 1.0,
			},
		];
		const result = selectTerritory(scored);
		expect(result.territoryId).toBe(scored[0]?.territory.id);
	});

	it("falls back to highest coverage_value when all scores are 0", () => {
		const scored = [
			{
				territory: makeTerritory({ id: "high-coverage" }),
				score: 0,
				coverageValue: 0.9,
				energyFit: 0,
				freshnessBonus: 1.0,
			},
			{
				territory: makeTerritory({ id: "low-coverage" }),
				score: 0,
				coverageValue: 0.3,
				energyFit: 0,
				freshnessBonus: 1.0,
			},
		];
		const result = selectTerritory(scored);
		expect(result.territoryId).toBe(tid("high-coverage"));
	});
});

// ─── buildFacetEvidenceCounts ─────────────────────────────────────────

describe("buildFacetEvidenceCounts", () => {
	it("returns empty map for empty evidence array", () => {
		const result = buildFacetEvidenceCounts([]);
		expect(result.size).toBe(0);
	});

	it("counts evidence items per facet", () => {
		const result = buildFacetEvidenceCounts([
			{
				bigfiveFacet: "imagination",
				deviation: 1.5,
				strength: "moderate",
				confidence: "medium",
				domain: "leisure",
			},
			{
				bigfiveFacet: "imagination",
				deviation: 0.8,
				strength: "weak",
				confidence: "low",
				domain: "solo",
			},
			{
				bigfiveFacet: "intellect",
				deviation: 2.0,
				strength: "strong",
				confidence: "high",
				domain: "work",
			},
		]);
		expect(result.get("imagination")).toBe(2);
		expect(result.get("intellect")).toBe(1);
		expect(result.size).toBe(2);
	});
});

// ─── extractTerritoryScorerConfig ─────────────────────────────────────

describe("extractTerritoryScorerConfig", () => {
	it("extracts territory scorer config fields from AppConfigService", () => {
		const appConfig = {
			territoryMinEvidenceThreshold: 3,
			territoryMaxVisits: 2,
			territoryFreshnessRate: 0.05,
			territoryFreshnessMin: 0.8,
			territoryFreshnessMax: 1.2,
		} as Parameters<typeof extractTerritoryScorerConfig>[0];

		const config = extractTerritoryScorerConfig(appConfig);
		expect(config.minEvidenceThreshold).toBe(3);
		expect(config.maxTerritoryVisits).toBe(2);
		expect(config.freshnessRate).toBe(0.05);
		expect(config.freshnessMin).toBe(0.8);
		expect(config.freshnessMax).toBe(1.2);
	});
});
