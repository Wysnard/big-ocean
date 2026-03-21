/**
 * Get QR Token Status Use-Case (Story 34-1)
 *
 * Returns the derived status of a QR token: valid, accepted, or expired.
 */

import { QrTokenRepository } from "@workspace/domain";
import { Effect } from "effect";

export const getQrTokenStatus = (token: string) =>
	Effect.gen(function* () {
		const qrTokenRepo = yield* QrTokenRepository;
		const status = yield* qrTokenRepo.getStatus(token);
		return { status };
	});
