/**
 * Get Portrait Status Use Case (Story 13.3, refactored for queue-based generation)
 *
 * Returns the current status of a full portrait for a session.
 * Purely read-only — never triggers generation (webhook is the only trigger).
 *
 * Status derived from portrait row + result-scoped purchase event:
 * - ready: Portrait has content
 * - failed: Portrait has failedAt
 * - generating: Purchase event exists for this result but no portrait row
 * - none: No purchase event for this result
 *
 * Story 36-3: Version detection — isLatestVersion flag.
 */

import {
	AssessmentResultRepository,
	ConversationRepository,
	hasPortraitForResult,
	isLatestVersion,
	PortraitRepository,
	type PortraitStatus,
	PurchaseEventRepository,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect } from "effect";

/**
 * Derive portrait status from portrait data and purchase state.
 * Pure function, exported for unit testing.
 */
export const deriveStatus = (portrait: Portrait | null, hasPurchase: boolean): PortraitStatus => {
	if (portrait?.content) return "ready";
	if (portrait?.failedAt) return "failed";
	if (hasPurchase && !portrait) return "generating";
	return "none";
};

export interface GetPortraitStatusInput {
	readonly sessionId: string;
	/** Optional userId for result-scoped purchase lookup and version detection */
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
 * 2. If userId provided, checks result-scoped purchase state for status derivation
 * 3. Derives status from portrait + purchase data
 * 4. Version detection (Story 36-3)
 */
export const getPortraitStatus = (input: GetPortraitStatusInput) =>
	Effect.gen(function* () {
		const portraitRepo = yield* PortraitRepository;

		const portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);

		// Check result-scoped purchase state for status derivation
		let hasPurchase = false;
		if (input.userId) {
			const purchaseRepo = yield* PurchaseEventRepository;
			const resultRepo = yield* AssessmentResultRepository;

			const result = yield* resultRepo
				.getBySessionId(input.sessionId)
				.pipe(Effect.catchAll(() => Effect.succeed(null)));

			if (result) {
				const events = yield* purchaseRepo.getEventsByUserId(input.userId);
				hasPurchase = hasPortraitForResult(events, result.id);
			}
		}

		const status = deriveStatus(portrait, hasPurchase);

		// Story 36-3: Derive-at-read version detection (fail-open: default to latest)
		const versionLatest = input.userId
			? yield* Effect.gen(function* () {
					const sessionRepo = yield* ConversationRepository;
					const resultRepo = yield* AssessmentResultRepository;

					const _session = yield* sessionRepo.getSession(input.sessionId);
					const resultForSession = yield* resultRepo.getBySessionId(input.sessionId);
					if (!resultForSession) return true;

					const latestResult = yield* resultRepo.getLatestByUserId(input.userId as string);
					return isLatestVersion(resultForSession.id, latestResult?.id ?? null);
				}).pipe(Effect.catchAllCause(() => Effect.succeed(true)))
			: true;

		return { status, portrait, isLatestVersion: versionLatest } satisfies GetPortraitStatusOutput;
	});
