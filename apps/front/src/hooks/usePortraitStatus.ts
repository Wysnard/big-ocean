/**
 * Portrait Status Polling Hook (Story 13.3, enhanced Story 32-5)
 *
 * Polls GET /portrait/:sessionId/status every 2s while status is "generating".
 * Stops polling when status becomes "ready", "failed", or "none".
 *
 * When `waitingForUnlock` is true (after successful checkout), polls until
 * the full portrait becomes ready — even if status is still none
 * while the webhook is being processed.
 *
 * Uses Effect HttpApiClient for type-safe API calls via @workspace/contracts.
 */

import { useQuery } from "@tanstack/react-query";
import type { GetPortraitStatusResponse, PortraitStatus } from "@workspace/contracts";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

/** Polling interval in milliseconds */
export const PORTRAIT_POLL_INTERVAL_MS = 2000;

/**
 * Determine whether portrait status polling should continue.
 * Extracted as a pure function for testability.
 *
 * @returns polling interval in ms, or false to stop polling
 */
export function shouldPollPortraitStatus(
	queryStatus: "pending" | "error" | "success",
	dataStatus: PortraitStatus | undefined,
	waitingForUnlock: boolean,
): number | false {
	// Stop polling on error
	if (queryStatus === "error") return false;
	// Stop polling when portrait is ready
	if (dataStatus === "ready") return false;
	// Stop polling when portrait generation failed
	if (dataStatus === "failed") return false;
	// Keep polling if waiting for unlock (webhook processing)
	if (waitingForUnlock) return PORTRAIT_POLL_INTERVAL_MS;
	// Stop polling when no portrait exists
	if (dataStatus === "none") return false;
	// Poll every 2 seconds while generating
	return PORTRAIT_POLL_INTERVAL_MS;
}

interface UsePortraitStatusOptions {
	waitingForUnlock?: boolean;
}

export function usePortraitStatus(sessionId: string, options?: UsePortraitStatusOptions) {
	const { waitingForUnlock = false } = options ?? {};

	return useQuery<GetPortraitStatusResponse>({
		queryKey: ["portraitStatus", sessionId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.portrait.getPortraitStatus({ path: { sessionId } });
			}).pipe(Effect.runPromise),
		refetchInterval: (query) =>
			shouldPollPortraitStatus(query.state.status, query.state.data?.status, waitingForUnlock),
		enabled: !!sessionId,
	});
}
