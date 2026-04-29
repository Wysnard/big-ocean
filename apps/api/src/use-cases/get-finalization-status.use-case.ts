/**
 * Get Finalization Status Use Case (Story 11.1)
 *
 * Returns the current finalization progress for a session.
 * Used by the frontend to poll during the wait screen.
 */

import { Effect } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";

export interface GetFinalizationStatusInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
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
		const { session } = yield* requireAuthenticatedConversation({
			sessionId: input.sessionId,
			authenticatedUserId: input.authenticatedUserId,
			policy: "owned-session",
		});

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
