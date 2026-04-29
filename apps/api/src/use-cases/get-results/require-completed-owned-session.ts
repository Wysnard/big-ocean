import { ConversationRepository, SessionNotCompleted, SessionNotFound } from "@workspace/domain";
import { Effect } from "effect";

export interface RequireCompletedOwnedSessionInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
}

/**
 * Loads the session and requires it to be completed and owned by the authenticated user.
 */
export const requireCompletedOwnedSession = (input: RequireCompletedOwnedSessionInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const session = yield* sessionRepo.getSession(input.sessionId);

		if (session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		if (session.status !== "completed") {
			return yield* Effect.fail(
				new SessionNotCompleted({
					sessionId: input.sessionId,
					currentStatus: session.status,
					message: `Session is '${session.status}', results are not ready yet`,
				}),
			);
		}

		return session;
	});
