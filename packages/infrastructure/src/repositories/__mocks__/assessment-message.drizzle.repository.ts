/**
 * Mock: assessment-message.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-message.drizzle.repository')
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
		userId?: string;
		targetDomain?: string;
		targetBigfiveFacet?: string;
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
			userId?: string,
			targetDomain?: string,
			targetBigfiveFacet?: string,
		) =>
			Effect.sync(() => {
				const id = `msg_${crypto.randomUUID().slice(0, 8)}`;
				const msg = {
					id,
					sessionId,
					role,
					content,
					userId,
					targetDomain,
					targetBigfiveFacet,
					createdAt: new Date(),
				};
				const existing = messages.get(sessionId) || [];
				existing.push(msg);
				messages.set(sessionId, existing);
				return msg;
			}),

		getMessages: (sessionId: string) => Effect.sync(() => messages.get(sessionId) || []),

		getMessageCount: (sessionId: string) => Effect.sync(() => (messages.get(sessionId) || []).length),
	}),
);
