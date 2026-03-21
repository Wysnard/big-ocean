/**
 * Refuse QR Invitation Use-Case (Story 34-1)
 *
 * Validates QR token exists and is active. Token stays active after refusal
 * (can be scanned by someone else). No notification to initiator.
 */

import { QrTokenRepository, QrTokenExpiredError } from "@workspace/domain";
import { Effect } from "effect";

export const refuseQrInvitation = (token: string) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;

		// Validate token exists and get derived status
		const qrToken = yield* qrTokenRepo.getByToken(token);

		// If expired, return expired error
		if (qrToken.status === "expired") {
			return yield* Effect.fail(
				new QrTokenExpiredError({ message: "QR token has expired" }),
			);
		}

		// Token stays active — refusal is a no-op on the token
		return { ok: true as const };
	});
