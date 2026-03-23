/**
 * Profile Presenters (HTTP Handlers)
 *
 * Thin presenter layer that connects HTTP requests to use cases.
 * Handles HTTP request/response transformation only.
 * Business logic lives in use cases.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi, DatabaseError, Unauthorized } from "@workspace/contracts";
import { type AssessmentResultError, CurrentUser } from "@workspace/domain";
import { Effect } from "effect";
import {
	createShareableProfile,
	getPublicProfile,
	toggleProfileVisibility,
} from "../use-cases/index";

export const ProfileGroupLive = HttpApiBuilder.group(BigOceanApi, "profile", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("shareProfile", ({ payload }) =>
				Effect.gen(function* () {
					const result = yield* createShareableProfile({
						sessionId: payload.sessionId,
					}).pipe(
						Effect.catchTag("AssessmentResultError", (error: AssessmentResultError) =>
							Effect.fail(
								new DatabaseError({
									message: `Result retrieval failed: ${error.message}`,
								}),
							),
						),
					);

					return {
						publicProfileId: result.publicProfileId,
						shareableUrl: result.shareableUrl,
						isPublic: result.isPublic,
					};
				}),
			)
			.handle("getProfile", ({ path: { publicProfileId } }) =>
				Effect.gen(function* () {
					const result = yield* getPublicProfile({ publicProfileId }).pipe(
						Effect.catchTag("AssessmentResultError", (error: AssessmentResultError) =>
							Effect.fail(
								new DatabaseError({
									message: `Result retrieval failed: ${error.message}`,
								}),
							),
						),
					);

					// Own-profile detection: check if the authenticated viewer owns this profile
					const viewerUserId = yield* CurrentUser;
					const isOwnProfile = !!viewerUserId && viewerUserId === result.userId;

					return {
						archetypeName: result.archetypeName,
						oceanCode: result.oceanCode,
						description: result.description,
						color: result.color,
						displayName: result.displayName,
						traitSummary: result.traitSummary,
						facets: result.facets,
						isPublic: result.isPublic,
						isOwnProfile,
					};
				}),
			)
			.handle("toggleVisibility", ({ path: { publicProfileId }, payload }) =>
				Effect.gen(function* () {
					// Extract authenticated user ID from middleware
					const authenticatedUserId = yield* CurrentUser;

					if (!authenticatedUserId) {
						return yield* Effect.fail(
							new Unauthorized({
								message: "Authentication required",
							}),
						);
					}

					const result = yield* toggleProfileVisibility({
						publicProfileId,
						isPublic: payload.isPublic,
						authenticatedUserId,
					});

					return {
						isPublic: result.isPublic,
					};
				}),
			);
	}),
);
