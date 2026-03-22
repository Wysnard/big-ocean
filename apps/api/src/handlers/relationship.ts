/**
 * Relationship Presenters (HTTP Handlers) — Story 14.4, updated Story 34-1, Story 35-2
 *
 * Simplified: Invitation handlers removed (replaced by QR token handlers).
 * Remaining: Analysis + state + retry endpoints.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AuthenticatedUser } from "@workspace/domain";
import { Effect } from "effect";
import { getRelationshipAnalysis } from "../use-cases/get-relationship-analysis.use-case";
import { getRelationshipState } from "../use-cases/get-relationship-state.use-case";
import { retryRelationshipAnalysis } from "../use-cases/retry-relationship-analysis.use-case";

/**
 * Relationship Handler Group (authenticated)
 */
export const RelationshipGroupLive = HttpApiBuilder.group(BigOceanApi, "relationship", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("getRelationshipState", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* getRelationshipState(userId);
				}),
			)
			.handle("getRelationshipAnalysis", ({ path }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* getRelationshipAnalysis({
						analysisId: path.analysisId,
						userId,
					});
				}),
			)
			.handle("retryRelationshipAnalysis", ({ path }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					return yield* retryRelationshipAnalysis({
						analysisId: path.analysisId,
						userId,
					});
				}),
			);
	}),
);
