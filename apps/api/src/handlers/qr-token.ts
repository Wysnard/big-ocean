/**
 * QR Token Presenters (HTTP Handlers) — Story 34-1
 *
 * Authenticated endpoints for QR token lifecycle.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AuthenticatedUser } from "@workspace/domain";
import { DateTime, Effect } from "effect";
import { acceptQrInvitation } from "../use-cases/accept-qr-invitation.use-case";
import { generateQrToken } from "../use-cases/generate-qr-token.use-case";
import { getQrTokenStatus } from "../use-cases/get-qr-token-status.use-case";
import { refuseQrInvitation } from "../use-cases/refuse-qr-invitation.use-case";

export const QrTokenGroupLive = HttpApiBuilder.group(BigOceanApi, "qrToken", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("generateQrToken", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* generateQrToken(userId);
					return {
						token: result.token,
						shareUrl: result.shareUrl,
						expiresAt: DateTime.unsafeMake(result.expiresAt.getTime()),
					};
				}),
			)
			.handle("getQrTokenStatus", ({ path }) =>
				Effect.gen(function* () {
					yield* AuthenticatedUser;
					const result = yield* getQrTokenStatus(path.token);
					return result;
				}),
			)
			.handle("acceptQrToken", ({ path }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* acceptQrInvitation({
						token: path.token,
						acceptedByUserId: userId,
					});
					return result;
				}),
			)
			.handle("refuseQrToken", ({ path }) =>
				Effect.gen(function* () {
					yield* AuthenticatedUser;
					const result = yield* refuseQrInvitation(path.token);
					return result;
				}),
			);
	}),
);
