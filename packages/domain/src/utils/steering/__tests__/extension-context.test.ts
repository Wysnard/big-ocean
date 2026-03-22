/**
 * Extension Context Builder Tests — Story 36-2
 *
 * Verifies that buildExtensionContext produces a prompt summary
 * referencing themes and patterns without user quotes.
 */

import { describe, expect, it } from "vitest";
import type { FacetName } from "../../../constants/big-five";
import type { LifeDomain } from "../../../constants/life-domain";
import {
	buildExtensionContext,
	type ExtensionEvidenceRecord,
	type ExtensionExchangeRecord,
} from "../extension-context";

// ─── Helpers ────────────────────────────────────────────────────────

function makeEvidence(facet: FacetName, domain: LifeDomain = "work"): ExtensionEvidenceRecord {
	return {
		bigfiveFacet: facet,
		domain,
		deviation: 2,
		strength: "strong",
		confidence: "high",
	};
}

function makeExchange(territory: string | null, turnNumber: number): ExtensionExchangeRecord {
	return { selectedTerritory: territory, turnNumber };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("buildExtensionContext", () => {
	it("returns empty summary when no evidence or exchanges", () => {
		const result = buildExtensionContext([], []);

		expect(result.summary).toBe("");
		expect(result.visitedTerritoryNames).toEqual([]);
		expect(result.dominantFacets).toEqual([]);
	});

	it("includes visited territory names from exchange records", () => {
		const exchanges = [
			makeExchange("daily-routines", 1),
			makeExchange("creative-pursuits", 2),
			makeExchange("daily-routines", 3), // duplicate — should not repeat
		];

		const result = buildExtensionContext([], exchanges);

		expect(result.visitedTerritoryNames).toContain("Daily Routines");
		expect(result.visitedTerritoryNames).toContain("Creative Pursuits");
		expect(result.visitedTerritoryNames.length).toBe(2);
		expect(result.summary).toContain("Daily Routines");
		expect(result.summary).toContain("Creative Pursuits");
	});

	it("includes dominant facets sorted by evidence count", () => {
		const evidence = [
			makeEvidence("imagination"),
			makeEvidence("imagination"),
			makeEvidence("imagination"),
			makeEvidence("trust"),
			makeEvidence("trust"),
			makeEvidence("orderliness"),
		];

		const result = buildExtensionContext(evidence, []);

		expect(result.dominantFacets[0]).toBe("imagination");
		expect(result.dominantFacets[1]).toBe("trust");
		expect(result.dominantFacets[2]).toBe("orderliness");
	});

	it("limits dominant facets to top 5", () => {
		const facets: FacetName[] = [
			"imagination",
			"trust",
			"orderliness",
			"assertiveness",
			"altruism",
			"anxiety",
			"cheerfulness",
		];
		const evidence = facets.map((f) => makeEvidence(f));

		const result = buildExtensionContext(evidence, []);

		expect(result.dominantFacets.length).toBeLessThanOrEqual(5);
	});

	it("includes CONTINUATION CONTEXT header in summary", () => {
		const evidence = [makeEvidence("imagination")];
		const exchanges = [makeExchange("daily-routines", 1)];

		const result = buildExtensionContext(evidence, exchanges);

		expect(result.summary).toContain("CONTINUATION CONTEXT:");
		expect(result.summary).toContain("continuation of a prior conversation");
	});

	it("summary does NOT contain user quotes or exchange references", () => {
		const evidence = [makeEvidence("imagination")];
		const exchanges = [makeExchange("daily-routines", 1)];

		const result = buildExtensionContext(evidence, exchanges);

		// Should not contain any user quotes or turn numbers
		expect(result.summary).not.toMatch(/".*said.*"/);
		expect(result.summary).not.toMatch(/turn \d+/i);
		// Should contain instruction to not quote
		expect(result.summary).toContain("do NOT quote");
	});

	it("formats facet names with hyphens instead of underscores", () => {
		const evidence = [makeEvidence("self_discipline")];

		const result = buildExtensionContext(evidence, []);

		expect(result.summary).toContain("self-discipline");
		expect(result.summary).not.toContain("self_discipline");
	});

	it("handles unknown territory IDs gracefully", () => {
		const exchanges = [makeExchange("nonexistent-territory", 1)];

		const result = buildExtensionContext([], exchanges);

		// Unknown territory should not appear in names
		expect(result.visitedTerritoryNames.length).toBe(0);
	});
});
