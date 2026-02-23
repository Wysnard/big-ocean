/**
 * Precision Calculator Service Tests — Update and Merge
 *
 * Tests for updateFacetConfidence and mergeConfidenceScores.
 */

import { describe, expect, it } from "vitest";
import type { FacetConfidenceScores } from "../../types/facet";
import {
	initializeFacetConfidence,
	mergeConfidenceScores,
	updateFacetConfidence,
} from "../confidence-calculator.service";

describe("Precision Calculator Service — Update & Merge", () => {
	describe("updateFacetConfidence", () => {
		it("should update a single facet precision", () => {
			const initial = initializeFacetConfidence(50);
			const updated = updateFacetConfidence(initial, "imagination", 80);

			expect(updated.imagination).toBe(80);
			expect(updated.artistic_interests).toBe(50); // Unchanged
		});

		it("should clamp values to [0, 100]", () => {
			const initial = initializeFacetConfidence(50);

			const tooHigh = updateFacetConfidence(initial, "imagination", 150);
			expect(tooHigh.imagination).toBe(100);

			const tooLow = updateFacetConfidence(initial, "imagination", -50);
			expect(tooLow.imagination).toBe(0);
		});

		it("should preserve all other facets", () => {
			const initial = initializeFacetConfidence(30);
			const updated = updateFacetConfidence(initial, "anxiety", 90);

			// Check that all other facets are unchanged
			expect(updated.imagination).toBe(30);
			expect(updated.artistic_interests).toBe(30);
			expect(updated.anger).toBe(30);
			// Only anxiety changed
			expect(updated.anxiety).toBe(90);
		});
	});

	describe("mergeConfidenceScores", () => {
		it("should merge with default 50/50 weight", () => {
			const current = initializeFacetConfidence(20);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 80,
				artistic_interests: 80,
			};

			const result = mergeConfidenceScores(current, update);

			// (20 * 0.5) + (80 * 0.5) = 10 + 40 = 50
			expect(result.imagination).toBe(50);
			expect(result.artistic_interests).toBe(50);
			// Other facets unchanged
			expect(result.anxiety).toBe(20);
		});

		it("should apply custom weight correctly", () => {
			const current = initializeFacetConfidence(0);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 100,
			};

			const result = mergeConfidenceScores(current, update, 0.75);

			// (0 * 0.25) + (100 * 0.75) = 75
			expect(result.imagination).toBe(75);
		});

		it("should clamp weight to [0, 1]", () => {
			const current = initializeFacetConfidence(0);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 100,
			};

			// Weight > 1 should be clamped to 1
			const resultHigh = mergeConfidenceScores(current, update, 1.5);
			expect(resultHigh.imagination).toBe(100);

			// Weight < 0 should be clamped to 0
			const resultLow = mergeConfidenceScores(current, update, -0.5);
			expect(resultLow.imagination).toBe(0);
		});

		it("should only update facets in the update object", () => {
			const current = initializeFacetConfidence(50);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 90,
			};

			const result = mergeConfidenceScores(current, update, 0.5);

			// Updated facet: (50 * 0.5) + (90 * 0.5) = 25 + 45 = 70
			expect(result.imagination).toBe(70);

			// Unchanged facets should stay the same
			expect(result.artistic_interests).toBe(50);
			expect(result.anxiety).toBe(50);
		});

		it("should handle weight of 0 (no update)", () => {
			const current = initializeFacetConfidence(30);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 90,
			};

			const result = mergeConfidenceScores(current, update, 0);

			// Should keep current value (no weight on update)
			expect(result.imagination).toBe(30);
		});

		it("should handle weight of 1 (full update)", () => {
			const current = initializeFacetConfidence(10);
			const update: Partial<FacetConfidenceScores> = {
				imagination: 90,
			};

			const result = mergeConfidenceScores(current, update, 1);

			// Should take update value (full weight on update)
			expect(result.imagination).toBe(90);
		});
	});
});
