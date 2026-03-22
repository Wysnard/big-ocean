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

/** Fetch QR token details for the accept screen (Story 34-3) */
export function fetchTokenDetails(token: string) {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.qrToken.getQrTokenDetails({ path: { token } });
	}).pipe(Effect.runPromise);
}

/** Accept a QR token (Story 34-3) */
export function acceptToken(token: string): Promise<{ analysisId: string }> {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.qrToken.acceptQrToken({ path: { token } });
	}).pipe(Effect.runPromise);
}

/** Refuse a QR token (Story 34-3) */
export function refuseToken(token: string): Promise<{ ok: true }> {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.qrToken.refuseQrToken({ path: { token } });
	}).pipe(Effect.runPromise);
}
