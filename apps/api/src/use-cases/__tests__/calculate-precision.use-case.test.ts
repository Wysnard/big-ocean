/**
 * Calculate Precision Use Case Tests
 *
 * Tests for calculating overall precision from facet confidences.
 * Precision = mean of all facet confidences (0-100%).
 *
 * Follows TDD: RED → GREEN → REFACTOR
 */

import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { TestRepositoriesLayer } from "../../test-utils/test-layers.js";
import {
  calculatePrecisionFromFacets,
  type CalculatePrecisionInput,
} from "../calculate-precision.use-case.js";
import type { FacetScoresMap } from "@workspace/domain";

describe("calculatePrecisionFromFacets use-case", () => {
  describe("basic calculations", () => {
    it.effect("should calculate precision as mean of all facet confidences", () =>
      Effect.gen(function* () {
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 0.8 },
          artistic_interests: { score: 15, confidence: 0.7 },
          emotionality: { score: 14, confidence: 0.6 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        // Mean of 0.8, 0.7, 0.6 = 0.7 = 70%
        expect(result.precision).toBeCloseTo(70, 0);
        expect(result.facetCount).toBe(3);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should handle empty facet scores", () =>
      Effect.gen(function* () {
        const facetScores: FacetScoresMap = {};

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        // No facets = 0% precision
        expect(result.precision).toBe(0);
        expect(result.facetCount).toBe(0);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should return 100% precision when all confidences are 1.0", () =>
      Effect.gen(function* () {
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 1.0 },
          artistic_interests: { score: 15, confidence: 1.0 },
          intellect: { score: 17, confidence: 1.0 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        expect(result.precision).toBe(100);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should return 0% precision when all confidences are 0", () =>
      Effect.gen(function* () {
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 0 },
          artistic_interests: { score: 15, confidence: 0 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        expect(result.precision).toBe(0);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });

  describe("score range", () => {
    it.effect("should always return precision in 0-100 range", () =>
      Effect.gen(function* () {
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 0.85 },
          altruism: { score: 18, confidence: 0.9 },
          orderliness: { score: 14, confidence: 0.75 },
          friendliness: { score: 17, confidence: 0.88 },
          anxiety: { score: 10, confidence: 0.65 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        expect(result.precision).toBeGreaterThanOrEqual(0);
        expect(result.precision).toBeLessThanOrEqual(100);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });

  describe("formula verification", () => {
    it.effect("should use formula: (sum of confidences / facet count) * 100", () =>
      Effect.gen(function* () {
        // 5 facets with confidences: 0.9, 0.8, 0.7, 0.6, 0.5
        // Sum = 3.5, Mean = 0.7, Percentage = 70%
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 0.9 },
          artistic_interests: { score: 15, confidence: 0.8 },
          emotionality: { score: 14, confidence: 0.7 },
          adventurousness: { score: 17, confidence: 0.6 },
          intellect: { score: 16, confidence: 0.5 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        // (0.9 + 0.8 + 0.7 + 0.6 + 0.5) / 5 * 100 = 70%
        expect(result.precision).toBeCloseTo(70, 0);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should round precision to 2 decimal places", () =>
      Effect.gen(function* () {
        // Values that produce repeating decimals
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 0.33 },
          artistic_interests: { score: 15, confidence: 0.33 },
          emotionality: { score: 14, confidence: 0.34 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        // Should be rounded to 2 decimal places
        const decimalPlaces = (result.precision.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });

  describe("single facet", () => {
    it.effect("should handle single facet correctly", () =>
      Effect.gen(function* () {
        const facetScores: FacetScoresMap = {
          imagination: { score: 16, confidence: 0.85 },
        };

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        expect(result.precision).toBeCloseTo(85, 0);
        expect(result.facetCount).toBe(1);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });

  describe("all 30 facets", () => {
    it.effect("should calculate correctly with all 30 facets", () =>
      Effect.gen(function* () {
        // Simulate all 30 facets with 0.5 confidence
        const facetScores: FacetScoresMap = {};
        const facetNames = [
          "imagination", "artistic_interests", "emotionality", "adventurousness", "intellect", "liberalism",
          "self_efficacy", "orderliness", "dutifulness", "achievement_striving", "self_discipline", "cautiousness",
          "friendliness", "gregariousness", "assertiveness", "activity_level", "excitement_seeking", "cheerfulness",
          "trust", "morality", "altruism", "cooperation", "modesty", "sympathy",
          "anxiety", "anger", "depression", "self_consciousness", "immoderation", "vulnerability",
        ];

        for (const name of facetNames) {
          facetScores[name as any] = { score: 10, confidence: 0.5 };
        }

        const input: CalculatePrecisionInput = { facetScores };
        const result = yield* calculatePrecisionFromFacets(input);

        expect(result.precision).toBe(50);
        expect(result.facetCount).toBe(30);
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });
});
