/**
 * QR Token API functions (Story 34-2)
 *
 * Type-safe API calls using Effect HttpApiClient with @workspace/contracts.
 * Extracted for testability — hooks mock this module via vi.mock.
 */

import { Effect } from "effect";
import { makeApiClient } from "./api-client";

export interface QrTokenData {
	token: string;
	shareUrl: string;
	expiresAt: string;
}

/** Generate a QR token via the typed API client */
export function generateToken(): Promise<QrTokenData> {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		const result = yield* client.qrToken.generateQrToken({});
		return {
			token: result.token,
			shareUrl: result.shareUrl,
			expiresAt: String(result.expiresAt),
		};
	}).pipe(Effect.runPromise);
}

/** Fetch token status via the typed API client */
export function fetchTokenStatus(
	token: string,
): Promise<{ status: "valid" | "accepted" | "expired" }> {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.qrToken.getQrTokenStatus({ path: { token } });
	}).pipe(Effect.runPromise);
}
