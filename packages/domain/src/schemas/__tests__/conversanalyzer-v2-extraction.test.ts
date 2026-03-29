/**
 * ConversAnalyzer v2 Extraction Schema Tests
 *
 * Tests for strict and lenient v2 schemas that validate
 * dual extraction output (userState + evidence).
 *
 * Story 24-1
 */

import { describe, expect, it } from "vitest";
import {
	conversanalyzerV2JsonSchema,
	decodeConversanalyzerV2Lenient,
	decodeConversanalyzerV2Strict,
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

const validV2Output = {
	userState: validUserState,
	evidence: validEvidence,
};

// ─── Strict schema tests ─────────────────────────────────────────────────────

describe("ConversanalyzerV2ToolOutput (strict)", () => {
	it("accepts valid v2 output", () => {
		const result = decodeConversanalyzerV2Strict(validV2Output);
		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.energyReason).toBe("User is engaged but measured");
		expect(result.userState.withinMessageShift).toBe(false);
		expect(result.evidence).toHaveLength(2);
	});

	it("accepts valid output with empty evidence array", () => {
		const result = decodeConversanalyzerV2Strict({
			userState: validUserState,
			evidence: [],
		});
		expect(result.evidence).toHaveLength(0);
		expect(result.userState.energyBand).toBe("steady");
	});

	it("accepts all energy band values", () => {
		for (const band of ["minimal", "low", "steady", "high", "very_high"]) {
			const result = decodeConversanalyzerV2Strict({
				userState: { ...validUserState, energyBand: band },
				evidence: [],
			});
			expect(result.userState.energyBand).toBe(band);
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
			const result = decodeConversanalyzerV2Strict({
				userState: { ...validUserState, tellingBand: band },
				evidence: [],
			});
			expect(result.userState.tellingBand).toBe(band);
		}
	});

	it("rejects invalid energyBand values", () => {
		expect(() =>
			decodeConversanalyzerV2Strict({
				userState: { ...validUserState, energyBand: "super_high" },
				evidence: [],
			}),
		).toThrow();
	});

	it("rejects invalid tellingBand values", () => {
		expect(() =>
			decodeConversanalyzerV2Strict({
				userState: { ...validUserState, tellingBand: "unknown" },
				evidence: [],
			}),
		).toThrow();
	});

	it("rejects energyReason exceeding 200 chars", () => {
		expect(() =>
			decodeConversanalyzerV2Strict({
				userState: { ...validUserState, energyReason: "x".repeat(501) },
				evidence: [],
			}),
		).toThrow();
	});

	it("filters out malformed evidence items", () => {
		const result = decodeConversanalyzerV2Strict({
			userState: validUserState,
			evidence: [{ bigfiveFacet: "not_a_facet", deviation: 1 }],
		});
		expect(result.evidence).toHaveLength(0);
	});

	it("filters invalid evidence items and keeps valid ones", () => {
		const result = decodeConversanalyzerV2Strict({
			userState: validUserState,
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

	it("rejects missing userState", () => {
		expect(() =>
			decodeConversanalyzerV2Strict({
				evidence: validEvidence,
			}),
		).toThrow();
	});

	it("rejects missing evidence", () => {
		expect(() =>
			decodeConversanalyzerV2Strict({
				userState: validUserState,
			}),
		).toThrow();
	});
});

// ─── Lenient schema tests ────────────────────────────────────────────────────

describe("LenientConversanalyzerV2ToolOutput (lenient)", () => {
	it("accepts valid v2 output unchanged", () => {
		const result = decodeConversanalyzerV2Lenient(validV2Output);
		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.evidence).toHaveLength(2);
	});

	it("preserves valid userState fields when energyBand is invalid", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: { ...validUserState, energyBand: "invalid_band" },
			evidence: [],
		});
		// energyBand defaults to "steady"
		expect(result.userState.energyBand).toBe("steady");
		// Other fields preserved
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.energyReason).toBe("User is engaged but measured");
		expect(result.userState.withinMessageShift).toBe(false);
	});

	it("preserves valid userState fields when tellingBand is invalid", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: { ...validUserState, tellingBand: "bad_value" },
			evidence: [],
		});
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.energyBand).toBe("steady");
	});

	it("defaults all userState fields when userState is null", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: null,
			evidence: [],
		});
		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.energyReason).toBe("");
		expect(result.userState.tellingReason).toBe("");
		expect(result.userState.withinMessageShift).toBe(false);
	});

	it("defaults all userState fields when userState is completely invalid", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: "not an object",
			evidence: validEvidence,
		});
		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.energyReason).toBe("");
		expect(result.userState.tellingReason).toBe("");
		expect(result.userState.withinMessageShift).toBe(false);
		// Evidence still preserved
		expect(result.evidence).toHaveLength(2);
	});

	it("filters invalid evidence items while keeping valid ones", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: validUserState,
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
		expect(result.evidence[0]?.bigfiveFacet).toBe("imagination");
		expect(result.evidence[1]?.bigfiveFacet).toBe("trust");
	});

	it("returns empty evidence when all items are invalid", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: validUserState,
			evidence: [{ bigfiveFacet: "fake1" }, { bigfiveFacet: "fake2" }],
		});
		expect(result.evidence).toHaveLength(0);
	});

	it("handles complete failure with all defaults", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: {
				energyBand: "invalid",
				tellingBand: 42,
				energyReason: 123,
				withinMessageShift: "nope",
			},
			evidence: [{ bad: "data" }],
		});
		expect(result.userState.energyBand).toBe("steady");
		expect(result.userState.tellingBand).toBe("mixed");
		expect(result.userState.energyReason).toBe("");
		expect(result.userState.tellingReason).toBe("");
		expect(result.userState.withinMessageShift).toBe(false);
		expect(result.evidence).toHaveLength(0);
	});

	it("preserves valid energyReason when tellingReason exceeds max length", () => {
		const result = decodeConversanalyzerV2Lenient({
			userState: { ...validUserState, tellingReason: "x".repeat(501) },
			evidence: [],
		});
		expect(result.userState.energyReason).toBe("User is engaged but measured");
		expect(result.userState.tellingReason).toBe(""); // defaulted
	});
});

// ─── JSON Schema generation ─────────────────────────────────────────────────

describe("conversanalyzerV2JsonSchema", () => {
	it("generates a valid JSON schema object", () => {
		expect(conversanalyzerV2JsonSchema).toBeDefined();
		expect(conversanalyzerV2JsonSchema).toHaveProperty("type", "object");
		expect(conversanalyzerV2JsonSchema).toHaveProperty("properties");
	});

	it("includes userState and evidence properties", () => {
		const props = (conversanalyzerV2JsonSchema as Record<string, unknown>).properties as Record<
			string,
			unknown
		>;
		expect(props).toHaveProperty("userState");
		expect(props).toHaveProperty("evidence");
	});
});
