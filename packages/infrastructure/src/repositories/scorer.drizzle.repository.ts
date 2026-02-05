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
 * 6. Derive traits from facets: sum of 6 facets (0-120 scale), minimum confidence
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies: Database, LoggerRepository
 */

import {
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	DatabaseError,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	ScorerError,
	ScorerRepository,
	TRAIT_TO_FACETS,
	type TraitName,
	type TraitScoresMap,
} from "@workspace/domain";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentMessage, facetEvidence } from "../db/drizzle/schema";

/**
 * Calculate sum of numbers
 */
function sum(values: number[]): number {
	return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate mean of numbers
 */
function mean(values: number[]): number {
	if (values.length === 0) return 0;
	return sum(values) / values.length;
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
	const sorted = [...evidence].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

	// Calculate weighted average with recency bias
	let weightedSum = 0;
	let weightTotal = 0;

	sorted.forEach((e, idx) => {
		// Weight = confidence × (1 + position × 0.1)
		// Recent messages get 10% boost per position
		// Confidence is already 0-100, normalize to 0-1 for weighting calculation
		const confidenceNormalized = e.confidence / 100;
		const recencyBoost = 1 + idx * 0.1;
		const weight = confidenceNormalized * recencyBoost;

		weightedSum += e.score * weight;
		weightTotal += weight;
	});

	const aggregatedScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

	// Calculate variance for contradiction detection
	const scores = sorted.map((e) => e.score);
	const varianceValue = variance(scores);

	// Calculate average confidence (work with 0-100 integers)
	const confidences = sorted.map((e) => e.confidence);
	const avgConfidence = mean(confidences);

	// Adjust confidence based on variance and sample size (0-100 scale)
	let adjustedConfidence = avgConfidence;

	// High variance (>15) indicates contradictions → lower confidence
	if (varianceValue > 15) {
		adjustedConfidence -= 30; // -30 points on 0-100 scale
	}

	// Clamp to 0-100 integer range
	adjustedConfidence = Math.round(clamp(adjustedConfidence, 0, 100));

	return {
		score: Math.round(aggregatedScore * 10) / 10, // Round to 1 decimal
		confidence: adjustedConfidence, // Already 0-100 integer
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

		logger.info("Scorer Drizzle repository initialized");

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
						.innerJoin(assessmentMessage, eq(facetEvidence.assessmentMessageId, assessmentMessage.id))
						.where(eq(assessmentMessage.sessionId, sessionId))
						.orderBy(facetEvidence.createdAt)
						.pipe(
							Effect.mapError(
								(_error) =>
									new DatabaseError({
										message: "Failed to query facet evidence",
									}),
							),
						);

					// Group evidence by facetName
					const evidenceByFacet = new Map<string, EvidenceRow[]>();
					for (const row of evidenceRows) {
						const existing = evidenceByFacet.get(row.facetName) || [];
						existing.push(row);
						evidenceByFacet.set(row.facetName, existing);
					}

					// Initialize full map, then update with aggregated evidence
					const facetScores: FacetScoresMap = createInitialFacetScoresMap();
					for (const [facetName, evidence] of evidenceByFacet.entries()) {
						const aggregated = aggregateFacet(evidence);
						facetScores[facetName as FacetName] = aggregated;
					}

					const duration = Date.now() - startTime;

					logger.info("Facet scores aggregated", {
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
								error instanceof Error ? error.message : String(error),
							),
						),
					),
				),

			deriveTraitScores: (facetScores: FacetScoresMap) =>
				Effect.gen(function* () {
					const traitScores: TraitScoresMap = createInitialTraitScoresMap();

					// For each of the 5 traits
					for (const [traitName, facetNames] of Object.entries(TRAIT_TO_FACETS)) {
						// Get scores for all 6 facets belonging to this trait
						const facetsForTrait = facetNames.map((fn) => facetScores[fn]);

						// Trait score = sum of facet scores (0-120 scale for stacked visualization)
						const traitScore = sum(facetsForTrait.map((f) => f.score));

						// Trait confidence = minimum confidence (conservative estimate)
						const traitConfidence = Math.min(...facetsForTrait.map((f) => f.confidence));

						traitScores[traitName as TraitName] = {
							score: Math.round(traitScore * 10) / 10, // Round to 1 decimal
							confidence: Math.round(traitConfidence), // Already 0-100 integer, just ensure it's rounded
						};
					}

					logger.info("Trait scores derived", {
						traitCount: Object.keys(traitScores).length,
						facetCount: Object.keys(facetScores).length,
					});

					return traitScores;
				}).pipe(
					Effect.catchAll((error: unknown) =>
						Effect.fail(
							new ScorerError(
								"unknown", // No sessionId in this context
								"Failed to derive trait scores",
								error instanceof Error ? error.message : String(error),
							),
						),
					),
				),
		});
	}),
);
