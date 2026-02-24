/**
 * Send Message Use Case Tests — Steering integration
 *
 * Story 10.4: Steering integration — smart Nerin responses.
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { ConversanalyzerError } from "@workspace/domain";
import { Effect } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	coldStartMessages,
	createTestLayer,
	mockConversanalyzerRepo,
	mockEvidenceRepo,
	mockMessageRepo,
	mockNerinRepo,
	mockNerinResponse,
	postColdStartMessages,
	setupDefaultMocks,
} from "./__fixtures__/send-message.fixtures";

describe("sendMessage Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Steering integration (Story 10.4)", () => {
		it.effect("should pass steering target to Nerin in post-cold-start messages (AC: #1)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				// findBySession is called twice: once for domainDistribution, once after save for metrics
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "work",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.targetDomain).toBeDefined();
				expect(nerinCall.targetFacet).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should use greeting seed during cold start (AC: #2)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Hello",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				// GREETING_MESSAGES.length = 1 → pool index 1 → "relationships" / "gregariousness"
				expect(nerinCall.targetDomain).toBe("relationships");
				expect(nerinCall.targetFacet).toBe("gregariousness");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should extract previousDomain from message history (AC: #4)", () =>
			Effect.gen(function* () {
				const messagesWithSteering = [
					...postColdStartMessages.slice(0, 3),
					{
						id: "msg_4",
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: "Tell me more",
						targetDomain: "leisure" as const,
						targetBigfiveFacet: "imagination" as const,
						createdAt: new Date(),
					},
					...postColdStartMessages.slice(4),
				];
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(messagesWithSteering));
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "leisure",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Verify steering was called (Nerin received steering targets)
				expect(mockNerinRepo.invoke).toHaveBeenCalled();
				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.targetDomain).toBeDefined();
				expect(nerinCall.targetFacet).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save assistant message with targetDomain and targetBigfiveFacet (AC: #3)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "work",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Last call to saveMessage should be the assistant message with steering
				const saveMessageCalls = mockMessageRepo.saveMessage.mock.calls;
				const assistantSaveCall = saveMessageCalls.find((call: unknown[]) => call[1] === "assistant");
				expect(assistantSaveCall).toBeDefined();
				expect(assistantSaveCall?.[4]).toBeDefined(); // targetDomain
				expect(assistantSaveCall?.[5]).toBeDefined(); // targetBigfiveFacet
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should still steer on stale evidence when conversanalyzer fails (AC: #5)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
				);
				// Stale evidence exists in DB
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_3",
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.6,
							domain: "work",
							createdAt: new Date(),
						},
					]),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Nerin still gets steering even though conversanalyzer failed
				expect(result.response).toBe(mockNerinResponse.response);
				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.targetDomain).toBeDefined();
				expect(nerinCall.targetFacet).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"should compute valid steering for transition message — first post-cold-start with minimal evidence (AC: transition)",
			() =>
				Effect.gen(function* () {
					// Transition: exactly COLD_START_USER_MSG_THRESHOLD + 1 = 3 user messages
					const transitionMessages = [
						...coldStartMessages,
						{
							id: "msg_4",
							sessionId: "session_test_123",
							role: "assistant" as const,
							content: "That's great!",
							createdAt: new Date(),
						},
						{
							id: "msg_5",
							sessionId: "session_test_123",
							role: "user" as const,
							content: "I enjoy music",
							createdAt: new Date(),
						},
						{
							id: "msg_6",
							sessionId: "session_test_123",
							role: "assistant" as const,
							content: "Tell me more",
							createdAt: new Date(),
						},
						{
							id: "msg_7",
							sessionId: "session_test_123",
							role: "user" as const,
							content: "I play guitar",
							createdAt: new Date(),
						},
					];
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(transitionMessages));
					// First conversanalyzer run yields minimal evidence
					mockEvidenceRepo.findBySession.mockReturnValue(
						Effect.succeed([
							{
								id: "e1",
								sessionId: "session_test_123",
								messageId: "msg_5",
								bigfiveFacet: "imagination",
								score: 14,
								confidence: 0.6,
								domain: "leisure",
								createdAt: new Date(),
							},
						]),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "I play guitar",
					});

					expect(result.response).toBeDefined();
					const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
					expect(nerinCall.targetDomain).toBeDefined();
					expect(nerinCall.targetFacet).toBeDefined();
				}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
