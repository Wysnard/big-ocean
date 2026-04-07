/**
 * Generate QR Token Use-Case (Story 34-1)
 *
 * Generates a new QR token for relationship analysis initiation.
 * Expires any existing active token for the user before generating.
 */

import {
	AppConfig,
	AssessmentNotCompletedError,
	ConversationRepository,
	QrTokenRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export const generateQrToken = (userId: string) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;
		const sessionRepo = yield* ConversationRepository;
		const config = yield* AppConfig;

		// 1. Check that user has completed their assessment
		const sessions = yield* sessionRepo.getSessionsByUserId(userId);
		const hasCompleted = sessions.some((s) => s.status === "completed");
		if (!hasCompleted) {
			return yield* Effect.fail(
				new AssessmentNotCompletedError({
					message: "You must complete your assessment before inviting someone",
				}),
			);
		}

		// 2. Expire any existing active token for this user
		const existing = yield* qrTokenRepo.getActiveByUserId(userId);
		if (existing) {
			yield* qrTokenRepo.expireToken(existing.token);
		}

		// 3. Generate new token
		const token = yield* qrTokenRepo.generate(userId);

		// 4. Build share URL
		const shareUrl = `${config.frontendUrl}/relationship/qr/${token.token}`;

		return { token: token.token, shareUrl, expiresAt: token.expiresAt };
	});
