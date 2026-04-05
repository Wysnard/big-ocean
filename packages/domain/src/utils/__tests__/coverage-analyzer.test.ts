import { describe, expect, it } from "@effect/vitest";
import { ALL_FACETS, OCEAN_INTERLEAVED_ORDER } from "../../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../../constants/facet-prompt-definitions";
import { LIFE_DOMAIN_DEFINITIONS, STEERABLE_DOMAINS } from "../../constants/life-domain";
import type { CoverageHistoryEntry, CoverageTarget } from "../coverage-analyzer";
import {
	analyzeCoverage,
	enrichWithDefinitions,
	extractCoverageHistoryEntry,
} from "../coverage-analyzer";
import { makeEvidence } from "./__fixtures__/formula.fixtures";

describe("analyzeCoverage", () => {
	it("returns deterministic defaults for zero evidence", () => {
		const result = analyzeCoverage([]);

		expect(result.primaryFacet).toBe(OCEAN_INTERLEAVED_ORDER[0]);
		expect(result.candidateDomains).toEqual(STEERABLE_DOMAINS.slice(0, 3));
	});

	it("prefers zero-evidence facets over already supported ones", () => {
		const evidence = [
			makeEvidence("imagination", "work", 2, "strong", "high"),
			makeEvidence("imagination", "leisure", 2, "strong", "high"),
			makeEvidence("trust", "relationships", 1, "moderate", "medium"),
		];

		const result = analyzeCoverage(evidence);
		expect(result.primaryFacet).not.toBe("imagination");
		expect(result.primaryFacet).not.toBe("trust");
	});

	it("deprioritizes balanced multi-domain facets relative to thin single-domain facets", () => {
		const evidence = ALL_FACETS.flatMap((facet) => {
			if (facet === "imagination") {
				return [
					makeEvidence(facet, "work", 2, "strong", "high"),
					makeEvidence(facet, "relationships", 2, "strong", "high"),
					makeEvidence(facet, "leisure", 2, "strong", "high"),
				];
			}

			if (facet === "trust") {
				return [makeEvidence(facet, "work", 2, "strong", "high")];
			}

			return [
				makeEvidence(facet, "work", 1, "moderate", "medium"),
				makeEvidence(facet, "leisure", 1, "moderate", "medium"),
			];
		});

		const result = analyzeCoverage(evidence);
		expect(result.primaryFacet).toBe("trust");
	});

	it("chooses missing domains first for the selected facet", () => {
		const evidence = ALL_FACETS.flatMap((facet) => {
			if (facet === "imagination") {
				return [makeEvidence(facet, "work", 2, "strong", "high")];
			}

			return [
				makeEvidence(facet, "work", 1, "moderate", "medium"),
				makeEvidence(facet, "leisure", 1, "moderate", "medium"),
			];
		});
		const result = analyzeCoverage(evidence, {
			history: [{ turnNumber: 1, primaryFacet: "imagination", preferredDomain: "work" }],
		});

		expect(result.primaryFacet).toBe("imagination");
		expect(result.candidateDomains).not.toContain("work");
		expect(result.candidateDomains).toHaveLength(3);
	});

	it("uses global domain weakness when the selected facet has no evidence", () => {
		const evidence = ALL_FACETS.flatMap((facet) =>
			facet === "imagination"
				? [
						makeEvidence(facet, "work", 2, "strong", "high"),
						makeEvidence(facet, "relationships", 2, "strong", "high"),
					]
				: [],
		);

		const result = analyzeCoverage(evidence);
		expect(result.candidateDomains).toEqual(["family", "leisure", "health"]);
	});

	it("uses recency as a late tiebreaker", () => {
		const history: CoverageHistoryEntry[] = [
			{ turnNumber: 3, primaryFacet: "imagination", preferredDomain: "work" },
		];

		const result = analyzeCoverage([], { history });
		expect(result.primaryFacet).not.toBe("imagination");
	});

	it("opening phase lasts until 10 evidence records", () => {
		const low = analyzeCoverage(
			Array.from({ length: 9 }, () => makeEvidence("trust", "work", 1, "moderate", "medium")),
		);
		const high = analyzeCoverage(
			Array.from({ length: 10 }, () => makeEvidence("trust", "work", 1, "moderate", "medium")),
		);

		expect(low.phase).toBe("opening");
		expect(high.phase).toBe("exploring");
	});
});

describe("extractCoverageHistoryEntry", () => {
	it("decodes the new coverage target shape", () => {
		const result = extractCoverageHistoryEntry({
			turnNumber: 2,
			coverageTargets: {
				primaryFacet: "trust",
				candidateDomains: ["family", "relationships", "health"],
			},
		});

		expect(result).toEqual({
			turnNumber: 2,
			primaryFacet: "trust",
			preferredDomain: "family",
		});
	});

	it("decodes the legacy coverage target shape", () => {
		const result = extractCoverageHistoryEntry({
			turnNumber: 2,
			coverageTargets: {
				targetFacets: ["trust", "friendliness"],
				targetDomain: "family",
			},
		});

		expect(result).toEqual({
			turnNumber: 2,
			primaryFacet: "trust",
			preferredDomain: "family",
		});
	});

	it("returns null for malformed targets", () => {
		const result = extractCoverageHistoryEntry({
			turnNumber: 1,
			coverageTargets: { foo: "bar" },
		});

		expect(result).toBeNull();
	});
});

describe("enrichWithDefinitions", () => {
	it("pairs the primary facet definition", () => {
		const target: CoverageTarget = {
			primaryFacet: "imagination",
			candidateDomains: ["work", "health", "family"],
			phase: "exploring",
		};

		const enriched = enrichWithDefinitions(target);
		expect(enriched.primaryFacet.definition).toBe(FACET_PROMPT_DEFINITIONS.imagination);
	});

	it("pairs candidate domain definitions in order", () => {
		const target: CoverageTarget = {
			primaryFacet: "trust",
			candidateDomains: ["health", "family", "relationships"],
			phase: "exploring",
		};

		const enriched = enrichWithDefinitions(target);
		expect(enriched.candidateDomains[0]?.domain).toBe("health");
		expect(enriched.candidateDomains[0]?.definition).toBe(LIFE_DOMAIN_DEFINITIONS.health);
		expect(enriched.candidateDomains[1]?.domain).toBe("family");
		expect(enriched.candidateDomains[2]?.domain).toBe("relationships");
	});
});
