/**
 * Portrait Handlers (Story 13.3, extended Story 19-2, Story 32-6)
 *
 * Thin presenter layer for portrait status, rating, and retry endpoints.
 * All business logic lives in use-cases.
 *
 * Story 32-6 adds: retryPortrait handler, optional userId for reconciliation.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AuthenticatedUser, CurrentUser } from "@workspace/domain";
import { DateTime, Effect } from "effect";
import { getPortraitStatus } from "../use-cases/get-portrait-status.use-case";
import { ratePortrait } from "../use-cases/rate-portrait.use-case";
import { retryPortrait } from "../use-cases/retry-portrait.use-case";

export const PortraitGroupLive = HttpApiBuilder.group(BigOceanApi, "portrait", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("getPortraitStatus", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					// Attempt to get userId for reconciliation (optional — endpoint is unauthenticated)
					const userId = yield* CurrentUser.pipe(Effect.catchAll(() => Effect.succeed(undefined)));

					const result = yield* getPortraitStatus({ sessionId, userId });

					// Transform portrait dates for DateTimeUtc serialization
					const portrait = result.portrait
						? {
								...result.portrait,
								createdAt: DateTime.unsafeMake(result.portrait.createdAt.getTime()),
							}
						: null;

					return {
						status: result.status,
						portrait,
						isLatestVersion: result.isLatestVersion,
					};
				}),
			)
			.handle("ratePortrait", ({ payload }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;

					const record = yield* ratePortrait({
						userId,
						assessmentSessionId: payload.assessmentSessionId,
						portraitType: payload.portraitType,
						rating: payload.rating,
						depthSignal: payload.depthSignal,
						evidenceCount: payload.evidenceCount,
					});

					return {
						id: record.id,
						createdAt: DateTime.unsafeMake(record.createdAt.getTime()),
					};
				}),
			)
			.handle("retryPortrait", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;

					const result = yield* retryPortrait({ sessionId, userId });

					return {
						status: result.status,
					};
				}),
			);
	}),
);
