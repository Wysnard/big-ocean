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
						score: input.score,
						confidence: input.confidence,
						domain: input.domain,
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
