/**
 * computeDepthSignal Unit Tests
 *
 * Tests the depth signal computation for portrait generation.
 * Uses finalWeight (strength × confidence) >= 0.36 as the quality threshold.
 *
 * Tier definitions (updated for v2 evidence — Story 18-2):
 * - RICH: 8+ evidence records with finalWeight >= 0.36
 * - MODERATE: 4-7 evidence records with finalWeight >= 0.36
 * - THIN: <4 evidence records with finalWeight >= 0.36
 *
 * finalWeight threshold 0.36 = moderate(0.6) × medium(0.6)
 */

import { describe, expect, it } from "vitest";
import type { DepthSignalEvidence } from "../portrait-prompt.utils";
import { computeDepthSignal } from "../portrait-prompt.utils";

/**
 * Create a v2 evidence record with given strength/confidence.
 */
function makeEvidence(
	strength: "weak" | "moderate" | "strong",
	confidence: "low" | "medium" | "high",
): DepthSignalEvidence {
	return { strength, confidence };
}

/**
 * Create N evidence records all with the given strength/confidence.
 */
function makeEvidenceBatch(
	count: number,
	strength: "weak" | "moderate" | "strong",
	confidence: "low" | "medium" | "high",
): DepthSignalEvidence[] {
	return Array.from({ length: count }, () => makeEvidence(strength, confidence));
}

describe("computeDepthSignal", () => {
	describe("RICH tier (8+ high-quality)", () => {
		it("should return RICH when 8 records have finalWeight >= 0.36", () => {
			// moderate(0.6) × medium(0.6) = 0.36 → exactly at threshold
			const evidence = makeEvidenceBatch(8, "moderate", "medium");
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: RICH (8 records, 8 high-confidence)");
		});

		it("should return RICH with strong/high evidence", () => {
			// strong(1.0) × high(0.9) = 0.9 → well above threshold
			const evidence = makeEvidenceBatch(10, "strong", "high");
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: RICH (10 records, 10 high-confidence)");
		});

		it("should count only high-quality records for RICH threshold", () => {
			// 8 above threshold + 5 below = 13 total, 8 high-quality
			const high = makeEvidenceBatch(8, "strong", "high");
			const low = makeEvidenceBatch(5, "weak", "low"); // 0.3*0.3=0.09 < 0.36
			const result = computeDepthSignal([...high, ...low]);
			expect(result).toBe("EVIDENCE DENSITY: RICH (13 records, 8 high-confidence)");
		});
	});

	describe("MODERATE tier (4-7 high-quality)", () => {
		it("should return MODERATE when exactly 4 records are high-quality", () => {
			const evidence = makeEvidenceBatch(4, "moderate", "medium");
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (4 records, 4 high-confidence)");
		});

		it("should return MODERATE when 7 records are high-quality", () => {
			const evidence = makeEvidenceBatch(7, "strong", "medium");
			const result = computeDepthSignal(evidence);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (7 records, 7 high-confidence)");
		});

		it("should count total records separately from high-quality for MODERATE", () => {
			const high = makeEvidenceBatch(5, "strong", "high");
			const low = makeEvidenceBatch(10, "weak", "low");
			const result = computeDepthSignal([...high, ...low]);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (15 records, 5 high-confidence)");
		});
	});

	describe("THIN tier (<4 high-quality)", () => {
		it("should return THIN when all records are below threshold", () => {
			// weak(0.3) × low(0.3) = 0.09 < 0.36
			const evidence = makeEvidenceBatch(5, "weak", "low");
			const result = computeDepthSignal(evidence);
			expect(result).toBe(
				"EVIDENCE DENSITY: THIN (5 records, 0 high-confidence) — scale ambition to evidence",
			);
		});

		it("should return THIN when 3 records are high-quality", () => {
			const evidence = makeEvidenceBatch(3, "strong", "high");
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
			const thin = computeDepthSignal(makeEvidenceBatch(2, "strong", "high"));
			const moderate = computeDepthSignal(makeEvidenceBatch(5, "strong", "high"));
			const rich = computeDepthSignal(makeEvidenceBatch(10, "strong", "high"));

			expect(thin).toContain("scale ambition to evidence");
			expect(moderate).not.toContain("scale ambition to evidence");
			expect(rich).not.toContain("scale ambition to evidence");
		});
	});

	describe("finalWeight threshold boundary (>= 0.36)", () => {
		it("moderate/medium (0.36) should count as high-quality (at threshold)", () => {
			// moderate(0.6) × medium(0.6) = 0.36 — exactly at threshold
			const evidence = makeEvidenceBatch(8, "moderate", "medium");
			const result = computeDepthSignal(evidence);
			expect(result).toContain("EVIDENCE DENSITY: RICH");
			expect(result).toContain("8 high-confidence");
		});

		it("weak/medium (0.18) should NOT count as high-quality", () => {
			// weak(0.3) × medium(0.6) = 0.18 < 0.36
			const evidence = makeEvidenceBatch(8, "weak", "medium");
			const result = computeDepthSignal(evidence);
			expect(result).toContain("EVIDENCE DENSITY: THIN");
			expect(result).toContain("0 high-confidence");
		});

		it("moderate/low (0.18) should NOT count as high-quality", () => {
			// moderate(0.6) × low(0.3) = 0.18 < 0.36
			const evidence = makeEvidenceBatch(8, "moderate", "low");
			const result = computeDepthSignal(evidence);
			expect(result).toContain("EVIDENCE DENSITY: THIN");
			expect(result).toContain("0 high-confidence");
		});

		it("should correctly split at threshold in mixed evidence", () => {
			// 4 above threshold + 4 below = 4 high-quality → MODERATE
			const above = makeEvidenceBatch(4, "moderate", "medium"); // 0.36
			const below = makeEvidenceBatch(4, "weak", "medium"); // 0.18
			const result = computeDepthSignal([...above, ...below]);
			expect(result).toBe("EVIDENCE DENSITY: MODERATE (8 records, 4 high-confidence)");
		});
	});
});
