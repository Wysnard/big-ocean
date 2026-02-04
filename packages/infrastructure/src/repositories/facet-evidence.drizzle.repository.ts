/**
 * Facet Evidence Repository Implementation (Drizzle)
 *
 * Manages facet evidence persistence for analyzer output.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 * - Uses FacetEvidenceRepository.of({...}) for proper service implementation
 *
 * Confidence values are stored as 0-100 integers (no conversion needed).
 */

import {
	type FacetEvidence,
	FacetEvidenceRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import { FacetEvidencePersistenceError } from "@workspace/domain/errors/evidence.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentMessage, facetEvidence } from "../db/drizzle/schema";

/**
 * Facet Evidence Repository Layer - Receives database and logger through DI
 *
 * Layer type: Layer<FacetEvidenceRepository, never, Database | LoggerRepository>
 * Dependencies resolved during layer construction, not at service level.
 */
export const FacetEvidenceDrizzleRepositoryLive = Layer.effect(
	FacetEvidenceRepository,
	Effect.gen(function* () {
		// Receive dependencies through DI during layer construction
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		// Return service implementation using .of() pattern
		return FacetEvidenceRepository.of({
			saveEvidence: (assessmentMessageId: string, evidence: FacetEvidence[]) =>
				Effect.gen(function* () {
					if (evidence.length === 0) {
						return [];
					}

					// Insert all evidence records
					const savedEvidence = yield* db
						.insert(facetEvidence)
						.values(
							evidence.map((e) => ({
								assessmentMessageId,
								facetName: e.facetName,
								score: e.score,
								confidence: e.confidence, // Direct 0-100 integer, no conversion
								quote: e.quote,
								highlightStart: e.highlightRange.start,
								highlightEnd: e.highlightRange.end,
								createdAt: new Date(),
							})),
						)
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Failed to save facet evidence", {
										operation: "saveEvidence",
										assessmentMessageId,
										evidenceCount: evidence.length,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new FacetEvidencePersistenceError({
									assessmentMessageId,
									reason: "Failed to save facet evidence",
									evidenceCount: evidence.length,
								});
							}),
						);

					if (!savedEvidence || savedEvidence.length === 0) {
						try {
							logger.error("Database operation failed", {
								operation: "saveEvidence",
								assessmentMessageId,
								error: "Insert returned no results",
							});
						} catch (logError) {
							console.error("Logger failed:", logError);
						}

						return yield* Effect.fail(
							new FacetEvidencePersistenceError({
								assessmentMessageId,
								reason: "Insert returned no results",
								evidenceCount: evidence.length,
							}),
						);
					}

					// Transform database records to SavedFacetEvidence format
					const result: SavedFacetEvidence[] = savedEvidence.map((row) => ({
						id: row.id,
						assessmentMessageId: row.assessmentMessageId,
						facetName: row.facetName as FacetEvidence["facetName"],
						score: row.score,
						confidence: row.confidence, // Already 0-100 integer
						quote: row.quote,
						highlightRange: {
							start: row.highlightStart,
							end: row.highlightEnd,
						},
						createdAt: row.createdAt,
					}));

					logger.info("Facet evidence saved", {
						assessmentMessageId,
						savedCount: result.length,
					});

					return result;
				}),

			getEvidenceByMessage: (assessmentMessageId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(facetEvidence)
						.where(eq(facetEvidence.assessmentMessageId, assessmentMessageId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Failed to get evidence by message", {
										operation: "getEvidenceByMessage",
										assessmentMessageId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new FacetEvidencePersistenceError({
									assessmentMessageId,
									reason: "Failed to get evidence by message",
									evidenceCount: 0,
								});
							}),
						);

					return rows.map((row) => ({
						id: row.id,
						assessmentMessageId: row.assessmentMessageId,
						facetName: row.facetName as FacetEvidence["facetName"],
						score: row.score,
						confidence: row.confidence, // Already 0-100 integer
						quote: row.quote,
						highlightRange: {
							start: row.highlightStart,
							end: row.highlightEnd,
						},
						createdAt: row.createdAt,
					}));
				}),

			getEvidenceByFacet: (sessionId: string, facetName: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(facetEvidence)
						.innerJoin(assessmentMessage, eq(facetEvidence.assessmentMessageId, assessmentMessage.id))
						.where(eq(assessmentMessage.sessionId, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Failed to get evidence by facet", {
										operation: "getEvidenceByFacet",
										sessionId,
										facetName,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new FacetEvidencePersistenceError({
									assessmentMessageId: sessionId,
									reason: "Failed to get evidence by facet",
									evidenceCount: 0,
								});
							}),
						);

					// Filter by facet name and map to SavedFacetEvidence
					return rows
						.filter((row) => row.facet_evidence.facetName === facetName)
						.map((row) => ({
							id: row.facet_evidence.id,
							assessmentMessageId: row.facet_evidence.assessmentMessageId,
							facetName: row.facet_evidence.facetName as FacetEvidence["facetName"],
							score: row.facet_evidence.score,
							confidence: row.facet_evidence.confidence, // Already 0-100 integer
							quote: row.facet_evidence.quote,
							highlightRange: {
								start: row.facet_evidence.highlightStart,
								end: row.facet_evidence.highlightEnd,
							},
							createdAt: row.facet_evidence.createdAt,
						}));
				}),

			getEvidenceBySession: (sessionId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(facetEvidence)
						.innerJoin(assessmentMessage, eq(facetEvidence.assessmentMessageId, assessmentMessage.id))
						.where(eq(assessmentMessage.sessionId, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Failed to get evidence by session", {
										operation: "getEvidenceBySession",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new FacetEvidencePersistenceError({
									assessmentMessageId: sessionId,
									reason: "Failed to get evidence by session",
									evidenceCount: 0,
								});
							}),
						);

					return rows.map((row) => ({
						id: row.facet_evidence.id,
						assessmentMessageId: row.facet_evidence.assessmentMessageId,
						facetName: row.facet_evidence.facetName as FacetEvidence["facetName"],
						score: row.facet_evidence.score,
						confidence: row.facet_evidence.confidence, // Already 0-100 integer
						quote: row.facet_evidence.quote,
						highlightRange: {
							start: row.facet_evidence.highlightStart,
							end: row.facet_evidence.highlightEnd,
						},
						createdAt: row.facet_evidence.createdAt,
					}));
				}),
		});
	}),
);
