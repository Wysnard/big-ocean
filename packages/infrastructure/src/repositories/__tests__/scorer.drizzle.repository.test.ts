/**
 * Scorer Drizzle Repository Tests
 *
 * Tests for the Drizzle-based scorer implementation with weighted averaging,
 * recency bias, variance analysis, and trait derivation.
 */

import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import {
  ScorerRepository,
  LoggerRepository,
  type FacetScoresMap,
} from "@workspace/domain";
import { ScorerDrizzleRepositoryLive } from "../scorer.drizzle.repository.js";
import { Database } from "../../context/database.js";

/**
 * Test Logger Layer
 */
const TestLoggerLayer = Layer.succeed(LoggerRepository, {
  info: () => Effect.void,
  error: () => Effect.void,
  warn: () => Effect.void,
  debug: () => Effect.void,
});

/**
 * Evidence row structure for testing
 */
interface TestEvidenceRow {
  facetName: string;
  score: number;
  confidence: number;
  createdAt: Date;
}

/**
 * Mock Database Layer for testing
 * Simulates different evidence scenarios
 */
function createMockDatabaseLayer(evidenceRows: TestEvidenceRow[]) {
  const mockDb = {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            orderBy: () => Effect.succeed(evidenceRows),
          }),
        }),
      }),
    }),
  };

  // biome-ignore lint/suspicious/noExplicitAny: Mocking Drizzle query builder type
  return Layer.succeed(Database, mockDb as any);
}

describe("ScorerDrizzleRepository - Structure", () => {
  it.effect("should be a valid Layer", () =>
    Effect.sync(() => {
      expect(ScorerDrizzleRepositoryLive).toBeDefined();
    })
  );

  it.effect("should provide ScorerRepository service", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      expect(scorer).toBeDefined();
      expect(scorer.aggregateFacetScores).toBeDefined();
      expect(scorer.deriveTraitScores).toBeDefined();
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );
});

describe("ScorerDrizzleRepository - Aggregation", () => {
  it.effect("should aggregate single evidence correctly", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.aggregateFacetScores("session_123");

      expect(result.imagination).toBeDefined();
      expect(result.imagination.score).toBeCloseTo(16, 1);
      expect(result.imagination.confidence).toBeCloseTo(0.85, 2);
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([
            {
              facetName: "imagination",
              score: 16,
              confidence: 85,
              createdAt: new Date("2024-01-01"),
            },
          ]))
        ))
      )
    )
  );

  it.effect("should handle multiple evidence with weighted averaging", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.aggregateFacetScores("session_123");

      // Most recent message should have higher weight
      expect(result.imagination).toBeDefined();
      expect(result.imagination.score).toBeGreaterThan(15); // Should be weighted toward recent high score
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([
            {
              facetName: "imagination",
              score: 12,
              confidence: 70,
              createdAt: new Date("2024-01-01"),
            },
            {
              facetName: "imagination",
              score: 16,
              confidence: 80,
              createdAt: new Date("2024-01-02"),
            },
            {
              facetName: "imagination",
              score: 18,
              confidence: 90,
              createdAt: new Date("2024-01-03"),
            },
          ]))
        ))
      )
    )
  );

  it.effect("should aggregate multiple facets independently", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.aggregateFacetScores("session_123");

      expect(result.imagination).toBeDefined();
      expect(result.altruism).toBeDefined();
      expect(result.imagination.score).not.toBe(result.altruism.score);
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([
            {
              facetName: "imagination",
              score: 16,
              confidence: 85,
              createdAt: new Date("2024-01-01"),
            },
            {
              facetName: "altruism",
              score: 18,
              confidence: 90,
              createdAt: new Date("2024-01-01"),
            },
          ]))
        ))
      )
    )
  );

  it.effect("should return empty map when no evidence", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.aggregateFacetScores("session_123");

      expect(Object.keys(result).length).toBe(0);
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should return scores in 0-20 range", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.aggregateFacetScores("session_123");

      Object.values(result).forEach((facetScore) => {
        expect(facetScore.score).toBeGreaterThanOrEqual(0);
        expect(facetScore.score).toBeLessThanOrEqual(20);
      });
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([
            {
              facetName: "imagination",
              score: 16,
              confidence: 85,
              createdAt: new Date("2024-01-01"),
            },
            {
              facetName: "altruism",
              score: 18,
              confidence: 90,
              createdAt: new Date("2024-01-01"),
            },
          ]))
        ))
      )
    )
  );

  it.effect("should return confidence in 0-1 range", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.aggregateFacetScores("session_123");

      Object.values(result).forEach((facetScore) => {
        expect(facetScore.confidence).toBeGreaterThanOrEqual(0);
        expect(facetScore.confidence).toBeLessThanOrEqual(1);
      });
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([
            {
              facetName: "imagination",
              score: 16,
              confidence: 85,
              createdAt: new Date("2024-01-01"),
            },
            {
              facetName: "altruism",
              score: 18,
              confidence: 90,
              createdAt: new Date("2024-01-01"),
            },
          ]))
        ))
      )
    )
  );
});

