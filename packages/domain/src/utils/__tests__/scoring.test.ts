import { describe, expect, it } from "vitest";
import { ALL_FACETS, TRAIT_TO_FACETS } from "../../constants/big-five";
import type { FacetName, SavedFacetEvidence, TraitName } from "../../types/facet-evidence";
import { DEFAULT_FACET_SCORE, DEFAULT_TRAIT_SCORE } from "../confidence";
import { aggregateFacetScores, deriveTraitScores } from "../scoring";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let evidenceIdCounter = 0;

/**
 * Creates a SavedFacetEvidence record for testing.
 */
function createEvidence(
	facetName: FacetName,
	score: number,
	confidence: number,
	createdAt: Date = new Date(),
): SavedFacetEvidence {
	evidenceIdCounter++;
	return {
		id: `evidence_${evidenceIdCounter}`,
		assessmentMessageId: "msg_test",
		facetName,
		score,
		confidence,
		quote: "test quote",
		highlightRange: { start: 0, end: 10 },
		createdAt,
	};
}

/**
 * Creates multiple evidence records for a facet with sequential timestamps.
 */
function createEvidenceSequence(
	facetName: FacetName,
	entries: Array<{ score: number; confidence: number }>,
): SavedFacetEvidence[] {
	const baseTime = new Date("2026-01-01T00:00:00Z").getTime();
	return entries.map((entry, idx) =>
		createEvidence(facetName, entry.score, entry.confidence, new Date(baseTime + idx * 60000)),
	);
}

// ---------------------------------------------------------------------------
// aggregateFacetScores tests
// ---------------------------------------------------------------------------

describe("aggregateFacetScores", () => {
	describe("empty evidence", () => {
		it("returns all 30 facets with default scores when no evidence provided", () => {
			const result = aggregateFacetScores([]);

			expect(Object.keys(result)).toHaveLength(30);
			for (const facet of ALL_FACETS) {
				expect(result[facet]).toEqual(DEFAULT_FACET_SCORE);
			}
		});
	});

	describe("single facet evidence", () => {
		it("returns the evidence score for a single record", () => {
			const evidence = [createEvidence("imagination", 16, 80)];
			const result = aggregateFacetScores(evidence);

			expect(result.imagination.score).toBe(16);
			expect(result.imagination.confidence).toBe(80);
		});

		it("returns defaults for facets without evidence", () => {
			const evidence = [createEvidence("imagination", 16, 80)];
			const result = aggregateFacetScores(evidence);

			expect(result.altruism).toEqual(DEFAULT_FACET_SCORE);
		});
	});

	describe("recency weighting", () => {
		it("weights more recent evidence higher", () => {
			// Two records: older has score 10, newer has score 20
			// With recency weighting, result should be closer to 20 than simple average of 15
			const evidence = createEvidenceSequence("imagination", [
				{ score: 10, confidence: 80 },
				{ score: 20, confidence: 80 },
			]);

			const result = aggregateFacetScores(evidence);

			// Weighted average: (10 * 0.8 * 1.0 + 20 * 0.8 * 1.1) / (0.8 * 1.0 + 0.8 * 1.1)
			// = (8 + 17.6) / (0.8 + 0.88) = 25.6 / 1.68 ≈ 15.24
			expect(result.imagination.score).toBeGreaterThan(14);
			expect(result.imagination.score).toBeLessThan(17);
		});
	});

	describe("variance and contradiction detection", () => {
		it("penalizes confidence for high variance scores", () => {
			// Highly contradictory scores: 0 and 20 (variance = 100)
			const evidence = createEvidenceSequence("imagination", [
				{ score: 0, confidence: 80 },
				{ score: 20, confidence: 80 },
			]);

			const result = aggregateFacetScores(evidence);

			// High variance should reduce confidence by 30 points
			// Average confidence: 80, adjusted: 80 - 30 = 50
			expect(result.imagination.confidence).toBe(50);
		});

		it("does not penalize confidence for consistent scores", () => {
			// Consistent scores: 15 and 16 (variance < 15)
			const evidence = createEvidenceSequence("imagination", [
				{ score: 15, confidence: 80 },
				{ score: 16, confidence: 80 },
			]);

			const result = aggregateFacetScores(evidence);

			// No variance penalty, confidence stays at average
			expect(result.imagination.confidence).toBe(80);
		});

		it("clamps confidence to 0 when penalty exceeds average", () => {
			// Low confidence + high variance
			const evidence = createEvidenceSequence("imagination", [
				{ score: 0, confidence: 20 },
				{ score: 20, confidence: 20 },
			]);

			const result = aggregateFacetScores(evidence);

			// Average confidence: 20, adjusted: 20 - 30 = -10, clamped to 0
			expect(result.imagination.confidence).toBe(0);
		});
	});

	describe("multiple facets", () => {
		it("aggregates evidence independently for different facets", () => {
			const evidence = [createEvidence("imagination", 18, 90), createEvidence("altruism", 5, 70)];

			const result = aggregateFacetScores(evidence);

			expect(result.imagination.score).toBe(18);
			expect(result.imagination.confidence).toBe(90);
			expect(result.altruism.score).toBe(5);
			expect(result.altruism.confidence).toBe(70);
		});
	});

	describe("complete map", () => {
		it("always returns all 30 facets", () => {
			const evidence = [createEvidence("imagination", 15, 80)];
			const result = aggregateFacetScores(evidence);

			for (const facet of ALL_FACETS) {
				expect(result[facet]).toBeDefined();
				expect(typeof result[facet].score).toBe("number");
				expect(typeof result[facet].confidence).toBe("number");
			}
		});

		it("scores are in valid range 0-20", () => {
			const evidence = ALL_FACETS.map((facet) => createEvidence(facet, 15, 80));
			const result = aggregateFacetScores(evidence);

			for (const facet of ALL_FACETS) {
				expect(result[facet].score).toBeGreaterThanOrEqual(0);
				expect(result[facet].score).toBeLessThanOrEqual(20);
			}
		});

		it("confidences are in valid range 0-100", () => {
			const evidence = ALL_FACETS.map((facet) => createEvidence(facet, 15, 80));
			const result = aggregateFacetScores(evidence);

			for (const facet of ALL_FACETS) {
				expect(result[facet].confidence).toBeGreaterThanOrEqual(0);
				expect(result[facet].confidence).toBeLessThanOrEqual(100);
			}
		});
	});

	describe("determinism", () => {
		it("same input always produces same output", () => {
			const evidence = createEvidenceSequence("imagination", [
				{ score: 12, confidence: 75 },
				{ score: 18, confidence: 90 },
				{ score: 14, confidence: 60 },
			]);

			const results = Array.from({ length: 10 }, () => aggregateFacetScores(evidence));

			for (let i = 1; i < results.length; i++) {
				expect(results[i].imagination.score).toBe(results[0].imagination.score);
				expect(results[i].imagination.confidence).toBe(results[0].imagination.confidence);
			}
		});
	});
});

