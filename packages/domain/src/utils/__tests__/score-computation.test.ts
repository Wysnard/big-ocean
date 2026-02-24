/**
 * Score Computation Tests (Story 11.3, Task 3)
 */
import { describe, expect, it } from "vitest";
import { ALL_FACETS, TRAIT_NAMES, TRAIT_TO_FACETS } from "../../constants/big-five";
import { LIFE_DOMAINS } from "../../constants/life-domain";
import type { EvidenceInput } from "../../types/evidence";
import { FORMULA_DEFAULTS } from "../formula";
import {
	computeAllFacetResults,
	computeDomainCoverage,
	computeTraitResults,
} from "../score-computation";

describe("computeAllFacetResults", () => {
	it("returns all 30 facets at defaults when evidence is empty", () => {
		const result = computeAllFacetResults([]);

		expect(Object.keys(result)).toHaveLength(30);
		for (const facet of ALL_FACETS) {
			expect(result[facet]).toEqual({
				score: FORMULA_DEFAULTS.SCORE_MIDPOINT,
				confidence: 0,
				signalPower: 0,
			});
		}
	});

	it("computes correct score for single-facet evidence and defaults for other 29", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 15, confidence: 0.8, domain: "leisure" },
			{ bigfiveFacet: "imagination", score: 17, confidence: 0.9, domain: "work" },
		];

		const result = computeAllFacetResults(evidence);

		// imagination should have a non-default score
		expect(result.imagination.score).toBeGreaterThan(0);
		expect(result.imagination.confidence).toBeGreaterThan(0);

		// other facets should be defaults
		expect(result.artistic_interests).toEqual({
			score: FORMULA_DEFAULTS.SCORE_MIDPOINT,
			confidence: 0,
			signalPower: 0,
		});
	});

	it("computes scores for multi-domain evidence across multiple facets", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 15, confidence: 0.8, domain: "leisure" },
			{ bigfiveFacet: "trust", score: 12, confidence: 0.7, domain: "relationships" },
			{ bigfiveFacet: "anxiety", score: 5, confidence: 0.6, domain: "work" },
		];

		const result = computeAllFacetResults(evidence);

		expect(result.imagination.confidence).toBeGreaterThan(0);
		expect(result.trust.confidence).toBeGreaterThan(0);
		expect(result.anxiety.confidence).toBeGreaterThan(0);
		// 27 other facets at defaults
		expect(result.altruism.confidence).toBe(0);
	});
});

describe("computeTraitResults", () => {
	it("returns trait score equal to facet score when all facets are uniform", () => {
		const facets = {} as Record<string, { score: number; confidence: number; signalPower: number }>;
		for (const facet of ALL_FACETS) {
			facets[facet] = { score: 12, confidence: 0.5, signalPower: 0.3 };
		}

		const result = computeTraitResults(facets as ReturnType<typeof computeAllFacetResults>);

		for (const trait of TRAIT_NAMES) {
			expect(result[trait].score).toBeCloseTo(12);
			expect(result[trait].confidence).toBeCloseTo(0.5);
			expect(result[trait].signalPower).toBeCloseTo(0.3);
		}
	});

	it("returns trait as average of its 6 facets when mixed", () => {
		const facets = {} as Record<string, { score: number; confidence: number; signalPower: number }>;
		for (const facet of ALL_FACETS) {
			facets[facet] = { score: 10, confidence: 0, signalPower: 0 };
		}
		// Set openness facets to varied scores
		const opennessFacets = TRAIT_TO_FACETS.openness;
		facets[opennessFacets[0]] = { score: 18, confidence: 0.9, signalPower: 0.6 };
		facets[opennessFacets[1]] = { score: 6, confidence: 0.3, signalPower: 0.1 };
		// Other 4 openness facets stay at defaults (10, 0, 0)

		const result = computeTraitResults(facets as ReturnType<typeof computeAllFacetResults>);

		const expectedScore = (18 + 6 + 10 + 10 + 10 + 10) / 6;
		expect(result.openness.score).toBeCloseTo(expectedScore);
		expect(result.openness.confidence).toBeCloseTo((0.9 + 0.3 + 0 + 0 + 0 + 0) / 6);
	});

	it("returns zero confidence when all facets have zero confidence", () => {
		const facets = {} as Record<string, { score: number; confidence: number; signalPower: number }>;
		for (const facet of ALL_FACETS) {
			facets[facet] = { score: 10, confidence: 0, signalPower: 0 };
		}

		const result = computeTraitResults(facets as ReturnType<typeof computeAllFacetResults>);

		for (const trait of TRAIT_NAMES) {
			expect(result[trait].confidence).toBe(0);
			expect(result[trait].signalPower).toBe(0);
		}
	});
});

describe("computeDomainCoverage", () => {
	it("returns all zeros when evidence is empty", () => {
		const result = computeDomainCoverage([]);

		for (const domain of LIFE_DOMAINS) {
			expect(result[domain]).toBe(0);
		}
	});

	it("returns 1.0 for single domain", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 10, confidence: 0.5, domain: "work" },
			{ bigfiveFacet: "trust", score: 10, confidence: 0.5, domain: "work" },
		];

		const result = computeDomainCoverage(evidence);

		expect(result.work).toBe(1.0);
		expect(result.relationships).toBe(0);
		expect(result.family).toBe(0);
	});

	it("returns ~0.33 each for balanced 3 domains", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 10, confidence: 0.5, domain: "work" },
			{ bigfiveFacet: "trust", score: 10, confidence: 0.5, domain: "relationships" },
			{ bigfiveFacet: "anxiety", score: 10, confidence: 0.5, domain: "family" },
		];

		const result = computeDomainCoverage(evidence);

		expect(result.work).toBeCloseTo(1 / 3);
		expect(result.relationships).toBeCloseTo(1 / 3);
		expect(result.family).toBeCloseTo(1 / 3);
		expect(result.leisure).toBe(0);
	});

	it("includes 'other' domain", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 10, confidence: 0.5, domain: "other" },
		];

		const result = computeDomainCoverage(evidence);
		expect(result.other).toBe(1.0);
	});

	it("sums to approximately 1.0 for mixed evidence", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 10, confidence: 0.5, domain: "work" },
			{ bigfiveFacet: "trust", score: 10, confidence: 0.5, domain: "work" },
			{ bigfiveFacet: "anxiety", score: 10, confidence: 0.5, domain: "relationships" },
			{ bigfiveFacet: "altruism", score: 10, confidence: 0.5, domain: "family" },
			{ bigfiveFacet: "intellect", score: 10, confidence: 0.5, domain: "leisure" },
		];

		const result = computeDomainCoverage(evidence);

		const sum = LIFE_DOMAINS.reduce((acc, d) => acc + result[d], 0);
		expect(sum).toBeCloseTo(1.0);
	});
});
