/**
 * Get Portrait Status Use Case (Story 13.3, extended Story 32-6)
 *
 * Returns the current status of a full portrait for a session.
 * Implements lazy retry: if portrait is stale and retries remain, spawns new daemon.
 *
 * Story 32-6 adds: portrait reconciliation — if status is "none" and a
 * portrait_unlocked purchase event exists, auto-insert placeholder + fork daemon.
 *
 * Status is derived from portrait data, not stored:
 * - none: No portrait exists for this session
 * - generating: Portrait placeholder exists with content=NULL
 * - ready: Portrait has content
 * - failed: Portrait has retry_count >= 3
 */

import { LoggerRepository, PortraitRepository, type PortraitStatus } from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect } from "effect";
import { generateFullPortrait } from "./generate-full-portrait.use-case";
import { reconcilePortraitPurchase } from "./reconcile-portrait-purchase.use-case";

const STALENESS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Derive portrait status from portrait data.
 * Pure function, exported for unit testing.
 */
export const deriveStatus = (portrait: Portrait | null): PortraitStatus => {
	if (!portrait) return "none";
	if (portrait.content !== null) return "ready";
	if (portrait.retryCount >= 3) return "failed";
	return "generating";
};

/**
 * Check if portrait generation is stale (exceeded threshold without completing).
 * Pure function, exported for unit testing.
 */
export const isStale = (createdAt: Date): boolean =>
	Date.now() - createdAt.getTime() > STALENESS_THRESHOLD_MS;

export interface GetPortraitStatusInput {
	readonly sessionId: string;
	/** Optional userId for portrait reconciliation (Story 32-6) */
	readonly userId?: string;
}

export interface GetPortraitStatusOutput {
	readonly status: PortraitStatus;
	readonly portrait: Portrait | null;
}

/**
 * Get Portrait Status Use Case
 *
 * 1. Fetches full portrait by session ID
 * 2. Derives status from portrait data
 * 3. If status is "none" and userId provided, attempts reconciliation (Story 32-6)
 * 4. Implements lazy retry: if stale "generating" with retries left, spawns new daemon
 */
export const getPortraitStatus = (input: GetPortraitStatusInput) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;
		const logger = yield* LoggerRepository;

		let portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);
		let status = deriveStatus(portrait);

		// Story 32-6: Reconciliation — if no portrait but user has purchased, create placeholder
		if (status === "none" && input.userId) {
			const reconciliation = yield* reconcilePortraitPurchase({
				sessionId: input.sessionId,
				userId: input.userId,
			});

			if (reconciliation.reconciled) {
				// Re-fetch portrait after reconciliation created a placeholder
				portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);
				status = deriveStatus(portrait);
			}
		}

		// Eager trigger: if portrait placeholder exists but generation never started (retryCount 0, no content)
		// This covers the case where the webhook created a placeholder but couldn't spawn the Effect daemon.
		// Also handles lazy retry: if portrait is stale "generating" with retries remaining.
		if (status === "generating" && portrait && portrait.retryCount < 3) {
			const neverStarted = portrait.retryCount === 0 && !isStale(portrait.createdAt);
			const staleRetry = isStale(portrait.createdAt);
			if (neverStarted || staleRetry) {
				logger.info(
					neverStarted
						? "Triggering eager portrait generation"
						: "Triggering lazy retry for stale portrait",
					{
						portraitId: portrait.id,
						sessionId: input.sessionId,
						retryCount: portrait.retryCount,
						ageMs: Date.now() - portrait.createdAt.getTime(),
					},
				);
				yield* Effect.forkDaemon(
					generateFullPortrait({
						portraitId: portrait.id,
						sessionId: input.sessionId,
					}),
				);
			}
		}

		return { status, portrait } satisfies GetPortraitStatusOutput;
	});
