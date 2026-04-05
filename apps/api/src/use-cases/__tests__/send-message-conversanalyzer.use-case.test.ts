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
	mockActorRepo,
	mockActorResponse,
	mockConversanalyzerRepo,
	mockEvidenceRepo,
	mockLoggerRepo,
	mockMessageRepo,
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
				// Evidence extraction called
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
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

				// ConversAnalyzer evidence extraction should be called even during cold start
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
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

				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"should handle non-fatal conversanalyzer error — falls back to Tier 2 lenient (AC: #6, Story 24-2)",
			() =>
				Effect.gen(function* () {
					mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
					// Fail strict calls — lenient methods succeed from default setup
					mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
						Effect.fail(new ConversanalyzerError({ message: "LLM timeout" })),
					);

					const result = yield* sendMessage({
						sessionId: "session_test_123",
						message: "I work in tech",
					});

					// Nerin should still respond normally
					expect(result.response).toBe(mockActorResponse.response);
					expect(mockActorRepo.invoke).toHaveBeenCalled();
					// Tier 2 warning was logged (split three-tier pipeline)
					expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
						expect.stringContaining("fell back to Tier 2"),
						expect.objectContaining({ sessionId: "session_test_123" }),
					);
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save all evidence without weight filtering", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				const customEvidence = [
					{
						bigfiveFacet: "imagination" as const,
						deviation: 2,
						strength: "strong" as const,
						confidence: "high" as const,
						domain: "work" as const,
						note: "Creative",
					},
					{
						bigfiveFacet: "trust" as const,
						deviation: 1,
						strength: "moderate" as const,
						confidence: "medium" as const,
						domain: "relationships" as const,
						note: "Trusting",
					},
					{
						bigfiveFacet: "anxiety" as const,
						deviation: -2,
						strength: "weak" as const,
						confidence: "low" as const,
						domain: "health" as const,
						note: "Calm",
					},
				];
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
					Effect.succeed({
						evidence: customEvidence,
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "I work in tech",
				});

				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(3);
				const facets = savedRecords.map((r: { bigfiveFacet: string }) => r.bigfiveFacet);
				expect(facets).toContain("anxiety");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip save when conversanalyzer returns empty evidence (AC: #3)", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
					Effect.succeed({
						evidence: [],
						tokenUsage: { input: 100, output: 20 },
					}),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "ok thanks",
				});

				expect(result.response).toBeDefined();
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
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

				// Evidence extraction receives correct domain distribution
				const evidenceCall = mockConversanalyzerRepo.analyzeEvidence.mock.calls[0][0];
				expect(evidenceCall.domainDistribution).toEqual({
					work: 2,
					relationships: 0,
					family: 0,
					leisure: 0,
					health: 0,
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
