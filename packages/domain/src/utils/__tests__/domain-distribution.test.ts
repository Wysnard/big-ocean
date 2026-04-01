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
			health: 0,
			other: 0,
		});
	});

	it("counts single domain correctly", () => {
		const evidence: EvidenceInput[] = [
			{
				bigfiveFacet: "imagination",
				deviation: 2,
				strength: "strong",
				confidence: "medium",
				domain: "work",
			},
			{
				bigfiveFacet: "orderliness",
				deviation: 0,
				strength: "moderate",
				confidence: "medium",
				domain: "work",
			},
		];
		const result = aggregateDomainDistribution(evidence);
		expect(result.work).toBe(2);
		expect(result.relationships).toBe(0);
		expect(result.family).toBe(0);
		expect(result.leisure).toBe(0);
		expect(result.health).toBe(0);
		expect(result.other).toBe(0);
	});

	it("counts multiple domains correctly", () => {
		const evidence: EvidenceInput[] = [
			{
				bigfiveFacet: "imagination",
				deviation: 2,
				strength: "strong",
				confidence: "medium",
				domain: "work",
			},
			{
				bigfiveFacet: "trust",
				deviation: 1,
				strength: "moderate",
				confidence: "high",
				domain: "relationships",
			},
			{
				bigfiveFacet: "cheerfulness",
				deviation: 3,
				strength: "strong",
				confidence: "high",
				domain: "leisure",
			},
			{
				bigfiveFacet: "orderliness",
				deviation: 0,
				strength: "moderate",
				confidence: "medium",
				domain: "work",
			},
		];
		const result = aggregateDomainDistribution(evidence);
		expect(result.work).toBe(2);
		expect(result.relationships).toBe(1);
		expect(result.leisure).toBe(1);
		expect(result.family).toBe(0);
		expect(result.health).toBe(0);
		expect(result.other).toBe(0);
	});

	it("always returns all 6 domain keys", () => {
		const evidence: EvidenceInput[] = [
			{
				bigfiveFacet: "anxiety",
				deviation: -2,
				strength: "weak",
				confidence: "low",
				domain: "health",
			},
		];
		const result = aggregateDomainDistribution(evidence);
		const keys = Object.keys(result).sort();
		expect(keys).toEqual(["family", "health", "leisure", "other", "relationships", "work"]);
	});
});
