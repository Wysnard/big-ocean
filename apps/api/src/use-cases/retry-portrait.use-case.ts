/**
 * Retry Portrait Use Case (Story 32-6, refactored for queue-based generation)
 *
 * Manual retry for failed portrait generation.
 * Deletes the failed portrait row and queues a new generation job.
 *
 * Validates session ownership before allowing retry.
 */

import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	PortraitJobQueue,
	PortraitRepository,
	type PortraitStatus,
	SessionNotFound,
} from "@workspace/domain";
import { Effect, Queue } from "effect";
import { deriveStatus } from "./get-portrait-status.use-case";

export interface RetryPortraitInput {
	readonly sessionId: string;
	readonly userId: string;
}

export interface RetryPortraitOutput {
	readonly status: PortraitStatus;
}

export const retryPortrait = (input: RetryPortraitInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const portraitRepo = yield* PortraitRepository;
		const queue = yield* PortraitJobQueue;
		const logger = yield* LoggerRepository;

		// 1. Validate session ownership
		const session = yield* sessionRepo.getSession(input.sessionId);
		if (session.userId !== input.userId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 2. Get current portrait and check it's failed
		const portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);
		const currentStatus = deriveStatus(portrait, true);

		if (currentStatus !== "failed" || !portrait) {
			return { status: currentStatus } satisfies RetryPortraitOutput;
		}

		// 3. Get assessment result to find the result ID for deletion
		const result = yield* resultRepo
			.getBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));
		if (!result) {
			return { status: currentStatus } satisfies RetryPortraitOutput;
		}

		// 4. Delete the failed portrait row
		logger.info("Manual portrait retry: deleting failed portrait and queuing regeneration", {
			portraitId: portrait.id,
			sessionId: input.sessionId,
		});

		yield* portraitRepo.deleteByResultIdAndTier(result.id, "full");

		// 5. Queue new generation job
		yield* Queue.offer(queue, { sessionId: input.sessionId, userId: input.userId });

		return { status: "generating" as PortraitStatus } satisfies RetryPortraitOutput;
	});
