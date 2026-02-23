/**
 * Assessment Presenters (HTTP Handlers)
 *
 * Thin presenter layer that connects HTTP requests to use cases.
 * Handles HTTP request/response transformation only.
 * Business logic lives in use cases.
 *
 * Story 9.2: sendMessage supports dual auth (anonymous cookie + Better Auth).
 */

import { HttpApiBuilder } from "@effect/platform";
import {
	AssessmentTokenSecurity,
	BigOceanApi,
	DatabaseError,
	Unauthorized,
} from "@workspace/contracts";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CurrentUser,
	extract4LetterCode,
	type FacetEvidencePersistenceError,
	lookupArchetype,
	RedisOperationError,
} from "@workspace/domain";
import { DateTime, Effect, Redacted } from "effect";
import {
	generateResults,
	getFinalizationStatus,
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

					// Story 9.1: If anonymous (no userId), check for existing session via cookie
					if (!userId) {
						const token = yield* HttpApiBuilder.securityDecode(AssessmentTokenSecurity).pipe(
							Effect.map((redacted) => Redacted.value(redacted)),
							Effect.catchAll(() => Effect.succeed("")),
						);

						if (token) {
							const sessionRepo = yield* AssessmentSessionRepository;
							const session = yield* sessionRepo.findByToken(token);

							if (session) {
								const messageRepo = yield* AssessmentMessageRepository;
								const messages = yield* messageRepo.getMessages(session.id);

								// Refresh cookie on successful resumption
								yield* HttpApiBuilder.securitySetCookie(
									AssessmentTokenSecurity,
									session.sessionToken ?? token,
									{
										httpOnly: true,
										secure: true,
										sameSite: "lax",
										path: "/api/assessment",
										maxAge: "30 days",
									},
								);

								return {
									sessionId: session.id,
									createdAt: DateTime.unsafeMake(session.createdAt.getTime()),
									messages: messages.map((msg) => ({
										role: msg.role as "user" | "assistant",
										content: msg.content,
										timestamp: DateTime.unsafeMake(msg.createdAt.getTime()),
									})),
								};
							}
						}
					}

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

					// Set httpOnly cookie for anonymous sessions (Story 9.1)
					const sessionToken =
						"sessionToken" in result ? (result as { sessionToken: string }).sessionToken : undefined;
					if (sessionToken) {
						yield* HttpApiBuilder.securitySetCookie(AssessmentTokenSecurity, sessionToken, {
							httpOnly: true,
							secure: true,
							sameSite: "lax",
							path: "/api/assessment",
							maxAge: "30 days",
						});
					}

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
								status: s.status as "active" | "paused" | "finalizing" | "completed" | "archived",
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
					// Story 9.2: Dual auth — try anonymous cookie first, fall back to Better Auth
					const token = yield* HttpApiBuilder.securityDecode(AssessmentTokenSecurity).pipe(
						Effect.map((redacted) => Redacted.value(redacted)),
						Effect.catchAll(() => Effect.succeed("")),
					);

					const authenticatedUserId = yield* CurrentUser;

					// Determine userId for ownership guard
					let userId: string | undefined = authenticatedUserId ?? undefined;

					// For anonymous sessions, validate token belongs to the requested session
					if (token && !authenticatedUserId) {
						const sessionRepo = yield* AssessmentSessionRepository;
						const tokenSession = yield* sessionRepo.findByToken(token);
						if (!tokenSession || tokenSession.id !== payload.sessionId) {
							return yield* Effect.fail(new DatabaseError({ message: "Session not found" }));
						}
						// Anonymous sessions have no userId — pass undefined
						userId = tokenSession.userId ?? undefined;
					}

					const result = yield* sendMessage({
						sessionId: payload.sessionId,
						message: payload.message,
						userId,
					});

					return {
						response: result.response,
						isFinalTurn: result.isFinalTurn,
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
			.handle("generateResults", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* CurrentUser;
					if (!authenticatedUserId) {
						return yield* Effect.fail(
							new Unauthorized({ message: "Authentication required to generate results" }),
						);
					}
					return yield* generateResults({ sessionId, authenticatedUserId });
				}),
			)
			.handle("getFinalizationStatus", ({ path: { sessionId } }) =>
				Effect.gen(function* () {
					const authenticatedUserId = yield* CurrentUser;
					if (!authenticatedUserId) {
						return yield* Effect.fail(
							new Unauthorized({ message: "Authentication required to check finalization status" }),
						);
					}
					return yield* getFinalizationStatus({ sessionId, authenticatedUserId });
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
