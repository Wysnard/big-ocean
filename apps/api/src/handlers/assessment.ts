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
import {
	AgentInvocationError,
	BigOceanApi,
	DatabaseError,
	Unauthorized,
} from "@workspace/contracts";
import {
	BudgetPausedError,
	CurrentUser,
	extract4LetterCode,
	type FacetEvidencePersistenceError,
	lookupArchetype,
	OrchestrationError,
	RedisOperationError,
} from "@workspace/domain";
import { DateTime, Effect } from "effect";
import {
	getResults,
	listUserSessions,
	resumeSession,
	sendMessage,
	startAnonymousAssessment,
	startAuthenticatedAssessment,
} from "../use-cases/index";

export const AssessmentGroupLive = HttpApiBuilder.group(BigOceanApi, "assessment", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("start", ({ payload }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* CurrentUser;
					const userId = authenticatedUserId ?? payload.userId;

					// Call use case - dispatch to authenticated or anonymous path
					const result = userId
						? yield* startAuthenticatedAssessment({ userId }).pipe(
								Effect.catchTag("RedisOperationError", (error: RedisOperationError) =>
									Effect.fail(
										new DatabaseError({
											message: `Rate limiting check failed: ${error.message}`,
										}),
									),
								),
							)
						: yield* startAnonymousAssessment();

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
			.handle("listSessions", () =>
				Effect.gen(function* () {
					const userId = yield* CurrentUser;
					if (!userId) {
						return yield* Effect.fail(
							new Unauthorized({ message: "Authentication required to list sessions" }),
						);
					}

					const result = yield* listUserSessions({ userId });

					return {
						sessions: result.sessions.map((s) => {
							// Derive archetype name from oceanCode5 if available
							let archetypeName: string | null = null;
							if (s.oceanCode5) {
								try {
									const code4 = extract4LetterCode(s.oceanCode5);
									const archetype = lookupArchetype(code4);
									archetypeName = archetype.name;
								} catch {
									// Invalid code — leave archetypeName null
								}
							}

							return {
								id: s.id,
								createdAt: DateTime.unsafeMake(s.createdAt.getTime()),
								updatedAt: DateTime.unsafeMake(s.updatedAt.getTime()),
								status: s.status as "active" | "paused" | "completed" | "archived",
								messageCount: s.messageCount,
								oceanCode5: s.oceanCode5,
								archetypeName,
							};
						}),
						freeTierMessageThreshold: result.freeTierMessageThreshold,
					};
				}),
			)
			.handle("sendMessage", ({ payload }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* CurrentUser;

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
					);

					// Format HTTP response (lean: response only, no confidence)
					return {
						response: result.response,
					};
				}),
			)
			.handle("getResults", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* CurrentUser;

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
						personalDescription: result.personalDescription,
						messageCount: result.messageCount,
						publicProfileId: result.publicProfileId,
						shareableUrl: result.shareableUrl,
						isPublic: result.isPublic,
					};
				}),
			)
			.handle("resumeSession", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* CurrentUser;

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
						freeTierMessageThreshold: result.freeTierMessageThreshold,
					};
				}),
			);
	}),
);
