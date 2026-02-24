/**
 * Portrait Handlers (Story 13.3)
 *
 * Thin presenter layer for portrait status endpoints.
 * All business logic lives in use-cases.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { Effect } from "effect";
import { getPortraitStatus } from "../use-cases/get-portrait-status.use-case";

export const PortraitGroupLive = HttpApiBuilder.group(BigOceanApi, "portrait", (handlers) =>
	Effect.gen(function* () {
		return handlers.handle("getPortraitStatus", ({ path }) =>
			Effect.gen(function* () {
				const result = yield* getPortraitStatus(path.sessionId);

				// Transform portrait dates for JSON serialization
				const portrait = result.portrait
					? {
							...result.portrait,
							createdAt: result.portrait.createdAt.toISOString(),
						}
					: null;

				return {
					status: result.status,
					portrait,
				};
			}),
		);
	}),
);
