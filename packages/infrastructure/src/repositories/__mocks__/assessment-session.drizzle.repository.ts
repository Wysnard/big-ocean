/**
 * Mock: assessment-session.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/assessment-session.drizzle.repository')
 */
import { AssessmentSessionRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const sessions = new Map<string, Record<string, unknown>>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => sessions.clear();

export const AssessmentSessionDrizzleRepositoryLive = Layer.succeed(
	AssessmentSessionRepository,
	AssessmentSessionRepository.of({
		getActiveSessionByUserId: (userId: string) =>
			Effect.sync(() => {
				for (const session of sessions.values()) {
					if (session.userId === userId && session.status === "active") {
						return session;
					}
				}
				return null;
			}),

		createSession: (userId?: string) =>
			Effect.sync(() => {
				const sessionId = `session_${crypto.randomUUID().slice(0, 8)}`;
				const session = {
					id: sessionId,
					sessionId,
					userId,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active" as const,
					messageCount: 0,
					personalDescription: null,
				};
				sessions.set(sessionId, session);
				// Return full session (superset of { sessionId }) for mock consumers
				return session;
			}),

		getSession: (sessionId: string) =>
			Effect.sync(() => {
				const session = sessions.get(sessionId);
				if (!session) {
					return {
						id: sessionId,
						sessionId,
						userId: undefined,
						createdAt: new Date(),
						updatedAt: new Date(),
						status: "active" as const,
						messageCount: 0,
						personalDescription: null,
					};
				}
				return session;
			}),

		updateSession: (sessionId: string, partial: Record<string, unknown>) =>
			Effect.sync(() => {
				const existing = sessions.get(sessionId) || {
					id: sessionId,
					sessionId,
					userId: undefined,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active" as const,
					messageCount: 0,
					personalDescription: null,
				};
				const updated = { ...existing, ...partial };
				sessions.set(sessionId, updated);
				return updated;
			}),

		findSessionByUserId: (userId: string) =>
			Effect.sync(() => {
				const userSessions: Array<{
					id: string;
					createdAt: Date;
					updatedAt: Date;
					status: string;
					messageCount: number;
					oceanCode5: string | null;
					archetypeName: string | null;
				}> = [];

				for (const session of sessions.values()) {
					if (session.userId === userId) {
						userSessions.push({
							id: session.id as string,
							createdAt: session.createdAt as Date,
							updatedAt: session.updatedAt as Date,
							status: session.status as string,
							messageCount: (session.messageCount as number) ?? 0,
							oceanCode5: (session.oceanCode5 as string) ?? null,
							archetypeName: (session.archetypeName as string) ?? null,
						});
					}
				}

				// Sort by createdAt descending (newest first), return first or null
				userSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				return userSessions[0] ?? null;
			}),

		getSessionsByUserId: (userId: string) =>
			Effect.sync(() => {
				const userSessions: Array<{
					id: string;
					createdAt: Date;
					updatedAt: Date;
					status: string;
					messageCount: number;
					oceanCode5: string | null;
					archetypeName: string | null;
				}> = [];

				for (const session of sessions.values()) {
					if (session.userId === userId) {
						userSessions.push({
							id: session.id as string,
							createdAt: session.createdAt as Date,
							updatedAt: session.updatedAt as Date,
							status: session.status as string,
							messageCount: (session.messageCount as number) ?? 0,
							oceanCode5: (session.oceanCode5 as string) ?? null,
							archetypeName: (session.archetypeName as string) ?? null,
						});
					}
				}

				// Sort by createdAt descending (newest first)
				return userSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			}),
	}),
);
