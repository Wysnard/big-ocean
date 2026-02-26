/**
 * Portrait Handlers (Story 13.3)
 *
 * Thin presenter layer for portrait status endpoints.
 * All business logic lives in use-cases.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { DateTime, Effect } from "effect";
import { getPortraitStatus } from "../use-cases/get-portrait-status.use-case";

export const PortraitGroupLive = HttpApiBuilder.group(BigOceanApi, "portrait", (handlers) =>
	Effect.gen(function* () {
		return handlers.handle("getPortraitStatus", ({ path: { sessionId } }) =>
			Effect.gen(function* () {
				const result = yield* getPortraitStatus(sessionId);

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
					teaser: result.teaser,
				};
			}),
		);
	}),
);
