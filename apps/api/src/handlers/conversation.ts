/**
 * Conversation Presenters (HTTP Handlers)
 *
 * Thin presenter layer that connects HTTP requests to use cases.
 * Handles HTTP request/response transformation only.
 * Business logic lives in use cases.
 *
 * Conversations require Better Auth; ownership is resolved from the authenticated user.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi, DatabaseError } from "@workspace/contracts";
import {
	type AssessmentResultError,
	AuthenticatedUser,
	type FacetEvidencePersistenceError,
} from "@workspace/domain";
import { DateTime, Effect } from "effect";
import { activateConversationExtension } from "../use-cases/activate-conversation-extension.use-case";
import {
	generateResults,
	getFinalizationStatus,
	getResults,
	getTranscript,
	listUserSessions,
	resumeSession,
	sendMessage,
	startAuthenticatedConversation,
} from "../use-cases/index";

export const ConversationGroupLive = HttpApiBuilder.group(BigOceanApi, "conversation", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("start", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* startAuthenticatedConversation({ userId });

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
					const userId = yield* AuthenticatedUser;
					const result = yield* listUserSessions({ userId });

					return {
						sessions: result.sessions.map((s) => ({
							id: s.id,
							createdAt: DateTime.unsafeMake(s.createdAt.getTime()),
							updatedAt: DateTime.unsafeMake(s.updatedAt.getTime()),
							status: s.status as "active" | "paused" | "finalizing" | "completed" | "archived",
							messageCount: s.messageCount,
							oceanCode5: s.oceanCode5,
							archetypeName: s.archetypeName,
						})),
						assessmentTurnCount: result.assessmentTurnCount,
					};
				}),
			)
			.handle("sendMessage", ({ payload }) =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* sendMessage({
						sessionId: payload.sessionId,
						message: payload.message,
						userId,
					});

					return {
						response: result.response,
						isFinalTurn: result.isFinalTurn,
						...(result.surfacingMessage ? { surfacingMessage: result.surfacingMessage } : {}),
					};
				}),
			)
			.handle("getResults", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* AuthenticatedUser;

					// Call use case - map infrastructure errors to contract errors
					const result = yield* getResults({ sessionId, authenticatedUserId }).pipe(
						Effect.catchTag("AssessmentResultError", (error: AssessmentResultError) =>
							Effect.fail(
								new DatabaseError({
									message: `Result retrieval failed: ${error.message}`,
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
							level: f.level,
							levelLabel: f.levelLabel,
							levelDescription: f.levelDescription,
						})),
						overallConfidence: result.overallConfidence,
						messageCount: result.messageCount,
						publicProfileId: result.publicProfileId,
						shareableUrl: result.shareableUrl,
						isPublic: result.isPublic,
						isLatestVersion: result.isLatestVersion,
					};
				}),
			)
			.handle("generateResults", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* AuthenticatedUser;
					return yield* generateResults({ sessionId, authenticatedUserId });
				}),
			)
			.handle("getFinalizationStatus", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* AuthenticatedUser;
					return yield* getFinalizationStatus({ sessionId, authenticatedUserId });
				}),
			)
			.handle("getTranscript", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* AuthenticatedUser;
					const result = yield* getTranscript({ sessionId, authenticatedUserId });
					return {
						messages: result.messages.map((msg) => ({
							id: msg.id,
							role: msg.role,
							content: msg.content,
							timestamp: DateTime.unsafeMake(msg.createdAt.getTime()),
						})),
					};
				}),
			)
			.handle("activateExtension", () =>
				Effect.gen(function* () {
					const userId = yield* AuthenticatedUser;
					const result = yield* activateConversationExtension({ userId });

					return {
						sessionId: result.sessionId,
						parentConversationId: result.parentConversationId,
						createdAt: DateTime.unsafeMake(result.createdAt.getTime()),
						messages: result.messages.map((msg) => ({
							role: msg.role,
							content: msg.content,
							timestamp: DateTime.unsafeMake(msg.createdAt.getTime()),
						})),
					};
				}),
			)
			.handle("resumeSession", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* AuthenticatedUser;

					// Call use case - map infrastructure errors to contract errors
					const result = yield* resumeSession({ sessionId, authenticatedUserId }).pipe(
						Effect.catchTag("FacetEvidencePersistenceError", (error: FacetEvidencePersistenceError) =>
							Effect.fail(
								new DatabaseError({
									message: `Evidence retrieval failed: ${error.message}`,
								}),
							),
						),
						Effect.catchTag("AssessmentResultError", (error: AssessmentResultError) =>
							Effect.fail(
								new DatabaseError({
									message: `Result retrieval failed: ${error.message}`,
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
						assessmentTurnCount: result.assessmentTurnCount,
						status: result.status as "active" | "paused" | "finalizing" | "completed",
					};
				}),
			);
	}),
);
