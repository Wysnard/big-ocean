/**
 * Portrait Generation Worker
 *
 * Long-lived Effect fiber that takes jobs from PortraitJobQueue
 * and runs generateFullPortrait for each one.
 *
 * Each job is isolated: a failure in one job does not kill the worker.
 */

import type { PortraitJob } from "@workspace/domain";
import { LoggerRepository, PortraitJobQueue } from "@workspace/domain";
import { Cause, Effect, Queue } from "effect";
import { generateFullPortrait } from "../use-cases/generate-full-portrait.use-case";

export const portraitGenerationWorker = Effect.gen(function* () {
	const queue = yield* PortraitJobQueue;
	const logger = yield* LoggerRepository;

	logger.info("Portrait generation worker started");

	yield* Effect.forever(
		Effect.gen(function* () {
			const job: PortraitJob = yield* Queue.take(queue);

			logger.info("Portrait worker: processing job", {
				sessionId: job.sessionId,
				userId: job.userId,
			});

			yield* generateFullPortrait({ sessionId: job.sessionId }).pipe(
				Effect.catchAllCause((cause) =>
					Effect.sync(() =>
						logger.error(`Portrait worker: job failed for session ${job.sessionId}`, {
							sessionId: job.sessionId,
							cause: Cause.pretty(cause),
						}),
					),
				),
			);
		}),
	);
});
