/**
 * Get Portrait Status Use Case (Story 13.3)
 *
 * Returns the current status of a full portrait for a session.
 * Implements lazy retry: if portrait is stale and retries remain, spawns new daemon.
 *
 * Status is derived from portrait data, not stored:
 * - none: No portrait exists for this session
 * - generating: Portrait placeholder exists with content=NULL
 * - ready: Portrait has content
 * - failed: Portrait has retry_count >= 3
 */

import {
	AssessmentResultRepository,
	LoggerRepository,
	PortraitRepository,
	type PortraitStatus,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect } from "effect";
import { generateFullPortrait } from "./generate-full-portrait.use-case";

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

export interface TeaserData {
	readonly content: string;
}

export interface GetPortraitStatusOutput {
	readonly status: PortraitStatus;
	readonly portrait: Portrait | null;
	readonly teaser: TeaserData | null;
}

/**
 * Get Portrait Status Use Case
 *
 * 1. Fetches full portrait by session ID
 * 2. Derives status from portrait data
 * 3. Implements lazy retry: if stale "generating" with retries left, spawns new daemon
 */
export const getPortraitStatus = (sessionId: string) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;
		const assessmentResultRepo = yield* AssessmentResultRepository;
		const logger = yield* LoggerRepository;

		const portrait = yield* portraitRepo.getFullPortraitBySessionId(sessionId);
		const status = deriveStatus(portrait);

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
						sessionId,
						retryCount: portrait.retryCount,
						ageMs: Date.now() - portrait.createdAt.getTime(),
					},
				);
				yield* Effect.forkDaemon(
					generateFullPortrait({
						portraitId: portrait.id,
						sessionId,
					}),
				);
			}
		}

		// Fetch teaser portrait data (Story 12.3)
		let teaser: TeaserData | null = null;
		const existingResult = yield* assessmentResultRepo
			.getBySessionId(sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));
		if (existingResult) {
			const teaserPortrait = yield* portraitRepo.getByResultIdAndTier(existingResult.id, "teaser");
			if (teaserPortrait?.content) {
				teaser = {
					content: teaserPortrait.content,
				};
			}
		}

		return { status, portrait, teaser } satisfies GetPortraitStatusOutput;
	});
