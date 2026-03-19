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
				// Post-cold-start: 3 user messages (past initial greeting exchange)
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

		it.effect("should run conversanalyzer during cold start for pacing data (Story 27-3)", () =>
			Effect.gen(function* () {
				// Story 27-3: ConversAnalyzer now runs on all turns to collect energy/telling
				// bands needed by the pacing pipeline
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Hello",
				});

				// ConversAnalyzer should be called even during cold start
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should run conversanalyzer at all turn positions (Story 27-3)", () =>
			Effect.gen(function* () {
				// Story 27-3: No cold-start skip — extraction runs on every turn
				const oneUserMessageHistory = [
					...coldStartMessages,
					{
						id: "msg_4",
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: "Cool",
						createdAt: new Date(),
					},
				];
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(oneUserMessageHistory));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "More",
				});

				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"should handle non-fatal conversanalyzer error — falls back to Tier 2 lenient (AC: #6, Story 24-2)",
			() =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
					mockConversanalyzerRepo.analyze.mockReturnValue(
						Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
					);
					// analyzeLenient succeeds from default setup — Tier 2 fallback

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "I work in tech",
					});

					// Nerin should still respond normally
					expect(result.response).toBe(mockNerinResponse.response);
					expect(mockNerinRepo.invoke).toHaveBeenCalled();
					// Tier 2 warning was logged (three-tier pipeline, Story 24-2)
					expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
						"ConversAnalyzer fell back to Tier 2 (lenient schema)",
						expect.objectContaining({ sessionId: "session_test_123" }),
					);
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should filter evidence by weight threshold (AC: #9)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						evidence: [
							{
								bigfiveFacet: "imagination",
								deviation: 2,
								strength: "strong",
								confidence: "high",
								domain: "work",
								note: "Creative",
							},
							{
								bigfiveFacet: "trust",
								deviation: 1,
								strength: "moderate",
								confidence: "medium",
								domain: "relationships",
								note: "Trusting",
							},
							{
								bigfiveFacet: "orderliness",
								deviation: -1,
								strength: "moderate",
								confidence: "high",
								domain: "work",
								note: "Structured",
							},
							{
								bigfiveFacet: "cheerfulness",
								deviation: 2,
								strength: "strong",
								confidence: "medium",
								domain: "leisure",
								note: "Joyful",
							},
							{
								// finalWeight: 0.3 * 0.3 = 0.09 — below threshold, dropped
								bigfiveFacet: "anxiety",
								deviation: -2,
								strength: "weak",
								confidence: "low",
								domain: "solo",
								note: "Calm",
							},
							{
								bigfiveFacet: "intellect",
								deviation: 1,
								strength: "moderate",
								confidence: "medium",
								domain: "work",
								note: "Curious",
							},
							{
								bigfiveFacet: "altruism",
								deviation: 3,
								strength: "strong",
								confidence: "high",
								domain: "family",
								note: "Giving",
							},
						],
						userState: {
							energyBand: "steady" as const,
							tellingBand: "mixed" as const,
							energyReason: "",
							tellingReason: "",
							withinMessageShift: false,
						},
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				// 6 records saved (anxiety dropped due to weight < 0.36)
				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(6);
				const facets = savedRecords.map((r: { bigfiveFacet: string }) => r.bigfiveFacet);
				expect(facets).not.toContain("anxiety");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip save when conversanalyzer returns empty evidence (AC: #3)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						userState: {
							energyBand: "low" as const,
							tellingBand: "mixed" as const,
							energyReason: "",
							tellingReason: "",
							withinMessageShift: false,
						},
						evidence: [],
						tokenUsage: { input: 100, output: 20 },
					}),
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
