/**
 * Finalization Evidence Repository Implementation (Drizzle)
 *
 * Persists rich evidence produced by FinAnalyzer (Sonnet) during finalization.
 *
 * Story 11.2
 */
import {
	FinalizationEvidenceError,
	type FinalizationEvidenceRecord,
	FinalizationEvidenceRepository,
} from "@workspace/domain";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { finalizationEvidence } from "../db/drizzle/schema";

export const FinalizationEvidenceDrizzleRepositoryLive = Layer.effect(
	FinalizationEvidenceRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return FinalizationEvidenceRepository.of({
			saveBatch: (records) =>
				Effect.gen(function* () {
					if (records.length === 0) return;

					yield* db
						.insert(finalizationEvidence)
						.values(
							records.map((r) => ({
								assessmentMessageId: r.assessmentMessageId,
								assessmentResultId: r.assessmentResultId,
								bigfiveFacet: r.bigfiveFacet,
								score: r.score,
								confidence: String(r.confidence),
								domain: r.domain,
								rawDomain: r.rawDomain,
								quote: r.quote,
								highlightStart: r.highlightStart,
								highlightEnd: r.highlightEnd,
							})),
						)
						.pipe(
							Effect.mapError(
								(error) =>
									new FinalizationEvidenceError({
										message: `Failed to save finalization evidence: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);
				}),

			getByResultId: (assessmentResultId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(finalizationEvidence)
						.where(eq(finalizationEvidence.assessmentResultId, assessmentResultId))
						.orderBy(finalizationEvidence.createdAt)
						.pipe(
							Effect.mapError(
								(error) =>
									new FinalizationEvidenceError({
										message: `Failed to get finalization evidence: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					return rows.map(
						(row): FinalizationEvidenceRecord => ({
							id: row.id,
							assessmentMessageId: row.assessmentMessageId,
							assessmentResultId: row.assessmentResultId,
							bigfiveFacet: row.bigfiveFacet as FinalizationEvidenceRecord["bigfiveFacet"],
							score: row.score,
							confidence: Number(row.confidence),
							domain: row.domain as FinalizationEvidenceRecord["domain"],
							rawDomain: row.rawDomain,
							quote: row.quote,
							highlightStart: row.highlightStart,
							highlightEnd: row.highlightEnd,
							createdAt: row.createdAt as Date,
						}),
					);
				}),

			existsForSession: (sessionId) =>
				Effect.gen(function* () {
					const result = yield* db
						.select({
							exists: sql<boolean>`exists(
							select 1 from finalization_evidence fe
							join assessment_results ar on fe.assessment_result_id = ar.id
							where ar.assessment_session_id = ${sessionId}
						)`,
						})
						.from(sql`(select 1) as _dummy`)
						.pipe(
							Effect.mapError(
								(error) =>
									new FinalizationEvidenceError({
										message: `Failed to check finalization evidence existence: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					return result[0]?.exists ?? false;
				}),
		});
	}),
);
