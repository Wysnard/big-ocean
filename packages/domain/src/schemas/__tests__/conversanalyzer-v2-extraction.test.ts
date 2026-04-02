/**
 * ConversAnalyzer Extraction Schema Tests
 *
 * Tests for strict and lenient schemas that validate
 * split extraction output (user state + evidence independently).
 *
 * Story 24-1, Story 42-2
 */

import { describe, expect, it } from "vitest";
import {
	decodeEvidenceLenient,
	decodeEvidenceStrict,
	decodeUserStateLenient,
	decodeUserStateStrict,
	evidenceOnlyJsonSchema,
	userStateOnlyJsonSchema,
} from "../conversanalyzer-v2-extraction";

// ─── Valid test data ─────────────────────────────────────────────────────────

const validUserState = {
	energyBand: "steady",
	tellingBand: "mixed",
	energyReason: "User is engaged but measured",
	tellingReason: "Following prompts with some self-direction",
	withinMessageShift: false,
};

const validEvidence = [
	{
		bigfiveFacet: "imagination",
		deviation: 2,
		strength: "strong",
		confidence: "high",
		domain: "work",
		note: "Creative thinking in professional context",
	},
	{
		bigfiveFacet: "trust",
		deviation: -1,
		strength: "moderate",
		confidence: "medium",
		domain: "relationships",
		note: "Slow to extend trust",
	},
];

// ─── UserState strict schema tests ───────────────────────────────────────────

describe("UserState strict (decodeUserStateStrict)", () => {
	it("accepts valid user state", () => {
		const result = decodeUserStateStrict(validUserState);
		expect(result.energyBand).toBe("steady");
		expect(result.tellingBand).toBe("mixed");
		expect(result.energyReason).toBe("User is engaged but measured");
		expect(result.withinMessageShift).toBe(false);
	});

	it("accepts all energy band values", () => {
		for (const band of ["minimal", "low", "steady", "high", "very_high"]) {
			const result = decodeUserStateStrict({ ...validUserState, energyBand: band });
			expect(result.energyBand).toBe(band);
		}
	});

	it("accepts all telling band values", () => {
		for (const band of [
			"fully_compliant",
			"mostly_compliant",
			"mixed",
			"mostly_self_propelled",
			"strongly_self_propelled",
		]) {
			const result = decodeUserStateStrict({ ...validUserState, tellingBand: band });
			expect(result.tellingBand).toBe(band);
		}
	});

	it("rejects invalid energyBand", () => {
		expect(() => decodeUserStateStrict({ ...validUserState, energyBand: "super_high" })).toThrow();
	});

	it("rejects invalid tellingBand", () => {
		expect(() => decodeUserStateStrict({ ...validUserState, tellingBand: "unknown" })).toThrow();
	});

	it("rejects energyReason exceeding 500 chars", () => {
		expect(() =>
			decodeUserStateStrict({ ...validUserState, energyReason: "x".repeat(501) }),
		).toThrow();
	});
});

// ─── UserState lenient schema tests ──────────────────────────────────────────

describe("UserState lenient (decodeUserStateLenient)", () => {
	it("accepts valid user state unchanged", () => {
		const result = decodeUserStateLenient(validUserState);
		expect(result.energyBand).toBe("steady");
		expect(result.tellingBand).toBe("mixed");
	});

	it("defaults energyBand when invalid", () => {
		const result = decodeUserStateLenient({ ...validUserState, energyBand: "invalid_band" });
		expect(result.energyBand).toBe("steady");
		expect(result.tellingBand).toBe("mixed"); // preserved
	});

	it("defaults tellingBand when invalid", () => {
		const result = decodeUserStateLenient({ ...validUserState, tellingBand: "bad_value" });
		expect(result.tellingBand).toBe("mixed");
		expect(result.energyBand).toBe("steady"); // preserved
	});

	it("defaults all fields when input is null", () => {
		const result = decodeUserStateLenient(null);
		expect(result.energyBand).toBe("steady");
		expect(result.tellingBand).toBe("mixed");
		expect(result.energyReason).toBe("");
		expect(result.tellingReason).toBe("");
		expect(result.withinMessageShift).toBe(false);
	});

	it("defaults all fields when input is completely invalid", () => {
		const result = decodeUserStateLenient("not an object");
		expect(result.energyBand).toBe("steady");
		expect(result.tellingBand).toBe("mixed");
	});
});

// ─── Evidence strict schema tests ────────────────────────────────────────────

describe("Evidence strict (decodeEvidenceStrict)", () => {
	it("accepts valid evidence", () => {
		const result = decodeEvidenceStrict({ evidence: validEvidence });
		expect(result.evidence).toHaveLength(2);
	});

	it("accepts empty evidence array", () => {
		const result = decodeEvidenceStrict({ evidence: [] });
		expect(result.evidence).toHaveLength(0);
	});

	it("filters out malformed evidence items", () => {
		const result = decodeEvidenceStrict({
			evidence: [{ bigfiveFacet: "not_a_facet", deviation: 1 }],
		});
		expect(result.evidence).toHaveLength(0);
	});

	it("filters invalid items and keeps valid ones", () => {
		const result = decodeEvidenceStrict({
			evidence: [
				validEvidence[0],
				{
					bigfiveFacet: "hallucinated_facet",
					deviation: 1,
					strength: "strong",
					confidence: "high",
					domain: "work",
					note: "bad",
				},
			],
		});
		expect(result.evidence).toHaveLength(1);
		expect(result.evidence[0].bigfiveFacet).toBe(validEvidence[0].bigfiveFacet);
	});
});

// ─── Evidence lenient schema tests ───────────────────────────────────────────

describe("Evidence lenient (decodeEvidenceLenient)", () => {
	it("accepts valid evidence unchanged", () => {
		const result = decodeEvidenceLenient({ evidence: validEvidence });
		expect(result.evidence).toHaveLength(2);
	});

	it("filters invalid evidence items while keeping valid ones", () => {
		const result = decodeEvidenceLenient({
			evidence: [
				validEvidence[0],
				{
					bigfiveFacet: "hallucinated_facet",
					deviation: 1,
					strength: "strong",
					confidence: "high",
					domain: "work",
					note: "bad",
				},
				validEvidence[1],
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
	it("userStateOnlyJsonSchema generates a valid JSON schema", () => {
		expect(userStateOnlyJsonSchema).toBeDefined();
		expect(userStateOnlyJsonSchema).toHaveProperty("type", "object");
		expect(userStateOnlyJsonSchema).toHaveProperty("properties");
	});

	it("evidenceOnlyJsonSchema generates a valid JSON schema", () => {
		expect(evidenceOnlyJsonSchema).toBeDefined();
		expect(evidenceOnlyJsonSchema).toHaveProperty("type", "object");
		expect(evidenceOnlyJsonSchema).toHaveProperty("properties");
	});
});
