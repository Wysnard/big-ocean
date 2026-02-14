/**
 * Assessment Presenters (HTTP Handlers)
 *
 * Thin presenter layer that connects HTTP requests to use cases.
 * Handles HTTP request/response transformation only.
 * Business logic lives in use cases.
 *
 * Domain errors are mapped to contract errors for HTTP responses.
 * Effect/Platform automatically handles HTTP status codes via .addError() declarations.
 */

import { HttpApiBuilder } from "@effect/platform";
import { AgentInvocationError, BigOceanApi, DatabaseError } from "@workspace/contracts";
import {
	BudgetPausedError,
	type FacetEvidencePersistenceError,
	OrchestrationError,
	RedisOperationError,
} from "@workspace/domain";
import { BetterAuthService } from "@workspace/infrastructure";
import { DateTime, Effect } from "effect";
import { getResults, resumeSession, sendMessage, startAssessment } from "../use-cases/index";

const toFetchHeaders = (requestHeaders: unknown): Headers => {
	if (requestHeaders instanceof Headers) {
		return requestHeaders;
	}

	const headers = new Headers();

	if (typeof requestHeaders !== "object" || requestHeaders === null) {
		return headers;
	}

	for (const [key, value] of Object.entries(requestHeaders as Record<string, unknown>)) {
		if (value == null) {
			continue;
		}

		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			headers.set(key, String(value));
			continue;
		}

		if (Array.isArray(value)) {
			const normalizedValues = value
				.filter((item): item is string | number | boolean => item != null)
				.map((item) => String(item));
			if (normalizedValues.length === 0) {
				continue;
			}

			// Cookie header values must remain semicolon-delimited for session parsing.
			if (key.toLowerCase() === "cookie") {
				headers.set(key, normalizedValues.join("; "));
			} else {
				headers.set(key, normalizedValues.join(", "));
			}
		}
	}

	return headers;
};

export const resolveAuthenticatedUserId = (request: { headers: unknown }) =>
	Effect.gen(function* () {
		const auth = yield* BetterAuthService;
		const session = (yield* Effect.tryPromise({
			try: () => auth.api.getSession({ headers: toFetchHeaders(request.headers) }),
			catch: (error) => error,
		}).pipe(Effect.catchAll(() => Effect.succeed(null)))) as { user?: { id?: string } } | null;

		return session?.user?.id;
	});

export const AssessmentGroupLive = HttpApiBuilder.group(BigOceanApi, "assessment", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("start", ({ payload }) =>
				Effect.gen(function* () {
					// Call use case - map infrastructure errors to contract errors
					const result = yield* startAssessment({
						userId: payload.userId,
					}).pipe(
						Effect.catchTag("RedisOperationError", (error: RedisOperationError) =>
							Effect.fail(
								new DatabaseError({
									message: `Rate limiting check failed: ${error.message}`,
								}),
							),
						),
					);

					// Format HTTP response
					return {
						sessionId: result.sessionId,
						createdAt: DateTime.unsafeMake(result.createdAt.getTime()),
						messages: result.messages.map((msg) => ({
							role: msg.role,
							content: msg.content,
							timestamp: DateTime.unsafeMake(msg.createdAt.getTime()),
						})),
					};
				}),
			)
			.handle("sendMessage", ({ payload, request }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* resolveAuthenticatedUserId(request);

					// Call use case - map domain errors to contract errors
					const result = yield* sendMessage({
						sessionId: payload.sessionId,
						message: payload.message,
						authenticatedUserId,
						userId: authenticatedUserId,
					}).pipe(
						Effect.catchTag("BudgetPausedError", (error: BudgetPausedError) =>
							Effect.fail(
								new AgentInvocationError({
									agentName: "orchestrator",
									sessionId: error.sessionId,
									message: error.message,
								}),
							),
						),
						Effect.catchTag("OrchestrationError", (error: OrchestrationError) =>
							Effect.fail(
								new AgentInvocationError({
									agentName: "orchestrator",
									sessionId: error.sessionId,
									message: error.message,
								}),
							),
						),
						Effect.catchTag("RedisOperationError", (error: RedisOperationError) =>
							Effect.fail(
								new DatabaseError({
									message: `Redis operation failed: ${error.message}`,
								}),
							),
						),
						Effect.catchTag("FacetEvidencePersistenceError", (error: FacetEvidencePersistenceError) =>
							Effect.fail(
								new DatabaseError({
									message: `Evidence retrieval failed: ${error.message}`,
								}),
							),
						),
					);

					// Format HTTP response
					return {
						response: result.response,
						confidence: result.confidence,
					};
				}),
			)
			.handle("getResults", ({ path: { sessionId }, request }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* resolveAuthenticatedUserId(request);

					// Call use case - map infrastructure errors to contract errors
					const result = yield* getResults({ sessionId, authenticatedUserId }).pipe(
						Effect.catchTag("FacetEvidencePersistenceError", (error: FacetEvidencePersistenceError) =>
							Effect.fail(
								new DatabaseError({
									message: `Evidence retrieval failed: ${error.message}`,
								}),
							),
						),
					);

					// Format HTTP response per AC-5 contract
					return {
						oceanCode5: result.oceanCode5,
						oceanCode4: result.oceanCode4,
						archetypeName: result.archetypeName,
						archetypeDescription: result.archetypeDescription,
						archetypeColor: result.archetypeColor,
						isCurated: result.isCurated,
						traits: result.traits.map((t) => ({
							name: t.name,
							score: t.score,
							level: t.level,
							confidence: t.confidence,
						})),
						facets: result.facets.map((f) => ({
							name: f.name,
							traitName: f.traitName,
							score: f.score,
							confidence: f.confidence,
						})),
						overallConfidence: result.overallConfidence,
					};
				}),
			)
			.handle("resumeSession", ({ path: { sessionId }, request }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* resolveAuthenticatedUserId(request);

					// Call use case - map infrastructure errors to contract errors
					const result = yield* resumeSession({ sessionId, authenticatedUserId }).pipe(
						Effect.catchTag("FacetEvidencePersistenceError", (error: FacetEvidencePersistenceError) =>
							Effect.fail(
								new DatabaseError({
									message: `Evidence retrieval failed: ${error.message}`,
								}),
							),
						),
					);

					// Format HTTP response
					return {
						messages: result.messages.map(
							(message: { role: string; content: string; createdAt: Date }) => ({
								role: message.role as "user" | "assistant",
								content: message.content,
								timestamp: DateTime.unsafeMake(message.createdAt.getTime()),
							}),
						),
						confidence: result.confidence,
					};
				}),
			);
	}),
);