// ---------------------------------------------------------------------------
// deriveTraitScores tests
// ---------------------------------------------------------------------------

describe("deriveTraitScores", () => {
	describe("default scores", () => {
		it("returns all 5 traits with defaults when given default facet scores", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { ...DEFAULT_FACET_SCORE };
			}

			const result = deriveTraitScores(facetScores);

			expect(Object.keys(result)).toHaveLength(5);
			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				// Default: 6 facets * 10 = 60
				expect(result[trait]).toEqual(DEFAULT_TRAIT_SCORE);
			}
		});
	});

	describe("sum calculation", () => {
		it("trait score is sum of 6 facet scores (0-120 scale)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 80 };
			}

			// Set openness facets to 15 each → sum = 90
			for (const facet of TRAIT_TO_FACETS.openness) {
				facetScores[facet] = { score: 15, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			expect(result.openness.score).toBe(90);
		});

		it("handles maximum trait score (120 = 6 * 20)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 20, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].score).toBe(120);
			}
		});

		it("handles minimum trait score (0 = 6 * 0)", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 0, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].score).toBe(0);
			}
		});
	});

	describe("confidence calculation", () => {
		it("trait confidence is minimum of its 6 facet confidences", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 90 };
			}

			// Set one openness facet to low confidence
			facetScores.imagination = { score: 10, confidence: 30 };

			const result = deriveTraitScores(facetScores);

			expect(result.openness.confidence).toBe(30);
			// Other traits unaffected
			expect(result.conscientiousness.confidence).toBe(90);
		});

		it("handles zero confidence", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 0 };
			}

			const result = deriveTraitScores(facetScores);

			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].confidence).toBe(0);
			}
		});
	});

	describe("trait-facet mapping", () => {
		it("each trait uses exactly its 6 facets", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			// Set all to neutral
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10, confidence: 50 };
			}

			// Set openness facets to 15
			for (const facet of TRAIT_TO_FACETS.openness) {
				facetScores[facet] = { score: 15, confidence: 50 };
			}

			const result = deriveTraitScores(facetScores);

			// Openness should be 90 (6 * 15), others should be 60 (6 * 10)
			expect(result.openness.score).toBe(90);
			expect(result.conscientiousness.score).toBe(60);
			expect(result.extraversion.score).toBe(60);
			expect(result.agreeableness.score).toBe(60);
			expect(result.neuroticism.score).toBe(60);
		});
	});

	describe("rounding", () => {
		it("rounds trait scores to 1 decimal place", () => {
			const facetScores = {} as Record<FacetName, { score: number; confidence: number }>;
			for (const facet of ALL_FACETS) {
				facetScores[facet] = { score: 10.15, confidence: 80 };
			}

			const result = deriveTraitScores(facetScores);

			// 6 * 10.15 = 60.9
			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(result[trait].score).toBe(60.9);
			}
		});
	});

	describe("integration with aggregateFacetScores", () => {
		it("aggregated facet scores can be passed directly to deriveTraitScores", () => {
			// Create evidence for a few facets
			const evidence: SavedFacetEvidence[] = [
				createEvidence("imagination", 18, 90),
				createEvidence("artistic_interests", 15, 85),
				createEvidence("altruism", 12, 70),
			];

			const facetScores = aggregateFacetScores(evidence);
			const traitScores = deriveTraitScores(facetScores);

			expect(Object.keys(traitScores)).toHaveLength(5);
			for (const trait of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
				expect(traitScores[trait].score).toBeGreaterThanOrEqual(0);
				expect(traitScores[trait].score).toBeLessThanOrEqual(120);
				expect(traitScores[trait].confidence).toBeGreaterThanOrEqual(0);
				expect(traitScores[trait].confidence).toBeLessThanOrEqual(100);
			}
		});
	});
});
