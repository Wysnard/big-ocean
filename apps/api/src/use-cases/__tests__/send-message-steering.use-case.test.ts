/**
 * Send Message Use Case Tests -- Territory-based steering integration
 *
 * Story 21-7: Updated from facet-targeting to territory-based steering.
 * Tests verify that Nerin receives territory prompt context and assistant
 * messages are saved with territory metadata.
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
	mockExchangeRepo,
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

	describe("Territory-based steering integration (Story 21-7)", () => {
		it.effect("should pass territory prompt to Nerin in post-cold-start messages", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed([
						{
							id: "e1",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "imagination",
							deviation: 1,
							strength: "moderate",
							confidence: "medium",
							domain: "work",
							note: "test",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.territoryPrompt).toBeDefined();
				expect(nerinCall.territoryPrompt?.opener).toBeDefined();
				expect(nerinCall.territoryPrompt?.energyGuidanceLevel).toBeDefined();
				expect(nerinCall.territoryPrompt?.domains).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should use cold-start territory during cold start", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Hello",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				// Cold-start path still provides territory prompt
				expect(nerinCall.territoryPrompt).toBeDefined();
				expect(nerinCall.territoryPrompt?.energyGuidanceLevel).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"should save messages with exchange_id and store territory on exchange (Story 23-3)",
			() =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
					mockEvidenceRepo.findBySession.mockReturnValue(
						Effect.succeed([
							{
								id: "e1",
								sessionId: "session_test_123",
								messageId: "msg_5",
								bigfiveFacet: "imagination",
								deviation: 1,
								strength: "moderate",
								confidence: "medium",
								domain: "work",
								note: "test",
								createdAt: new Date(),
							},
						]),
					);

					yield* sendMessage({
						sessionId: "session_test_123",
						message: "I work in tech",
					});

					const saveMessageCalls = mockMessageRepo.saveMessage.mock.calls;

					// Both user and assistant messages should have exchangeId (4th arg)
					const userSaveCall = saveMessageCalls.find((call: unknown[]) => call[1] === "user");
					expect(userSaveCall).toBeDefined();
					expect(userSaveCall?.[3]).toBeDefined(); // exchangeId

					const assistantSaveCall = saveMessageCalls.find((call: unknown[]) => call[1] === "assistant");
					expect(assistantSaveCall).toBeDefined();
					expect(assistantSaveCall?.[3]).toBeDefined(); // exchangeId

					// Exchange should be updated with territory selection
					expect(mockExchangeRepo.update).toHaveBeenCalledWith(
						expect.any(String),
						expect.objectContaining({
							selectedTerritory: expect.any(String),
							selectionRule: expect.any(String),
						}),
					);
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should still steer on stale evidence when conversanalyzer fails", () =>
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
							deviation: 1,
							strength: "moderate",
							confidence: "medium",
							domain: "work",
							note: "test",
							createdAt: new Date(),
						},
					]),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Nerin still gets territory prompt even though conversanalyzer failed
				expect(result.response).toBe(mockNerinResponse.response);
				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.territoryPrompt).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"should compute valid territory steering for transition message -- first post-cold-start with minimal evidence",
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
					mockEvidenceRepo.findBySession.mockReturnValue(
						Effect.succeed([
							{
								id: "e1",
								sessionId: "session_test_123",
								messageId: "msg_5",
								bigfiveFacet: "imagination",
								deviation: 1,
								strength: "moderate",
								confidence: "medium",
								domain: "leisure",
								note: "test",
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
					expect(nerinCall.territoryPrompt).toBeDefined();
				}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
