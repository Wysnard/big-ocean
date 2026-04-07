/**
 * Facet Evidence Repository Implementation (Drizzle)
 *
 * Queries `conversation_evidence` table and maps results to the
 * `SavedFacetEvidence` contract type used by the evidence API endpoints.
 *
 * Story 18-5: Migrated from finalization_evidence to conversation_evidence.
 */

import {
	FacetEvidencePersistenceError,
	FacetEvidenceRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import type { FacetName } from "@workspace/domain/constants/big-five";
import type { EvidencePolarity, EvidenceStrength } from "@workspace/domain/types/evidence";
import { deriveDeviation } from "@workspace/domain/utils/derive-deviation";
import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { conversationEvidence } from "../db/drizzle/schema";

/** Confidence enum → numeric 0-100 */
const CONFIDENCE_MAP = { low: 30, medium: 60, high: 90 } as const;

/** Deviation → 0-20 score (midpoint 10, scale 10/3) */
function deviationToScore(deviation: number): number {
	return Math.round(10 + deviation * (10 / 3));
}

/**
 * Map a conversation_evidence DB row to SavedFacetEvidence contract type.
 */
function toSavedFacetEvidence(row: {
	id: string;
	messageId: string;
	bigfiveFacet: string;
	polarity: string;
	strength: string;
	confidence: string;
	domain: string;
	note: string;
	createdAt: Date | null;
}): SavedFacetEvidence {
	const deviation = deriveDeviation(
		row.polarity as EvidencePolarity,
		row.strength as EvidenceStrength,
	);
	return {
		id: row.id,
		assessmentMessageId: row.messageId,
		facetName: row.bigfiveFacet as FacetName,
		score: deviationToScore(deviation),
		confidence: CONFIDENCE_MAP[row.confidence as keyof typeof CONFIDENCE_MAP] ?? 50,
		quote: row.note,
		highlightRange: { start: 0, end: row.note.length },
		domain: row.domain,
		deviation,
		createdAt: row.createdAt ?? new Date(),
	};
}

const mapDbError = (e: unknown) =>
	new FacetEvidencePersistenceError({
		assessmentMessageId: "unknown",
		reason: `Database error: ${e instanceof Error ? e.message : String(e)}`,
		evidenceCount: 0,
	});

export const FacetEvidenceDrizzleRepositoryLive = Layer.effect(
	FacetEvidenceRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return FacetEvidenceRepository.of({
			saveEvidence: (_assessmentMessageId, _evidence) =>
				// Write path not used — conversation evidence written via ConversationEvidenceRepository
				Effect.succeed([]),

			getEvidenceByMessage: (assessmentMessageId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(conversationEvidence)
						.where(eq(conversationEvidence.messageId, assessmentMessageId))
						.orderBy(conversationEvidence.createdAt)
						.pipe(Effect.mapError(mapDbError));

					return rows.map(toSavedFacetEvidence);
				}),

			getEvidenceByFacet: (sessionId, facetName) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(conversationEvidence)
						.where(
							and(
								eq(conversationEvidence.conversationId, sessionId),
								eq(conversationEvidence.bigfiveFacet, facetName),
							),
						)
						.orderBy(conversationEvidence.createdAt)
						.pipe(Effect.mapError(mapDbError));

					return rows.map(toSavedFacetEvidence);
				}),

			getEvidenceBySession: (sessionId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(conversationEvidence)
						.where(eq(conversationEvidence.conversationId, sessionId))
						.orderBy(conversationEvidence.createdAt)
						.pipe(Effect.mapError(mapDbError));

					return rows.map(toSavedFacetEvidence);
				}),
		});
	}),
);
