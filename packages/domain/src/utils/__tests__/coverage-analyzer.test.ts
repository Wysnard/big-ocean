import { describe, expect, it } from "@effect/vitest";
import { ALL_FACETS, OCEAN_INTERLEAVED_ORDER } from "../../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../../constants/facet-prompt-definitions";
import {
	LIFE_DOMAIN_DEFINITIONS,
	type LifeDomain,
	STEERABLE_DOMAINS,
} from "../../constants/life-domain";
import type { EvidenceInput } from "../../types/evidence";
import { analyzeCoverage, type CoverageTarget, enrichWithDefinitions } from "../coverage-analyzer";
import { makeEvidence } from "./__fixtures__/formula.fixtures";

// ─── analyzeCoverage tests ──────────────────────────────────────────

describe("analyzeCoverage", () => {
	it("returns deterministic default for zero evidence", () => {
		const result = analyzeCoverage([]);

		// Should return first steerable domain
		expect(STEERABLE_DOMAINS).toContain(result.targetDomain);

		// Should return exactly 3 facets
		expect(result.targetFacets).toHaveLength(3);

		// All facets should be valid FacetNames
		for (const facet of result.targetFacets) {
			expect(ALL_FACETS).toContain(facet);
		}
	});

	it("zero evidence is deterministic — same result on repeated calls", () => {
		const r1 = analyzeCoverage([]);
		const r2 = analyzeCoverage([]);
		expect(r1).toEqual(r2);
	});

	it("zero evidence uses STEERABLE_DOMAINS order for domain tiebreak", () => {
		const result = analyzeCoverage([]);
		// All domains have zero confidence, so tiebreak goes to first in STEERABLE_DOMAINS
		expect(result.targetDomain).toBe(STEERABLE_DOMAINS[0]);
	});

	it("zero evidence uses OCEAN_INTERLEAVED_ORDER for facet tiebreak", () => {
		const result = analyzeCoverage([]);
		// All facets are at zero confidence in the target domain, so pick first 3 from OCEAN interleaved
		const first3 = OCEAN_INTERLEAVED_ORDER.slice(0, 3);
		expect(result.targetFacets).toEqual(first3);
	});

	it("targets an unexplored domain when one domain has heavy evidence", () => {
		// Create strong evidence for many facets in "work" domain
		const workEvidence: EvidenceInput[] = ALL_FACETS.map((facet) =>
			makeEvidence(facet, "work", 2, "strong", "high"),
		);
		const result = analyzeCoverage(workEvidence);

		// Target domain should NOT be "work" since it has the most coverage
		expect(result.targetDomain).not.toBe("work");
		expect(result.targetFacets).toHaveLength(3);
	});

	it("returns exactly 3 target facets", () => {
		const evidence: EvidenceInput[] = [
			makeEvidence("imagination", "work", 2, "strong", "high"),
			makeEvidence("trust", "relationships", 1, "moderate", "medium"),
		];
		const result = analyzeCoverage(evidence);
		expect(result.targetFacets).toHaveLength(3);
	});

	it("handles single evidence item correctly", () => {
		const evidence: EvidenceInput[] = [
			makeEvidence("imagination", "leisure", 1, "moderate", "medium"),
		];
		const result = analyzeCoverage(evidence);

		expect(result.targetFacets).toHaveLength(3);
		expect(STEERABLE_DOMAINS).toContain(result.targetDomain);
		// The domain with evidence (leisure) has one facet with some confidence,
		// but 29 facets at zero. Other domains have all 30 at zero.
		// The domain with evidence actually has the same bottom-3 average (0) as others,
		// but full-domain average is slightly higher than 0, so tiebreak picks another domain
	});

	it("tiebreak: two domains with same bottom-3 average, full-domain average breaks tie", () => {
		// Give "work" a single moderate piece of evidence on one facet
		// Give "relationships" a single moderate piece of evidence on one facet
		// Both have bottom-3 avg = 0 (29 facets at 0), but full avg differs slightly
		// based on which facet has evidence — but actually both have 1/30 facets covered,
		// so full avg is nearly identical. The STEERABLE_DOMAINS order breaks it.
		const evidence: EvidenceInput[] = [
			makeEvidence("imagination", "work", 2, "strong", "high"),
			makeEvidence("trust", "relationships", 2, "strong", "high"),
		];
		const result = analyzeCoverage(evidence);

		// Domain should be one of the domains WITHOUT any evidence, since those have 0 for everything
		// work and relationships each have 1 facet with confidence > 0, so full avg > 0
		// Other domains have all facets at 0, bottom-3 avg = 0, full avg = 0
		// All zero-evidence domains tie on both metrics, so STEERABLE_DOMAINS order breaks it
		const domainsWithEvidence = new Set(["work", "relationships"]);
		// Target should be a domain without evidence (or the first steerable without evidence)
		expect(domainsWithEvidence.has(result.targetDomain)).toBe(false);
	});

	it("uniform evidence across all domains produces deterministic result", () => {
		// Give the same evidence for one facet in each steerable domain
		const evidence: EvidenceInput[] = STEERABLE_DOMAINS.map((domain) =>
			makeEvidence("imagination", domain as LifeDomain, 2, "moderate", "medium"),
		);
		const result = analyzeCoverage(evidence);

		expect(result.targetFacets).toHaveLength(3);
		expect(STEERABLE_DOMAINS).toContain(result.targetDomain);
		// All domains have same confidence for imagination, 0 for all others
		// Bottom-3 is 0 for all domains — tied
		// Full average is the same for all — tied
		// Falls back to STEERABLE_DOMAINS order
		expect(result.targetDomain).toBe(STEERABLE_DOMAINS[0]);
	});

	it("all target facets are unique", () => {
		const evidence: EvidenceInput[] = [makeEvidence("imagination", "work", 2, "strong", "high")];
		const result = analyzeCoverage(evidence);
		const unique = new Set(result.targetFacets);
		expect(unique.size).toBe(3);
	});

	it("never returns 'other' as target domain", () => {
		// Even with evidence in all steerable domains but none in 'other'
		const evidence: EvidenceInput[] = STEERABLE_DOMAINS.flatMap((domain) =>
			ALL_FACETS.map((facet) => makeEvidence(facet, domain as LifeDomain, 2, "strong", "high")),
		);
		const result = analyzeCoverage(evidence);
		expect(result.targetDomain).not.toBe("other");
	});
});

