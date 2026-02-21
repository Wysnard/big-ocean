/**
 * computeDepthSignal Unit Tests
 *
 * Tests the depth signal computation for portrait generation.
 * Verifies RICH/MODERATE/THIN tier boundaries and format output.
 *
 * Tier definitions (from Story 8.7 ACs #2, #3, #4):
 * - RICH: 8+ evidence records with confidence > 60%
 * - MODERATE: 4-7 evidence records with confidence > 60%
 * - THIN: <4 evidence records with confidence > 60%
 */

import type { SavedFacetEvidence } from "@workspace/domain";
import { describe, expect, it } from "vitest";
import { computeDepthSignal } from "../portrait-generator.claude.repository";

/**
 * Create a SavedFacetEvidence record with a given confidence.
 */
function makeEvidence(confidence: number, index = 0): SavedFacetEvidence {
	return {
		id: `evidence_${index}`,
		assessmentMessageId: `msg_${index}`,
		facetName: "imagination",
		score: 15,
		confidence,
		quote: `Test quote ${index}`,
		highlightRange: { start: 0, end: 10 },
		createdAt: new Date(),
	};
}

/**
 * Create N evidence records all with the given confidence.
 */
function makeEvidenceBatch(count: number, confidence: number): SavedFacetEvidence[] {
	return Array.from({ length: count }, (_, i) => makeEvidence(confidence, i));
}

describe("computeDepthSignal", () => {
	describe("RICH tier (8+ high-confidence)", () => {
		it("should return RICH when exactly 8 records have confidence > 60", () => {
			const evidence = makeEvidenceBatch(8, 61);
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: RICH (8 records, 8 high-confidence)");
		});

		it("should return RICH when more than 8 records have confidence > 60", () => {
			const evidence = makeEvidenceBatch(12, 80);
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: RICH (12 records, 12 high-confidence)");
		});

		it("should count only high-confidence records for RICH threshold", () => {
			// 8 high + 5 low = 13 total, 8 high-confidence
			const high = makeEvidenceBatch(8, 75);
			const low = makeEvidenceBatch(5, 30).map((e, i) => ({ ...e, id: `low_${i}` }));
			const result = computeDepthSignal([...high, ...low]);
			expect(result).toBe("EVIDENCE DENSITY: RICH (13 records, 8 high-confidence)");
		});
	});

	describe("MODERATE tier (4-7 high-confidence)", () => {
		it("should return MODERATE when exactly 4 records have confidence > 60", () => {
			const evidence = makeEvidenceBatch(4, 70);
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (4 records, 4 high-confidence)");
		});

		it("should return MODERATE when 7 records have confidence > 60", () => {
			const evidence = makeEvidenceBatch(7, 65);
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (7 records, 7 high-confidence)");
		});

		it("should count total records separately from high-confidence for MODERATE", () => {
			// 5 high + 10 low = 15 total, 5 high-confidence
			const high = makeEvidenceBatch(5, 80);
			const low = makeEvidenceBatch(10, 40).map((e, i) => ({ ...e, id: `low_${i}` }));
			const result = computeDepthSignal([...high, ...low]);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (15 records, 5 high-confidence)");
		});
	});

	describe("THIN tier (<4 high-confidence)", () => {
		it("should return THIN when 0 records have confidence > 60", () => {
			const evidence = makeEvidenceBatch(5, 50);
			const result = computeDepthSignal(evidence);
			expect(result).toBe(
				"EVIDENCE DENSITY: THIN (5 records, 0 high-confidence) — scale ambition to evidence",
			);
		});

		it("should return THIN when 3 records have confidence > 60", () => {
			const evidence = makeEvidenceBatch(3, 70);
			const result = computeDepthSignal(evidence);
			expect(result).toBe(
				"EVIDENCE DENSITY: THIN (3 records, 3 high-confidence) — scale ambition to evidence",
			);
		});

		it("should return THIN for empty evidence array", () => {
			const result = computeDepthSignal([]);
			expect(result).toBe(
				"EVIDENCE DENSITY: THIN (0 records, 0 high-confidence) — scale ambition to evidence",
			);
		});

		it("should include 'scale ambition to evidence' suffix only for THIN", () => {
			const thin = computeDepthSignal(makeEvidenceBatch(2, 70));
			const moderate = computeDepthSignal(makeEvidenceBatch(5, 70));
			const rich = computeDepthSignal(makeEvidenceBatch(10, 70));

			expect(thin).toContain("scale ambition to evidence");
			expect(moderate).not.toContain("scale ambition to evidence");
			expect(rich).not.toContain("scale ambition to evidence");
		});
	});

	describe("confidence threshold boundary (> 60, not >=)", () => {
		it("should NOT count records with exactly 60% confidence as high-confidence", () => {
			// 8 records at exactly 60% — should be THIN (none are > 60)
			const evidence = makeEvidenceBatch(8, 60);
			const result = computeDepthSignal(evidence);
			expect(result).toContain("EVIDENCE DENSITY: THIN");
			expect(result).toContain("0 high-confidence");
		});

		it("should count records with 61% confidence as high-confidence", () => {
			const evidence = makeEvidenceBatch(8, 61);
			const result = computeDepthSignal(evidence);
			expect(result).toContain("EVIDENCE DENSITY: RICH");
			expect(result).toContain("8 high-confidence");
		});

		it("should correctly split at the 60% boundary in mixed evidence", () => {
			// 4 at 61% (high) + 4 at 60% (not high) = 4 high-confidence → MODERATE
			const high = makeEvidenceBatch(4, 61);
			const boundary = makeEvidenceBatch(4, 60).map((e, i) => ({ ...e, id: `boundary_${i}` }));
			const result = computeDepthSignal([...high, ...boundary]);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (8 records, 4 high-confidence)");
		});
	});
});
