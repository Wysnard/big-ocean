/**
 * Mock: conversation.drizzle.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/conversation.drizzle.repository')
 */
import { DatabaseError } from "@workspace/contracts/errors";
import { ConversationRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const sessions = new Map<string, Record<string, unknown>>();

/** Clear in-memory state between tests. Call in `beforeEach` or `afterEach`. */
export const _resetMockState = () => sessions.clear();

export const ConversationDrizzleRepositoryLive = Layer.succeed(
	ConversationRepository,
	ConversationRepository.of({
		getActiveSessionByUserId: (userId: string) =>
			Effect.sync(() => {
				for (const session of sessions.values()) {
					if (session.userId === userId && session.status === "active") {
						return session;
					}
				}
				return null;
			}),

		createSession: (userId: string) =>
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
				};
				sessions.set(sessionId, session);
				// Return full session (superset of { sessionId }) for mock consumers
				return session;
			}),

		getSession: (sessionId: string) =>
			Effect.gen(function* () {
				const session = sessions.get(sessionId);
				if (!session) {
					return yield* Effect.fail({
						_tag: "SessionNotFound",
						sessionId,
						message: `Session '${sessionId}' not found`,
					});
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
				}> = [];

				for (const session of sessions.values()) {
					if (session.userId === userId) {
						userSessions.push({
							id: session.id as string,
							createdAt: session.createdAt as Date,
							updatedAt: session.updatedAt as Date,
							status: session.status as string,
							messageCount: (session.messageCount as number) ?? 0,
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
				}> = [];

				for (const session of sessions.values()) {
					if (session.userId === userId) {
						userSessions.push({
							id: session.id as string,
							createdAt: session.createdAt as Date,
							updatedAt: session.updatedAt as Date,
							status: session.status as string,
							messageCount: (session.messageCount as number) ?? 0,
						});
					}
				}

				// Sort by createdAt descending (newest first)
				return userSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			}),

		incrementMessageCount: (sessionId: string) =>
			Effect.gen(function* () {
				const session = sessions.get(sessionId);
				if (!session) {
					return yield* Effect.fail({
						_tag: "DatabaseError",
						message: "Failed to increment message count",
					});
				}
				const newCount = ((session.messageCount as number) ?? 0) + 1;
				sessions.set(sessionId, { ...session, messageCount: newCount, updatedAt: new Date() });
				return newCount;
			}),

		acquireSessionLock: (_sessionId: string) => Effect.void,

		releaseSessionLock: (_sessionId: string) => Effect.void,

		findDropOffSessions: (_thresholdHours: number) =>
			Effect.sync(() => {
				const results: Array<{
					sessionId: string;
					userId: string;
					userEmail: string;
					userName: string;
					updatedAt: Date;
				}> = [];

				for (const session of sessions.values()) {
					if (session.status === "active" && session.userId && !session.dropOffEmailSentAt) {
						results.push({
							sessionId: session.id as string,
							userId: session.userId as string,
							userEmail: (session.userEmail as string) ?? "test@example.com",
							userName: (session.userName as string) ?? "Test User",
							updatedAt: session.updatedAt as Date,
						});
					}
				}

				return results;
			}),

		markDropOffEmailSent: (sessionId: string) =>
			Effect.sync(() => {
				const session = sessions.get(sessionId);
				if (session) {
					sessions.set(sessionId, { ...session, dropOffEmailSentAt: new Date() });
				}
			}),

		createExtensionSession: (userId: string, parentConversationId: string) =>
			Effect.sync(() => {
				const sessionId = `session_${crypto.randomUUID().slice(0, 8)}`;
				const session = {
					id: sessionId,
					userId,
					parentConversationId,
					conversationType: "extension" as const,
					createdAt: new Date(),
					updatedAt: new Date(),
					status: "active" as const,
					finalizationProgress: null,
					messageCount: 0,
				};
				sessions.set(sessionId, session);
				return { sessionId };
			}),

		createExtensionSessionWithInitialTurn: (
			userId: string,
			parentConversationId: string,
			greetingContents: readonly string[],
		) =>
			greetingContents.length === 0
				? Effect.fail(
						new DatabaseError({
							message: "greetingContents must be non-empty",
						}),
					)
				: Effect.sync(() => {
						const sessionId = `session_${crypto.randomUUID().slice(0, 8)}`;
						const now = new Date();
						const session = {
							id: sessionId,
							userId,
							parentConversationId,
							conversationType: "extension" as const,
							createdAt: now,
							updatedAt: now,
							status: "active" as const,
							finalizationProgress: null,
							messageCount: 0,
						};
						sessions.set(sessionId, session);
						const messages = greetingContents.map((content) => ({
							role: "assistant" as const,
							content,
							createdAt: now,
						}));
						return { sessionId, messages };
					}),

		findCompletedSessionWithoutChild: (userId: string) =>
			Effect.sync(() => {
				// Collect all parentConversationId values from child sessions
				const childParentIds = new Set<string>();
				for (const session of sessions.values()) {
					if (session.parentConversationId) {
						childParentIds.add(session.parentConversationId as string);
					}
				}

				const candidates: Array<Record<string, unknown>> = [];
				for (const session of sessions.values()) {
					if (
						session.userId === userId &&
						session.status === "completed" &&
						!childParentIds.has(session.id as string)
					) {
						candidates.push(session);
					}
				}

				// Sort by createdAt descending, return first
				candidates.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());

				const best = candidates[0];
				if (!best) return null;

				return {
					id: best.id as string,
					userId: best.userId as string,
					createdAt: best.createdAt as Date,
					updatedAt: best.updatedAt as Date,
					status: best.status as string,
					finalizationProgress: (best.finalizationProgress as string) ?? null,
					messageCount: (best.messageCount as number) ?? 0,
					parentConversationId: (best.parentConversationId as string) ?? null,
				};
			}),

		hasExtensionSession: (parentConversationId: string) =>
			Effect.sync(() => {
				for (const session of sessions.values()) {
					if (session.parentConversationId === parentConversationId) {
						return true;
					}
				}
				return false;
			}),

		findExtensionSession: (parentConversationId: string) =>
			Effect.sync(() => {
				for (const session of sessions.values()) {
					if (session.parentConversationId === parentConversationId) {
						return {
							id: session.id as string,
							userId: session.userId as string,
							createdAt: session.createdAt as Date,
							updatedAt: session.updatedAt as Date,
							status: session.status as string,
							finalizationProgress: (session.finalizationProgress as string) ?? null,
							messageCount: (session.messageCount as number) ?? 0,
							parentConversationId: (session.parentConversationId as string) ?? null,
						};
					}
				}
				return null;
			}),

		countCompletedExtensionSessionsExcluding: (userId: string, excludeSessionId: string) =>
			Effect.sync(() => {
				let n = 0;
				for (const session of sessions.values()) {
					if (
						session.userId === userId &&
						session.status === "completed" &&
						session.parentConversationId != null &&
						session.id !== excludeSessionId &&
						(session as { conversationType?: string }).conversationType === "extension"
					) {
						n += 1;
					}
				}
				return n;
			}),

		findCheckInEligibleSessions: (_thresholdDays: number) =>
			Effect.sync(() => {
				const results: Array<{
					sessionId: string;
					userId: string;
					userEmail: string;
					userName: string;
					updatedAt: Date;
				}> = [];

				for (const session of sessions.values()) {
					if (session.status === "completed" && session.userId && !session.checkInEmailSentAt) {
						results.push({
							sessionId: session.id as string,
							userId: session.userId as string,
							userEmail: (session.userEmail as string) ?? "test@example.com",
							userName: (session.userName as string) ?? "Test User",
							updatedAt: session.updatedAt as Date,
						});
					}
				}

				return results;
			}),

		markCheckInEmailSent: (sessionId: string) =>
			Effect.sync(() => {
				const session = sessions.get(sessionId);
				if (session) {
					sessions.set(sessionId, { ...session, checkInEmailSentAt: new Date() });
				}
			}),
	}),
);
