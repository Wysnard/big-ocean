/**
 * Retry Portrait Use Case (Story 32-6, refactored for queue-based generation)
 *
 * Manual retry for failed portrait generation.
 * Deletes the failed portrait row and queues a new generation job.
 *
 * Validates session ownership before allowing retry.
 */

import { randomUUID } from "node:crypto";
import {
	AssessmentResultRepository,
	LoggerRepository,
	PortraitJobOfferRepository,
	PortraitJobQueue,
	PortraitRepository,
	type PortraitStatus,
} from "@workspace/domain";
import { Effect, Queue } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";
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
		const resultRepo = yield* AssessmentResultRepository;
		const portraitRepo = yield* PortraitRepository;
		const portraitJobOffers = yield* PortraitJobOfferRepository;
		const queue = yield* PortraitJobQueue;
		const logger = yield* LoggerRepository;

		yield* requireAuthenticatedConversation({
			sessionId: input.sessionId,
			authenticatedUserId: input.userId,
			policy: "portrait-retry",
		});

		const portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);
		const assessmentResult = yield* resultRepo
			.getBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));

		const currentStatus = deriveStatus({
			portrait,
			assessmentResultStage: assessmentResult?.stage,
		});

		if (currentStatus !== "failed" || !portrait) {
			return { status: currentStatus } satisfies RetryPortraitOutput;
		}

		const result = assessmentResult;

		if (!result) {
			return { status: currentStatus } satisfies RetryPortraitOutput;
		}

		// 4. Delete the failed portrait row
		logger.info("Manual portrait retry: deleting failed portrait and queuing regeneration", {
			portraitId: portrait.id,
			sessionId: input.sessionId,
		});

		yield* portraitRepo.deleteByResultIdAndTier(result.id, "full");

		// Clear any prior manual retry claims so a new retry can enqueue.
		yield* portraitJobOffers.deleteOffersByJobKeyPrefix(input.sessionId, "retry_manual:");

		// 5. Queue new generation job (durable at-most-once enqueue)
		const jobKey = `retry_manual:${randomUUID()}`;
		const claimed = yield* portraitJobOffers.claimOffer({
			sessionId: input.sessionId,
			userId: input.userId,
			jobKey,
		});

		if (claimed) {
			yield* Queue.offer(queue, { sessionId: input.sessionId, userId: input.userId });
		} else {
			logger.warn("Manual portrait retry: skipped duplicate portrait job enqueue", {
				sessionId: input.sessionId,
				userId: input.userId,
				jobKey,
			});
		}

		return { status: "generating" as PortraitStatus } satisfies RetryPortraitOutput;
	});
