import { describe, expect, it } from "vitest";
import type { EvidenceInput } from "../../types/evidence";
import { aggregateDomainDistribution } from "../domain-distribution";

describe("aggregateDomainDistribution", () => {
	it("returns all zeros for empty input", () => {
		const result = aggregateDomainDistribution([]);
		expect(result).toEqual({
			work: 0,
			relationships: 0,
			family: 0,
			leisure: 0,
			solo: 0,
			other: 0,
		});
	});

	it("counts single domain correctly", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 15, confidence: 0.8, domain: "work" },
			{ bigfiveFacet: "orderliness", score: 10, confidence: 0.6, domain: "work" },
		];
		const result = aggregateDomainDistribution(evidence);
		expect(result.work).toBe(2);
		expect(result.relationships).toBe(0);
		expect(result.family).toBe(0);
		expect(result.leisure).toBe(0);
		expect(result.solo).toBe(0);
		expect(result.other).toBe(0);
	});

	it("counts multiple domains correctly", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "imagination", score: 15, confidence: 0.8, domain: "work" },
			{ bigfiveFacet: "trust", score: 12, confidence: 0.7, domain: "relationships" },
			{ bigfiveFacet: "cheerfulness", score: 18, confidence: 0.9, domain: "leisure" },
			{ bigfiveFacet: "orderliness", score: 10, confidence: 0.6, domain: "work" },
		];
		const result = aggregateDomainDistribution(evidence);
		expect(result.work).toBe(2);
		expect(result.relationships).toBe(1);
		expect(result.leisure).toBe(1);
		expect(result.family).toBe(0);
		expect(result.solo).toBe(0);
		expect(result.other).toBe(0);
	});

	it("always returns all 6 domain keys", () => {
		const evidence: EvidenceInput[] = [
			{ bigfiveFacet: "anxiety", score: 5, confidence: 0.3, domain: "solo" },
		];
		const result = aggregateDomainDistribution(evidence);
		const keys = Object.keys(result).sort();
		expect(keys).toEqual(["family", "leisure", "other", "relationships", "solo", "work"]);
	});
});