// ─── enrichWithDefinitions tests ────────────────────────────────────

describe("enrichWithDefinitions", () => {
	it("pairs facet definitions from FACET_PROMPT_DEFINITIONS", () => {
		const target: CoverageTarget = {
			targetFacets: ["imagination", "trust", "anxiety"],
			targetDomain: "work",
		};
		const enriched = enrichWithDefinitions(target);

		expect(enriched.targetFacets).toHaveLength(3);
		for (const { facet, definition } of enriched.targetFacets) {
			expect(definition).toBe(FACET_PROMPT_DEFINITIONS[facet]);
			expect(definition.length).toBeGreaterThan(0);
		}
	});

	it("pairs domain definition from LIFE_DOMAIN_DEFINITIONS", () => {
		const target: CoverageTarget = {
			targetFacets: ["imagination", "trust", "anxiety"],
			targetDomain: "health",
		};
		const enriched = enrichWithDefinitions(target);

		expect(enriched.targetDomain.domain).toBe("health");
		expect(enriched.targetDomain.definition).toBe(LIFE_DOMAIN_DEFINITIONS.health);
	});

	it("preserves facet order from input", () => {
		const target: CoverageTarget = {
			targetFacets: ["anxiety", "trust", "imagination"],
			targetDomain: "leisure",
		};
		const enriched = enrichWithDefinitions(target);

		expect(enriched.targetFacets[0]?.facet).toBe("anxiety");
		expect(enriched.targetFacets[1]?.facet).toBe("trust");
		expect(enriched.targetFacets[2]?.facet).toBe("imagination");
	});
});
