/**
 * Retry Portrait Use Case (Story 32-6)
 *
 * Manual retry for failed portrait generation.
 * Resets retry count to 0, allowing lazy retry mechanism to re-trigger.
 *
 * Validates session ownership before allowing retry.
 */

import {
	AssessmentSessionRepository,
	LoggerRepository,
	PortraitRepository,
	type PortraitStatus,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";
import { generateFullPortrait } from "./generate-full-portrait.use-case";
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
		const portraitRepo = yield* PortraitRepository;
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

		// 2. Get current portrait
		const portrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);
		const currentStatus = deriveStatus(portrait);

		// 3. Only retry if portrait is failed
		if (currentStatus !== "failed" || !portrait) {
			return { status: currentStatus } satisfies RetryPortraitOutput;
		}

		// 4. Reset retry count and fork new daemon
		logger.info("Manual portrait retry: resetting retry count and spawning generation", {
			portraitId: portrait.id,
			sessionId: input.sessionId,
			previousRetryCount: portrait.retryCount,
		});

		yield* portraitRepo.resetRetryCount(portrait.id).pipe(
			Effect.catchTag("PortraitNotFoundError", () => {
				// Portrait was deleted between check and reset — log and continue
				logger.warn("Portrait not found during retry reset, may have been deleted", {
					portraitId: portrait.id,
				});
				return Effect.succeed(portrait);
			}),
		);

		yield* Effect.forkDaemon(
			generateFullPortrait({
				portraitId: portrait.id,
				sessionId: input.sessionId,
			}),
		);

		return { status: "generating" as PortraitStatus } satisfies RetryPortraitOutput;
	});