describe("ScorerDrizzleRepository - Trait Derivation", () => {
  it.effect("should derive traits from facet scores", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      // Create mock facet scores for openness facets
      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.85 },
        artistic_interests: { score: 15, confidence: 0.8 },
        emotionality: { score: 14, confidence: 0.78 },
        adventurousness: { score: 17, confidence: 0.88 },
        intellect: { score: 16, confidence: 0.87 },
        liberalism: { score: 15, confidence: 0.82 },
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      expect(result.openness).toBeDefined();
      // Mean should be around 15.5
      expect(result.openness.score).toBeGreaterThan(14);
      expect(result.openness.score).toBeLessThan(17);
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should use minimum confidence for traits", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      // Create facet scores with varying confidences
      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.9 },
        artistic_interests: { score: 15, confidence: 0.85 },
        emotionality: { score: 14, confidence: 0.7 }, // Lowest
        adventurousness: { score: 17, confidence: 0.88 },
        intellect: { score: 16, confidence: 0.87 },
        liberalism: { score: 15, confidence: 0.82 },
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      // Trait confidence should be minimum (0.7)
      expect(result.openness.confidence).toBe(0.7);
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should handle missing facets gracefully", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      // Only provide 3 of 6 facets
      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.85 },
        intellect: { score: 16, confidence: 0.87 },
        liberalism: { score: 15, confidence: 0.82 },
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      // Should still compute openness with available facets
      expect(result.openness).toBeDefined();
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should skip traits with no facets", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      // Only provide openness facets
      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.85 },
        artistic_interests: { score: 15, confidence: 0.8 },
        emotionality: { score: 14, confidence: 0.78 },
        adventurousness: { score: 17, confidence: 0.88 },
        intellect: { score: 16, confidence: 0.87 },
        liberalism: { score: 15, confidence: 0.82 },
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      // Openness should be present
      expect(result.openness).toBeDefined();

      // Other traits should be missing (no facet data)
      expect(result.conscientiousness).toBeUndefined();
      expect(result.extraversion).toBeUndefined();
      expect(result.agreeableness).toBeUndefined();
      expect(result.neuroticism).toBeUndefined();
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should return trait scores in 0-20 range", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.85 },
        artistic_interests: { score: 15, confidence: 0.8 },
        emotionality: { score: 14, confidence: 0.78 },
        adventurousness: { score: 17, confidence: 0.88 },
        intellect: { score: 16, confidence: 0.87 },
        liberalism: { score: 15, confidence: 0.82 },
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      Object.values(result).forEach((traitScore) => {
        expect(traitScore.score).toBeGreaterThanOrEqual(0);
        expect(traitScore.score).toBeLessThanOrEqual(20);
      });
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should return trait confidence in 0-1 range", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.85 },
        artistic_interests: { score: 15, confidence: 0.8 },
        emotionality: { score: 14, confidence: 0.78 },
        adventurousness: { score: 17, confidence: 0.88 },
        intellect: { score: 16, confidence: 0.87 },
        liberalism: { score: 15, confidence: 0.82 },
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      Object.values(result).forEach((traitScore) => {
        expect(traitScore.confidence).toBeGreaterThanOrEqual(0);
        expect(traitScore.confidence).toBeLessThanOrEqual(1);
      });
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );
});

describe("ScorerDrizzleRepository - Edge Cases", () => {
  it.effect("should handle empty facet scores map", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;
      const result = yield* scorer.deriveTraitScores({});

      expect(Object.keys(result).length).toBe(0);
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );

  it.effect("should handle all 5 traits correctly", () =>
    Effect.gen(function* () {
      const scorer = yield* ScorerRepository;

      // Provide at least one facet for each trait
      const facetScores: FacetScoresMap = {
        imagination: { score: 16, confidence: 0.85 }, // Openness
        self_efficacy: { score: 15, confidence: 0.8 }, // Conscientiousness
        friendliness: { score: 17, confidence: 0.88 }, // Extraversion
        altruism: { score: 18, confidence: 0.9 }, // Agreeableness
        anxiety: { score: 12, confidence: 0.75 }, // Neuroticism
      };

      const result = yield* scorer.deriveTraitScores(facetScores);

      // All 5 traits should be present
      expect(result.openness).toBeDefined();
      expect(result.conscientiousness).toBeDefined();
      expect(result.extraversion).toBeDefined();
      expect(result.agreeableness).toBeDefined();
      expect(result.neuroticism).toBeDefined();
    }).pipe(
      Effect.provide(
        ScorerDrizzleRepositoryLive.pipe(
          Layer.provide(Layer.mergeAll(TestLoggerLayer, createMockDatabaseLayer([])))
        )
      )
    )
  );
});
