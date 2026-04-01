import { describe, expect, it } from "@effect/vitest";
import type { ExtractedEvidence } from "../../types/evidence";
import { adaptExtractedEvidence } from "../adapt-extracted-evidence";

describe("adaptExtractedEvidence", () => {
	const baseEvidence: ExtractedEvidence = {
		bigfiveFacet: "orderliness",
		polarity: "high",
		strength: "strong",
		confidence: "high",
		domain: "work",
		note: "Very organized workspace",
	};

	it("converts high+strong to deviation +3", () => {
		const result = adaptExtractedEvidence(baseEvidence);
		expect(result.deviation).toBe(3);
		expect(result.bigfiveFacet).toBe("orderliness");
		expect(result.strength).toBe("strong");
		expect(result.confidence).toBe("high");
		expect(result.domain).toBe("work");
		expect(result.note).toBe("Very organized workspace");
	});

	it("converts high+moderate to deviation +2", () => {
		const result = adaptExtractedEvidence({
			...baseEvidence,
			strength: "moderate",
		});
		expect(result.deviation).toBe(2);
	});

	it("converts high+weak to deviation +1", () => {
		const result = adaptExtractedEvidence({
			...baseEvidence,
			strength: "weak",
		});
		expect(result.deviation).toBe(1);
	});

	it("converts low+strong to deviation -3", () => {
		const result = adaptExtractedEvidence({
			...baseEvidence,
			polarity: "low",
			strength: "strong",
		});
		expect(result.deviation).toBe(-3);
	});

	it("converts low+moderate to deviation -2", () => {
		const result = adaptExtractedEvidence({
			...baseEvidence,
			polarity: "low",
			strength: "moderate",
		});
		expect(result.deviation).toBe(-2);
	});

	it("converts low+weak to deviation -1", () => {
		const result = adaptExtractedEvidence({
			...baseEvidence,
			polarity: "low",
			strength: "weak",
		});
		expect(result.deviation).toBe(-1);
	});

	it("preserves all non-deviation fields", () => {
		const input: ExtractedEvidence = {
			bigfiveFacet: "anxiety",
			polarity: "low",
			strength: "moderate",
			confidence: "medium",
			domain: "health",
			note: "Handles stress calmly",
		};
		const result = adaptExtractedEvidence(input);
		expect(result).toEqual({
			bigfiveFacet: "anxiety",
			deviation: -2,
			strength: "moderate",
			confidence: "medium",
			domain: "health",
			note: "Handles stress calmly",
		});
	});
});
