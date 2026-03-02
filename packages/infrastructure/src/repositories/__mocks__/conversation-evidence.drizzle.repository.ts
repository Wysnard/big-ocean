/**
 * Mock: conversation-evidence.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/conversation-evidence.drizzle.repository')
 */
import {
	type ConversationEvidenceInput,
	type ConversationEvidenceRecord,
	ConversationEvidenceRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const records: ConversationEvidenceRecord[] = [];

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => {
	records.length = 0;
};

/** Read-only access for test assertions */
export const _getMockRecords = () => [...records];

/** Seed pre-existing evidence records for test setup */
export const _seedEvidence = (seed: ConversationEvidenceRecord[]) => {
	records.push(...seed);
};

export const ConversationEvidenceDrizzleRepositoryLive = Layer.succeed(
	ConversationEvidenceRepository,
	ConversationEvidenceRepository.of({
		save: (inputs: ConversationEvidenceInput[]) =>
			Effect.sync(() => {
				for (const input of inputs) {
					records.push({
						id: crypto.randomUUID(),
						sessionId: input.sessionId,
						messageId: input.messageId,
						bigfiveFacet: input.bigfiveFacet,
						deviation: input.deviation,
						strength: input.strength,
						confidence: input.confidence,
						domain: input.domain,
						note: input.note,
						createdAt: new Date(),
					});
				}
			}),

		findBySession: (sessionId: string) =>
			Effect.sync(() => records.filter((r) => r.sessionId === sessionId)),

		countByMessage: (messageId: string) =>
			Effect.sync(() => records.filter((r) => r.messageId === messageId).length),
	}),
);
