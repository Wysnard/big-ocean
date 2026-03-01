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
			.handle("getProfile", ({ request }) =>
				Effect.gen(function* () {
					// Extract publicProfileId from URL path
					const url = new URL(request.url, "http://localhost");
					const pathParts = url.pathname.split("/");
					const publicProfileId = pathParts[pathParts.length - 1];

					if (!publicProfileId) {
						return yield* Effect.fail(
							new DatabaseError({
								message: "Missing profile ID in request path",
							}),
						);
					}

					const result = yield* getPublicProfile({ publicProfileId }).pipe(
						Effect.catchTag("AssessmentResultError", (error: AssessmentResultError) =>
							Effect.fail(
								new DatabaseError({
									message: `Result retrieval failed: ${error.message}`,
								}),
							),
						),
					);

					return {
						archetypeName: result.archetypeName,
						oceanCode: result.oceanCode,
						description: result.description,
						color: result.color,
						displayName: result.displayName,
						traitSummary: result.traitSummary,
						facets: result.facets,
						isPublic: result.isPublic,
					};
				}),
			)
			.handle("toggleVisibility", ({ payload, request }) =>
				Effect.gen(function* () {
					// Extract publicProfileId from URL path
					const url = new URL(request.url, "http://localhost");
					const pathParts = url.pathname.split("/");
					// Path: /api/public-profile/:publicProfileId/visibility
					const publicProfileId = pathParts[pathParts.length - 2];

					if (!publicProfileId) {
						return yield* Effect.fail(
							new DatabaseError({
								message: "Missing profile ID in request path",
							}),
						);
					}

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
