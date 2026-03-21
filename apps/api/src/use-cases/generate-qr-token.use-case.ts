/**
 * Generate QR Token Use-Case (Story 34-1)
 *
 * Generates a new QR token for relationship analysis initiation.
 * Expires any existing active token for the user before generating.
 */

import { AppConfig, QrTokenRepository } from "@workspace/domain";
import { Effect } from "effect";

export const generateQrToken = (userId: string) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;
		const config = yield* AppConfig;

		// 1. Expire any existing active token for this user
		const existing = yield* qrTokenRepo.getActiveByUserId(userId);
		if (existing) {
			yield* qrTokenRepo.expireToken(existing.token);
		}

		// 2. Generate new token
		const token = yield* qrTokenRepo.generate(userId);

		// 3. Build share URL
		const shareUrl = `${config.frontendUrl}/relationship/qr/${token.token}`;

		return { token: token.token, shareUrl, expiresAt: token.expiresAt };
	});
