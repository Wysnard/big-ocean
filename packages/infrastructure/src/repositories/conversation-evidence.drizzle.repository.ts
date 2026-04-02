/**
 * Conversation Evidence Repository Implementation (Drizzle)
 *
 * Pure data access layer — no cap enforcement (caller responsibility).
 *
 * Story 10.1
 */
import {
	ConversationEvidenceError,
	type ConversationEvidenceRecord,
	ConversationEvidenceRepository,
} from "@workspace/domain/repositories/conversation-evidence.repository";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentSession, conversationEvidence } from "../db/drizzle/schema";

export const ConversationEvidenceDrizzleRepositoryLive = Layer.effect(
	ConversationEvidenceRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return ConversationEvidenceRepository.of({
			save: (records) =>
				Effect.gen(function* () {
					if (records.length === 0) return;

					yield* db
						.insert(conversationEvidence)
						.values(
							records.map((r) => ({
								assessmentSessionId: r.sessionId,
								assessmentMessageId: r.messageId,
								exchangeId: r.exchangeId,
								bigfiveFacet: r.bigfiveFacet,
								deviation: r.deviation,
								strength: r.strength,
								confidence: r.confidence,
								domain: r.domain,
								polarity: r.polarity,
								note: r.note,
							})),
						)
						.pipe(
							Effect.mapError(
								(error) =>
									new ConversationEvidenceError({
										message: `Failed to save conversation evidence: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);
				}),

			findBySession: (sessionId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(conversationEvidence)
						.where(eq(conversationEvidence.assessmentSessionId, sessionId))
						.pipe(
							Effect.mapError(
								(error) =>
									new ConversationEvidenceError({
										message: `Failed to find conversation evidence: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					return rows.map((row) => ({
						id: row.id,
						sessionId: row.assessmentSessionId,
						messageId: row.assessmentMessageId,
						exchangeId: row.exchangeId as string,
						bigfiveFacet: row.bigfiveFacet as ConversationEvidenceRecord["bigfiveFacet"],
						deviation: row.deviation,
						strength: row.strength as ConversationEvidenceRecord["strength"],
						confidence: row.confidence as ConversationEvidenceRecord["confidence"],
						domain: row.domain as ConversationEvidenceRecord["domain"],
						polarity: row.polarity as ConversationEvidenceRecord["polarity"],
						note: row.note,
						createdAt: row.createdAt as Date,
					}));
				}),

			findByUserId: (userId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({
							id: conversationEvidence.id,
							assessmentSessionId: conversationEvidence.assessmentSessionId,
							assessmentMessageId: conversationEvidence.assessmentMessageId,
							exchangeId: conversationEvidence.exchangeId,
							bigfiveFacet: conversationEvidence.bigfiveFacet,
							deviation: conversationEvidence.deviation,
							strength: conversationEvidence.strength,
							confidence: conversationEvidence.confidence,
							domain: conversationEvidence.domain,
							polarity: conversationEvidence.polarity,
							note: conversationEvidence.note,
							createdAt: conversationEvidence.createdAt,
						})
						.from(conversationEvidence)
						.innerJoin(
							assessmentSession,
							eq(conversationEvidence.assessmentSessionId, assessmentSession.id),
						)
						.where(eq(assessmentSession.userId, userId))
						.pipe(
							Effect.mapError(
								(error) =>
									new ConversationEvidenceError({
										message: `Failed to find conversation evidence by user: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					return rows.map((row) => ({
						id: row.id,
						sessionId: row.assessmentSessionId,
						messageId: row.assessmentMessageId,
						exchangeId: row.exchangeId as string,
						bigfiveFacet: row.bigfiveFacet as ConversationEvidenceRecord["bigfiveFacet"],
						deviation: row.deviation,
						strength: row.strength as ConversationEvidenceRecord["strength"],
						confidence: row.confidence as ConversationEvidenceRecord["confidence"],
						domain: row.domain as ConversationEvidenceRecord["domain"],
						polarity: row.polarity as ConversationEvidenceRecord["polarity"],
						note: row.note,
						createdAt: row.createdAt as Date,
					}));
				}),

			countByMessage: (messageId) =>
				Effect.gen(function* () {
					const result = yield* db
						.select({ count: sql<number>`cast(count(*) as int)` })
						.from(conversationEvidence)
						.where(eq(conversationEvidence.assessmentMessageId, messageId))
						.pipe(
							Effect.mapError(
								(error) =>
									new ConversationEvidenceError({
										message: `Failed to count conversation evidence: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					return result[0]?.count ?? 0;
				}),
		});
	}),
);
