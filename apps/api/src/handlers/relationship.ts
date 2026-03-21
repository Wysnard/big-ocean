/**
 * Relationship Presenters (HTTP Handlers) — Story 14.4, updated Story 34-1
 *
 * Simplified: Invitation handlers removed (replaced by QR token handlers).
 * Remaining: Analysis + state endpoints.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { AuthenticatedUser } from "@workspace/domain";
import { Effect } from "effect";
import { getRelationshipAnalysis } from "../use-cases/get-relationship-analysis.use-case";
import { getRelationshipState } from "../use-cases/get-relationship-state.use-case";

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
			);
	}),
);
