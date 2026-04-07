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
import type { EvidencePolarity, EvidenceStrength } from "@workspace/domain/types/evidence";
import { deriveDeviation } from "@workspace/domain/utils/derive-deviation";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { conversation, conversationEvidence } from "../db/drizzle/schema";

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
								conversationId: r.sessionId,
								messageId: r.messageId,
								exchangeId: r.exchangeId,
								bigfiveFacet: r.bigfiveFacet,
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
						.where(eq(conversationEvidence.conversationId, sessionId))
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
						sessionId: row.conversationId,
						messageId: row.messageId,
						exchangeId: row.exchangeId as string,
						bigfiveFacet: row.bigfiveFacet as ConversationEvidenceRecord["bigfiveFacet"],
						deviation: deriveDeviation(
							row.polarity as EvidencePolarity,
							row.strength as EvidenceStrength,
						),
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
							conversationId: conversationEvidence.conversationId,
							messageId: conversationEvidence.messageId,
							exchangeId: conversationEvidence.exchangeId,
							bigfiveFacet: conversationEvidence.bigfiveFacet,
							strength: conversationEvidence.strength,
							confidence: conversationEvidence.confidence,
							domain: conversationEvidence.domain,
							polarity: conversationEvidence.polarity,
							note: conversationEvidence.note,
							createdAt: conversationEvidence.createdAt,
						})
						.from(conversationEvidence)
						.innerJoin(conversation, eq(conversationEvidence.conversationId, conversation.id))
						.where(eq(conversation.userId, userId))
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
						sessionId: row.conversationId,
						messageId: row.messageId,
						exchangeId: row.exchangeId as string,
						bigfiveFacet: row.bigfiveFacet as ConversationEvidenceRecord["bigfiveFacet"],
						deviation: deriveDeviation(
							row.polarity as EvidencePolarity,
							row.strength as EvidenceStrength,
						),
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
						.where(eq(conversationEvidence.messageId, messageId))
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
