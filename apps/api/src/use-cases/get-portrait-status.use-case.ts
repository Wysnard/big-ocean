/**
 * Get Portrait Status Use Case (Story 13.3, refactored for queue-based generation)
 *
 * Returns the current status of a full portrait for a session.
 * Purely read-only — does not enqueue generation (Assessment Finalization + retry use cases own triggers).
 *
 * Status derived from portrait row + completed assessment result (ADR-7):
 * - ready: Portrait has content
 * - failed: Portrait has failedAt
 * - generating: Result stage is completed but no portrait row yet (worker in flight or pending)
 * - none: No completed result yet, or completed but terminal state not applicable
 *
 * Story 36-3: Version detection — isLatestVersion flag.
 */

import {
	AssessmentResultRepository,
	isLatestVersion,
	PortraitRepository,
	type PortraitStatus,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect } from "effect";

export interface DerivePortraitStatusInput {
	readonly portrait: Portrait | null;
	/** From assessment_results.stage for this session; portrait queue runs after completion. */
	readonly assessmentResultStage: string | null | undefined;
}

/**
 * Derive portrait status from portrait row + assessment result stage.
 * Exported for unit testing.
 */
export const deriveStatus = (input: DerivePortraitStatusInput): PortraitStatus => {
	const { portrait, assessmentResultStage } = input;
	if (portrait?.content) return "ready";
	if (portrait?.failedAt) return "failed";
	if (assessmentResultStage === "completed" && portrait === null) return "generating";
	return "none";
};

export interface GetPortraitStatusInput {
	readonly sessionId: string;
	/** Optional userId for latest-result version detection */
	readonly userId?: string;
}

export interface GetPortraitStatusOutput {
	readonly status: PortraitStatus;
	readonly portrait: Portrait | null;
	readonly isLatestVersion: boolean;
}

/**
 * Get Portrait Status Use Case
 *
 * 1. Fetches full portrait by session ID
 * 2. Loads assessment result to determine whether a portrait is expected (stage=completed)
 * 3. Derives status (no purchase-event coupling)
 * 4. Version detection (Story 36-3)
 */
export const getPortraitStatus = (input: GetPortraitStatusInput) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;
		const resultRepo = yield* AssessmentResultRepository;

		const portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);

		const assessmentResult = yield* resultRepo
			.getBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));

		const status = deriveStatus({
			portrait,
			assessmentResultStage: assessmentResult?.stage,
		});

		const versionLatest =
			input.userId && assessmentResult
				? yield* resultRepo.getLatestByUserId(input.userId).pipe(
						Effect.map((latest) => isLatestVersion(assessmentResult.id, latest?.id ?? null)),
						Effect.catchAllCause(() => Effect.succeed(true)),
					)
				: true;

		return { status, portrait, isLatestVersion: versionLatest } satisfies GetPortraitStatusOutput;
	});
