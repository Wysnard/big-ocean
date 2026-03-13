/**
 * Mock: assessment-message.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-message.drizzle.repository')
 *
 * Story 23-3: Simplified to match new saveMessage signature (no userId/territoryId/observedEnergyLevel).
 */
import { AssessmentMessageRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const messages = new Map<
	string,
	Array<{
		id: string;
		sessionId: string;
		role: string;
		content: string;
		exchangeId?: string | null;
		createdAt: Date;
	}>
>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => messages.clear();

export const AssessmentMessageDrizzleRepositoryLive = Layer.succeed(
	AssessmentMessageRepository,
	AssessmentMessageRepository.of({
		saveMessage: (
			sessionId: string,
			role: "user" | "assistant",
			content: string,
			exchangeId?: string,
		) =>
			Effect.sync(() => {
				const id = `msg_${crypto.randomUUID().slice(0, 8)}`;
				const msg = {
					id,
					sessionId,
					role,
					content,
					exchangeId: exchangeId ?? null,
					createdAt: new Date(),
				};
				const existing = messages.get(sessionId) || [];
				existing.push(msg);
				messages.set(sessionId, existing);
				return msg;
			}),

		getMessages: (sessionId: string) => Effect.sync(() => messages.get(sessionId) || []),

		updateExchangeId: (messageId: string, exchangeId: string) =>
			Effect.sync(() => {
				for (const [, sessionMessages] of messages) {
					const msg = sessionMessages.find((m) => m.id === messageId);
					if (msg) {
						msg.exchangeId = exchangeId;
						return;
					}
				}
			}),

		getMessageCount: (sessionId: string) => Effect.sync(() => (messages.get(sessionId) || []).length),
	}),
);
