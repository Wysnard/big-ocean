import { describe, expect, it } from "vitest";
import { ALL_FACETS } from "../../constants/big-five";
import { DEFAULT_FACET_SCORE } from "../confidence";
import { aggregateFacetScores } from "../scoring";
import { createEvidence, createEvidenceSequence } from "./__fixtures__/scoring.fixtures";

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
		it("returns the evidence score but reduced confidence for a single record", () => {
			const evidence = [createEvidence("imagination", 16, 80)];
			const result = aggregateFacetScores(evidence);

			expect(result.imagination.score).toBe(16);
			// Single evidence at 80% → saturation curve produces ~39, NOT 80
			expect(result.imagination.confidence).toBe(39);
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

	describe("saturation curve confidence", () => {
		it("single evidence produces moderate confidence, not the evidence's own confidence", () => {
			const evidence = [createEvidence("imagination", 16, 90)];
			const result = aggregateFacetScores(evidence);

			// 1 evidence at 90% → E_eff = 0.9 → C = 90 * (1 - e^(-0.63)) ≈ 42
			expect(result.imagination.confidence).toBe(42);
		});

		it("confidence increases monotonically with more evidence", () => {
			const evidence1 = [createEvidence("imagination", 15, 80)];
			const evidence3 = createEvidenceSequence("imagination", [
				{ score: 15, confidence: 80 },
				{ score: 14, confidence: 75 },
				{ score: 16, confidence: 85 },
			]);
			const evidence6 = createEvidenceSequence("imagination", [
				{ score: 15, confidence: 80 },
				{ score: 14, confidence: 75 },
				{ score: 16, confidence: 85 },
				{ score: 15, confidence: 70 },
				{ score: 14, confidence: 80 },
				{ score: 16, confidence: 75 },
			]);

			const r1 = aggregateFacetScores(evidence1);
			const r3 = aggregateFacetScores(evidence3);
			const r6 = aggregateFacetScores(evidence6);

			expect(r3.imagination.confidence).toBeGreaterThan(r1.imagination.confidence);
			expect(r6.imagination.confidence).toBeGreaterThan(r3.imagination.confidence);
		});

		it("confidence never exceeds C_MAX (90)", () => {
			// 20 evidence items at max confidence
			const evidence = createEvidenceSequence(
				"imagination",
				Array.from({ length: 20 }, () => ({ score: 15, confidence: 100 })),
			);
			const result = aggregateFacetScores(evidence);

			expect(result.imagination.confidence).toBeLessThanOrEqual(90);
		});

		it("low individual confidence produces lower facet confidence", () => {
			const highConf = [createEvidence("imagination", 15, 90)];
			const lowConf = [createEvidence("artistic_interests", 15, 30)];

			const result = aggregateFacetScores([...highConf, ...lowConf]);

			expect(result.imagination.confidence).toBeGreaterThan(result.artistic_interests.confidence);
		});

		it("two evidence items produce higher confidence than one", () => {
			const evidence = createEvidenceSequence("imagination", [
				{ score: 15, confidence: 80 },
				{ score: 16, confidence: 80 },
			]);

			const result = aggregateFacetScores(evidence);

			// 2 evidence at 80% → ~47 (higher than single evidence at 80% → 39)
			expect(result.imagination.confidence).toBe(47);
		});

		it("confidence grows progressively as evidence accumulates", () => {
			// Simulate an assessment session: each new evidence at 80% confidence
			// should increase facet confidence, with diminishing returns
			const confidences: number[] = [];

			for (let count = 1; count <= 10; count++) {
				const evidence = createEvidenceSequence(
					"imagination",
					Array.from({ length: count }, () => ({ score: 15, confidence: 80 })),
				);
				const result = aggregateFacetScores(evidence);
				confidences.push(result.imagination.confidence);
			}

			// Each step must be >= the previous (rounding can make adjacent steps equal)
			for (let i = 1; i < confidences.length; i++) {
				expect(confidences[i]).toBeGreaterThanOrEqual(confidences[i - 1]!);
			}

			// 1 evidence should be low (not enough data to be confident)
			expect(confidences[0]).toBeLessThan(45);

			// 10 evidence should be substantially higher than 1 evidence
			expect(confidences[9]).toBeGreaterThan(confidences[0]! + 15);

			// Verify clear growth across larger intervals (not affected by rounding)
			expect(confidences[4]).toBeGreaterThan(confidences[0]!); // 5 > 1
			expect(confidences[9]).toBeGreaterThan(confidences[4]!); // 10 > 5
		});
	});

	describe("multiple facets", () => {
		it("aggregates evidence independently for different facets", () => {
			const evidence = [createEvidence("imagination", 18, 90), createEvidence("altruism", 5, 70)];

			const result = aggregateFacetScores(evidence);

			expect(result.imagination.score).toBe(18);
			// Single evidence at 90% → ~42 via saturation curve
			expect(result.imagination.confidence).toBe(42);
			expect(result.altruism.score).toBe(5);
			// Single evidence at 70% → ~35 via saturation curve
			expect(result.altruism.confidence).toBe(35);
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

		it("confidences are in valid range 0-90 (C_MAX)", () => {
			const evidence = ALL_FACETS.map((facet) => createEvidence(facet, 15, 80));
			const result = aggregateFacetScores(evidence);

			for (const facet of ALL_FACETS) {
				expect(result[facet].confidence).toBeGreaterThanOrEqual(0);
				expect(result[facet].confidence).toBeLessThanOrEqual(90);
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
