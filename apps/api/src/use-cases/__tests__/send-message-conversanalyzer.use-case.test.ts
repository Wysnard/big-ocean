/**
 * Send Message Use Case Tests — Conversanalyzer integration
 *
 * Story 10.2: Conversanalyzer integration — cold start skip, evidence pipeline,
 *             non-fatal error handling, evidence cap, zero evidence.
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
	mockLoggerRepo,
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

	describe("Conversanalyzer integration (Story 10.2)", () => {
		it.effect("should trigger conversanalyzer for post-cold-start messages (AC: #1)", () =>
			Effect.gen(function* () {
				// Post-cold-start: 3 user messages (> greeting count of 2)
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				expect(result.response).toBeDefined();
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip conversanalyzer during cold start (AC: #7)", () =>
			Effect.gen(function* () {
				// Cold start: only 1 user message (≤ greeting count of 2)
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Hello",
				});

				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip conversanalyzer at exactly greeting count (boundary)", () =>
			Effect.gen(function* () {
				// Exactly 2 user messages = greeting count → still cold start
				const twoUserMessages = [
					...coldStartMessages,
					{
						id: "msg_4",
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: "Cool",
						createdAt: new Date(),
					},
					{
						id: "msg_5",
						sessionId: "session_test_123",
						role: "user" as const,
						content: "More",
						createdAt: new Date(),
					},
				];
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(twoUserMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "More",
				});

				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should handle non-fatal conversanalyzer error — Nerin still responds (AC: #6)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Nerin should still respond normally despite conversanalyzer failure
				expect(result.response).toBe(mockNerinResponse.response);
				expect(mockNerinRepo.invoke).toHaveBeenCalled();
				// Error was logged (after retry exhausted per AC #6)
				expect(mockLoggerRepo.error).toHaveBeenCalledWith(
					"Conversanalyzer failed, skipping",
					expect.objectContaining({ sessionId: "session_test_123" }),
				);
				// Evidence not saved
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should cap evidence to 3 records (AC: #9)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						evidence: [
							{ bigfiveFacet: "imagination", score: 14, confidence: 0.6, domain: "work" },
							{ bigfiveFacet: "trust", score: 12, confidence: 0.5, domain: "relationships" },
							{ bigfiveFacet: "orderliness", score: 16, confidence: 0.7, domain: "work" },
							{ bigfiveFacet: "cheerfulness", score: 18, confidence: 0.8, domain: "leisure" },
							{ bigfiveFacet: "anxiety", score: 5, confidence: 0.4, domain: "solo" },
						],
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// Only 3 records saved (capped from 5)
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(3);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip save when conversanalyzer returns empty evidence (AC: #3)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({ evidence: [], tokenUsage: { input: 100, output: 20 } }),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "ok thanks",
				});

				expect(result.response).toBeDefined();
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should pass correct domain distribution to conversanalyzer (AC: #4)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				// Existing evidence in session
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
						{
							id: "e2",
							sessionId: "session_test_123",
							messageId: "msg_5",
							bigfiveFacet: "trust",
							score: 12,
							confidence: 0.5,
							domain: "work",
							createdAt: new Date(),
						},
					]),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const analyzeCall = mockConversanalyzerRepo.analyze.mock.calls[0][0];
				expect(analyzeCall.domainDistribution).toEqual({
					work: 2,
					relationships: 0,
					family: 0,
					leisure: 0,
					solo: 0,
					other: 0,
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save evidence with correct sessionId and messageId", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockMessageRepo.saveMessage.mockReturnValue(
					Effect.succeed({
						id: "new_msg_id",
						sessionId: "session_test_123",
						role: "user",
						content: "test",
						createdAt: new Date(),
					}),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				for (const record of savedRecords) {
					expect(record.sessionId).toBe("session_test_123");
					expect(record.messageId).toBe("new_msg_id");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
