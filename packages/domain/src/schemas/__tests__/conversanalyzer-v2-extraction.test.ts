/**
 * ConversAnalyzer Extraction Schema Tests
 *
 * Tests for strict and lenient schemas that validate
 * evidence extraction output.
 *
 * User-state schema tests removed in Story 43-6 (Director reads energy/telling natively).
 *
 * Story 24-1, Story 42-2, Story 42-3 (polarity-based evidence), Story 43-6
 */

import { describe, expect, it } from "vitest";
import {
	decodeEvidenceLenient,
	decodeEvidenceStrict,
	evidenceOnlyJsonSchema,
} from "../conversanalyzer-v2-extraction";

// ─── Valid test data ─────────────────────────────────────────────────────────

/** v3 polarity-based evidence (LLM outputs polarity, not deviation) */
const validPolarityEvidence = [
	{
		reasoning: "User describes inventing scenarios and imagining alternatives at work",
		bigfiveFacet: "imagination",
		polarity: "high",
		strength: "strong",
		confidence: "high",
		domain: "work",
		note: "Creative thinking in professional context",
	},
	{
		reasoning: "User mentions being slow to open up to new people in social settings",
		bigfiveFacet: "trust",
		polarity: "low",
		strength: "moderate",
		confidence: "medium",
		domain: "relationships",
		note: "Slow to extend trust",
	},
];

// ─── Evidence strict schema tests (v3 polarity-based) ────────────────────────

describe("Evidence strict (decodeEvidenceStrict)", () => {
	it("accepts v3 polarity-based evidence and derives deviation", () => {
		const result = decodeEvidenceStrict({ evidence: validPolarityEvidence });
		expect(result.evidence).toHaveLength(2);
		// high+strong → +3
		expect(result.evidence[0].deviation).toBe(3);
		expect(result.evidence[0].polarity).toBe("high");
		// low+moderate → -2
		expect(result.evidence[1].deviation).toBe(-2);
		expect(result.evidence[1].polarity).toBe("low");
	});

	it("rejects evidence without polarity", () => {
		const result = decodeEvidenceStrict({
			evidence: [
				{
					bigfiveFacet: "imagination",
					deviation: 2,
					strength: "strong",
					confidence: "high",
					domain: "work",
					note: "Missing polarity",
				},
			],
		});
		expect(result.evidence).toHaveLength(0);
	});

	it("accepts empty evidence array", () => {
		const result = decodeEvidenceStrict({ evidence: [] });
		expect(result.evidence).toHaveLength(0);
	});

	it("filters out malformed evidence items", () => {
		const result = decodeEvidenceStrict({
			evidence: [{ bigfiveFacet: "not_a_facet", polarity: "high" }],
		});
		expect(result.evidence).toHaveLength(0);
	});

	it("filters invalid items and keeps valid ones", () => {
		const result = decodeEvidenceStrict({
			evidence: [
				validPolarityEvidence[0],
				{
					bigfiveFacet: "hallucinated_facet",
					polarity: "high",
					strength: "strong",
					confidence: "high",
					domain: "work",
					note: "bad",
				},
			],
		});
		expect(result.evidence).toHaveLength(1);
		expect(result.evidence[0].bigfiveFacet).toBe(validPolarityEvidence[0].bigfiveFacet);
	});

	it("derives deviation correctly for all polarity+strength combos", () => {
		const combos = [
			{ polarity: "high", strength: "strong", expected: 3 },
			{ polarity: "high", strength: "moderate", expected: 2 },
			{ polarity: "high", strength: "weak", expected: 1 },
			{ polarity: "low", strength: "strong", expected: -3 },
			{ polarity: "low", strength: "moderate", expected: -2 },
			{ polarity: "low", strength: "weak", expected: -1 },
		] as const;

		for (const combo of combos) {
			const result = decodeEvidenceStrict({
				evidence: [
					{
						reasoning: `Testing ${combo.polarity}+${combo.strength} deviation derivation`,
						bigfiveFacet: "imagination",
						polarity: combo.polarity,
						strength: combo.strength,
						confidence: "high",
						domain: "work",
						note: `${combo.polarity}+${combo.strength}`,
					},
				],
			});
			expect(result.evidence[0].deviation).toBe(combo.expected);
		}
	});
});

// ─── Evidence lenient schema tests ───────────────────────────────────────────

describe("Evidence lenient (decodeEvidenceLenient)", () => {
	it("accepts v3 polarity-based evidence and derives deviation", () => {
		const result = decodeEvidenceLenient({ evidence: validPolarityEvidence });
		expect(result.evidence).toHaveLength(2);
		expect(result.evidence[0].deviation).toBe(3); // high+strong
		expect(result.evidence[1].deviation).toBe(-2); // low+moderate
	});

	it("filters invalid evidence items while keeping valid ones", () => {
		const result = decodeEvidenceLenient({
			evidence: [
				validPolarityEvidence[0],
				{
					bigfiveFacet: "hallucinated_facet",
					polarity: "high",
					strength: "strong",
					confidence: "high",
					domain: "work",
					note: "bad",
				},
				validPolarityEvidence[1],
			],
		});
		expect(result.evidence).toHaveLength(2);
	});

	it("returns empty evidence when all items are invalid", () => {
		const result = decodeEvidenceLenient({
			evidence: [{ bigfiveFacet: "fake1" }, { bigfiveFacet: "fake2" }],
		});
		expect(result.evidence).toHaveLength(0);
	});
});

// ─── JSON Schema generation ─────────────────────────────────────────────────

describe("JSON Schema generation", () => {
	it("evidenceOnlyJsonSchema generates a valid JSON schema", () => {
		expect(evidenceOnlyJsonSchema).toBeDefined();
		expect(evidenceOnlyJsonSchema).toHaveProperty("type", "object");
		expect(evidenceOnlyJsonSchema).toHaveProperty("properties");
	});

	it("evidenceOnlyJsonSchema includes polarity field (not deviation)", () => {
		const schema = evidenceOnlyJsonSchema as Record<string, unknown>;
		const props = schema.properties as Record<string, unknown>;
		const evidenceSchema = props.evidence as Record<string, unknown>;
		const itemSchema = evidenceSchema.items as Record<string, unknown>;
		const itemProps = itemSchema.properties as Record<string, unknown>;

		expect(itemProps).toHaveProperty("polarity");
		expect(itemProps).not.toHaveProperty("deviation");
	});
});
