/**
 * Facet Evidence Repository Implementation (Drizzle)
 *
 * Queries `finalization_evidence` table and maps results to the
 * `SavedFacetEvidence` contract type used by the evidence API endpoints.
 *
 * Replaces the noop stub that was created when `facet_evidence` was dropped
 * in the clean-slate migration (Story 9.1). The finalization_evidence table
 * (Story 11.2) now serves both finalization and evidence-highlighting flows.
 */

import {
	FacetEvidencePersistenceError,
	FacetEvidenceRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import type { FacetName } from "@workspace/domain/constants/big-five";
import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentResults, finalizationEvidence } from "../db/drizzle/schema";

/**
 * Map a finalization_evidence DB row to SavedFacetEvidence contract type.
 *
 * Key differences:
 * - bigfiveFacet → facetName
 * - confidence: numeric(4,3) 0-1 → integer 0-100
 * - highlightStart/highlightEnd → highlightRange: { start, end }
 */
function toSavedFacetEvidence(row: {
	id: string;
	assessmentMessageId: string;
	bigfiveFacet: string;
	score: number;
	confidence: string;
	quote: string;
	highlightStart: number | null;
	highlightEnd: number | null;
	createdAt: Date | null;
}): SavedFacetEvidence {
	return {
		id: row.id,
		assessmentMessageId: row.assessmentMessageId,
		facetName: row.bigfiveFacet as FacetName,
		score: row.score,
		confidence: Math.round(Number(row.confidence) * 100),
		quote: row.quote,
		highlightRange: {
			start: row.highlightStart ?? 0,
			end: row.highlightEnd ?? 0,
		},
		createdAt: row.createdAt ?? new Date(),
	};
}

const mapDbError = (e: unknown) =>
	new FacetEvidencePersistenceError({
		message: `Database error: ${e instanceof Error ? e.message : String(e)}`,
	});

export const FacetEvidenceDrizzleRepositoryLive = Layer.effect(
	FacetEvidenceRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return FacetEvidenceRepository.of({
			saveEvidence: (_assessmentMessageId, _evidence) =>
				// Write path not used — finalization pipeline writes via FinalizationEvidenceRepository
				Effect.succeed([]),

			getEvidenceByMessage: (assessmentMessageId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(finalizationEvidence)
						.where(eq(finalizationEvidence.assessmentMessageId, assessmentMessageId))
						.orderBy(finalizationEvidence.createdAt)
						.pipe(Effect.mapError(mapDbError));

					return rows.map(toSavedFacetEvidence);
				}),

			getEvidenceByFacet: (sessionId, facetName) =>
				Effect.gen(function* () {
					// Find the assessment_results row for this session
					const results = yield* db
						.select({ id: assessmentResults.id })
						.from(assessmentResults)
						.where(eq(assessmentResults.assessmentSessionId, sessionId))
						.limit(1)
						.pipe(Effect.mapError(mapDbError));

					if (results.length === 0) return [];

					const resultId = results[0].id;

					// Fetch finalization evidence filtered by result + facet
					const rows = yield* db
						.select()
						.from(finalizationEvidence)
						.where(
							and(
								eq(finalizationEvidence.assessmentResultId, resultId),
								eq(finalizationEvidence.bigfiveFacet, facetName),
							),
						)
						.orderBy(finalizationEvidence.createdAt)
						.pipe(Effect.mapError(mapDbError));

					return rows.map(toSavedFacetEvidence);
				}),

			getEvidenceBySession: (sessionId) =>
				Effect.gen(function* () {
					// Find the assessment_results row for this session
					const results = yield* db
						.select({ id: assessmentResults.id })
						.from(assessmentResults)
						.where(eq(assessmentResults.assessmentSessionId, sessionId))
						.limit(1)
						.pipe(Effect.mapError(mapDbError));

					if (results.length === 0) return [];

					const resultId = results[0].id;

					const rows = yield* db
						.select()
						.from(finalizationEvidence)
						.where(eq(finalizationEvidence.assessmentResultId, resultId))
						.orderBy(finalizationEvidence.createdAt)
						.pipe(Effect.mapError(mapDbError));

					return rows.map(toSavedFacetEvidence);
				}),
		});
	}),
);
