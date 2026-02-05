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
import { BudgetPausedError, OrchestrationError, RedisOperationError } from "@workspace/domain";
import { DateTime, Effect } from "effect";
import { getResults, resumeSession, sendMessage, startAssessment } from "../use-cases/index";

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
					};
				}),
			)
			.handle("sendMessage", ({ payload }) =>
				Effect.gen(function* () {
					// Call use case - map domain errors to contract errors
					const result = yield* sendMessage({
						sessionId: payload.sessionId,
						message: payload.message,
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
					);

					// Format HTTP response
					return {
						response: result.response,
						precision: result.precision,
					};
				}),
			)
			.handle("getResults", ({ request }) =>
				Effect.gen(function* () {
					// Extract sessionId from URL path
					const url = new URL(request.url, "http://localhost");
					const pathParts = url.pathname.split("/");
					const sessionId = pathParts[pathParts.length - 2];

					if (!sessionId) {
						return yield* Effect.fail(
							new DatabaseError({
								message: "Missing session ID in request path",
							}),
						);
					}

					// Call use case - errors propagate directly to HTTP
					const result = yield* getResults({ sessionId });

					// Format HTTP response
					return {
						oceanCode: result.oceanCode,
						archetypeName: result.archetypeName,
						traits: result.traits,
					};
				}),
			)
			.handle("resumeSession", ({ request }) =>
				Effect.gen(function* () {
					// Extract sessionId from URL path
					const url = new URL(request.url, "http://localhost");
					const pathParts = url.pathname.split("/");
					const sessionId = pathParts[pathParts.length - 2];

					if (!sessionId) {
						return yield* Effect.fail(
							new DatabaseError({
								message: "Missing session ID in request path",
							}),
						);
					}

					// Call use case - errors propagate directly to HTTP
					const result = yield* resumeSession({ sessionId });

					// Format HTTP response
					return {
						messages: result.messages.map(
							(message: { role: string; content: string; createdAt: Date }) => ({
								role: message.role as "user" | "assistant",
								content: message.content,
								timestamp: DateTime.unsafeMake(message.createdAt.getTime()),
							}),
						),
						precision: result.precision,
					};
				}),
			);
	}),
);
