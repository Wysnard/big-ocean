/**
 * Get Finalization Status Use Case (Story 11.1)
 *
 * Returns the current finalization progress for a session.
 * Used by the frontend to poll during the wait screen.
 */

import { AssessmentSessionRepository, SessionNotFound } from "@workspace/domain";
import { Effect } from "effect";

export interface GetFinalizationStatusInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string | null;
}

export type FinalizationStatusResult = {
	readonly status: "analyzing" | "generating_portrait" | "completed";
	readonly progress: number;
};

const PROGRESS_MAP: Record<string, number> = {
	analyzing: 33,
	generating_portrait: 66,
	completed: 100,
};

export const getFinalizationStatus = (input: GetFinalizationStatusInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;

		const session = yield* sessionRepo.getSession(input.sessionId);

		// Ownership guard
		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// If session is completed, always return completed
		if (session.status === "completed") {
			return { status: "completed" as const, progress: 100 };
		}

		const status = (session.finalizationProgress ?? "analyzing") as
			| "analyzing"
			| "generating_portrait"
			| "completed";
		const progress = PROGRESS_MAP[status] ?? 0;

		return { status, progress };
	});
