/**
 * Scorer Repository Implementation (Drizzle)
 *
 * Aggregates facet evidence into scores using weighted averaging with recency bias
 * and contradiction detection via variance analysis.
 *
 * Algorithm:
 * 1. Query all evidence for a session (JOIN facetEvidence with assessmentMessage)
 * 2. Group by facetName
 * 3. Calculate weighted average: confidence × (1 + position × 0.1)
 * 4. Detect contradictions via variance (high variance = conflicting signals)
 * 5. Adjust confidence: -0.3 for high variance, +0.2 for large sample
 * 6. Derive traits from facets: mean of 6 facets, minimum confidence
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies: Database, LoggerRepository
 */

import { Layer, Effect } from "effect";
import { eq } from "drizzle-orm";
import { Database } from "../context/database.js";
import { facetEvidence, assessmentMessage } from "../db/schema.js";
import {
  ScorerRepository,
  ScorerError,
  type FacetScoresMap,
  type TraitScoresMap,
  LoggerRepository,
  TRAIT_TO_FACETS,
  type FacetName,
  type TraitName,
} from "@workspace/domain";
import { DatabaseError } from "@workspace/domain";

/**
 * Calculate mean of numbers
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate variance (measure of spread/contradiction)
 */
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((val) => (val - avg) ** 2);
  return mean(squaredDiffs);
}

/**
 * Clamp value to range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Evidence row from database query
 */
interface EvidenceRow {
  facetName: string;
  score: number; // 0-20
  confidence: number; // 0-100 (stored as integer)
  createdAt: Date;
}

/**
 * Aggregate evidence for a single facet
 */
function aggregateFacet(evidence: EvidenceRow[]): {
  score: number;
  confidence: number;
} {
  // Sort by createdAt (oldest first) for recency weighting
  const sorted = [...evidence].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  // Calculate weighted average with recency bias
  let weightedSum = 0;
  let weightTotal = 0;

  sorted.forEach((e, idx) => {
    // Weight = confidence × (1 + position × 0.1)
    // Recent messages get 10% boost per position
    const confidenceNormalized = e.confidence / 100; // Convert 0-100 to 0-1
    const recencyBoost = 1 + idx * 0.1;
    const weight = confidenceNormalized * recencyBoost;

    weightedSum += e.score * weight;
    weightTotal += weight;
  });

  const aggregatedScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // Calculate variance for contradiction detection
  const scores = sorted.map((e) => e.score);
  const varianceValue = variance(scores);

  // Calculate average confidence
  const confidences = sorted.map((e) => e.confidence / 100);
  const avgConfidence = mean(confidences);

  // Adjust confidence based on variance and sample size
  let adjustedConfidence = avgConfidence;

  // High variance (>15) indicates contradictions → lower confidence
  if (varianceValue > 15) {
    adjustedConfidence -= 0.3;
  }

  // Large sample (>10) increases confidence
  if (sorted.length > 10) {
    adjustedConfidence += 0.2;
  }

  // Clamp to 0-1 range
  adjustedConfidence = clamp(adjustedConfidence, 0, 1);

  return {
    score: Math.round(aggregatedScore * 10) / 10, // Round to 1 decimal
    confidence: Math.round(adjustedConfidence * 100) / 100, // Round to 2 decimals
  };
}

/**
 * Scorer Repository Layer
 *
 * Layer type: Layer<ScorerRepository, never, Database | LoggerRepository>
 */
export const ScorerDrizzleRepositoryLive = Layer.effect(
  ScorerRepository,
  Effect.gen(function* () {
    const db = yield* Database;
    const logger = yield* LoggerRepository;

    yield* logger.info("Scorer Drizzle repository initialized");

    return ScorerRepository.of({
      aggregateFacetScores: (sessionId: string) =>
        Effect.gen(function* () {
          const startTime = Date.now();

          // Query all evidence for this session
          // JOIN facetEvidence with assessmentMessage to get sessionId
          const evidenceRows = yield* db
            .select({
              facetName: facetEvidence.facetName,
              score: facetEvidence.score,
              confidence: facetEvidence.confidence,
              createdAt: facetEvidence.createdAt,
            })
            .from(facetEvidence)
            .innerJoin(
              assessmentMessage,
              eq(facetEvidence.messageId, assessmentMessage.id)
            )
            .where(eq(assessmentMessage.sessionId, sessionId))
            .orderBy(facetEvidence.createdAt)
            .pipe(
              Effect.mapError(
                (_error) =>
                  new DatabaseError({
                    message: "Failed to query facet evidence",
                  })
              )
            );

          // Group evidence by facetName
          const evidenceByFacet = new Map<string, EvidenceRow[]>();
          for (const row of evidenceRows) {
            const existing = evidenceByFacet.get(row.facetName) || [];
            existing.push(row);
            evidenceByFacet.set(row.facetName, existing);
          }

          // Aggregate each facet
          const facetScores: FacetScoresMap = {};
          for (const [facetName, evidence] of evidenceByFacet.entries()) {
            const aggregated = aggregateFacet(evidence);
            facetScores[facetName as FacetName] = aggregated;
          }

          const duration = Date.now() - startTime;

          yield* logger.info("Facet scores aggregated", {
            sessionId,
            facetCount: Object.keys(facetScores).length,
            evidenceCount: evidenceRows.length,
            durationMs: duration,
          });

          return facetScores;
        }).pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new ScorerError(
                sessionId,
                "Failed to aggregate facet scores",
                error instanceof Error ? error.message : String(error)
              )
            )
          )
        ),

      deriveTraitScores: (facetScores: FacetScoresMap) =>
        Effect.gen(function* () {
          const traitScores: TraitScoresMap = {};

          // For each of the 5 traits
          for (const [traitName, facetNames] of Object.entries(
            TRAIT_TO_FACETS
          )) {
            // Get scores for all 6 facets belonging to this trait
            const facetsForTrait = facetNames
              .map((fn) => facetScores[fn])
              .filter((f) => f !== undefined); // Handle missing facets gracefully

            if (facetsForTrait.length === 0) {
              // Skip trait if no facets scored yet
              continue;
            }

            // Trait score = mean of facet scores
            const traitScore = mean(facetsForTrait.map((f) => f!.score));

            // Trait confidence = minimum confidence (conservative estimate)
            const traitConfidence = Math.min(
              ...facetsForTrait.map((f) => f!.confidence)
            );

            traitScores[traitName as TraitName] = {
              score: Math.round(traitScore * 10) / 10, // Round to 1 decimal
              confidence: Math.round(traitConfidence * 100) / 100, // Round to 2 decimals
            };
          }

          yield* logger.info("Trait scores derived", {
            traitCount: Object.keys(traitScores).length,
            facetCount: Object.keys(facetScores).length,
          });

          return traitScores;
        }).pipe(
          Effect.catchAll((error: any) =>
            Effect.fail(
              new ScorerError(
                "unknown", // No sessionId in this context
                "Failed to derive trait scores",
                error instanceof Error ? error.message : String(error)
              )
            )
          )
        ),
    });
  })
);
