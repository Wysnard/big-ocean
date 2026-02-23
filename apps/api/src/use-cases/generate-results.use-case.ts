/**
 * Generate Results Use Case (Story 11.1)
 *
 * Triggers the finalization pipeline for a completed assessment.
 * Implements two-tier idempotency:
 *   Tier 1: Already completed → return immediately
 *   Tier 2: Lock contention → return current progress (not an error)
 *
 * Phase 1 placeholder: Transitions through analyzing → generating_portrait → completed
 * synchronously. Stories 11.2-11.5 will replace with real async work.
 */

import {
	AssessmentSessionRepository,
	LoggerRepository,
	SessionNotFinalizing,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";

export interface GenerateResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string | null;
}

export type GenerateResultsStatus = "analyzing" | "generating_portrait" | "completed";

export const generateResults = (input: GenerateResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const logger = yield* LoggerRepository;

		// 1. Validate session exists and user owns it
		const session = yield* sessionRepo.getSession(input.sessionId);

		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 2. Idempotency tier 1: already completed
		if (session.status === "completed") {
			logger.info("Generate results: session already completed (idempotency tier 1)", {
				sessionId: input.sessionId,
			});
			return { status: "completed" as GenerateResultsStatus };
		}

		// 3. Validate session is in finalizing status
		if (session.status !== "finalizing") {
			return yield* Effect.fail(
				new SessionNotFinalizing({
					sessionId: input.sessionId,
					currentStatus: session.status,
					message: `Session is '${session.status}', expected 'finalizing'`,
				}),
			);
		}

		// 4. Idempotency tier 2: try to acquire lock
		// Note: catchTag("ConcurrentMessageError") is an intentional exception to the Error Propagation Rule.
		// Per AC#7, concurrent duplicates must return current progress (HTTP 200), not an error.
		const lockAcquired = yield* sessionRepo.acquireSessionLock(input.sessionId).pipe(
			Effect.map(() => true),
			Effect.catchTag("ConcurrentMessageError", () => Effect.succeed(false)),
		);

		if (!lockAcquired) {
			logger.info(
				"Generate results: concurrent request, returning current progress (idempotency tier 2)",
				{
					sessionId: input.sessionId,
				},
			);
			const currentProgress = (session.finalizationProgress ?? "analyzing") as GenerateResultsStatus;
			return { status: currentProgress };
		}

		// Lock acquired — run the pipeline with guaranteed lock release
		return yield* Effect.gen(function* () {
			// 5. Update progress to "analyzing"
			yield* sessionRepo.updateSession(input.sessionId, { finalizationProgress: "analyzing" });
			logger.info("Phase 1: FinAnalyzer — not yet implemented (Story 11.2)", {
				sessionId: input.sessionId,
			});

			// 6. Update progress to "generating_portrait"
			yield* sessionRepo.updateSession(input.sessionId, {
				finalizationProgress: "generating_portrait",
			});
			logger.info("Phase 2: Scoring + portrait — not yet implemented (Stories 11.3-11.5)", {
				sessionId: input.sessionId,
			});

			// 7. Mark completed
			yield* sessionRepo.updateSession(input.sessionId, {
				status: "completed",
				finalizationProgress: "completed",
			});

			logger.info("Generate results: finalization complete", {
				sessionId: input.sessionId,
			});

			return { status: "completed" as GenerateResultsStatus };
		}).pipe(Effect.ensuring(sessionRepo.releaseSessionLock(input.sessionId).pipe(Effect.orDie)));
	});
