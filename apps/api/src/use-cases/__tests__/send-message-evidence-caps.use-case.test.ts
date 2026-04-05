/**
 * Send Message Use Case Tests — Evidence saving behavior
 *
 * Weight-threshold filtering removed — all extracted evidence is saved.
 * Tests verify evidence is passed through to persistence without filtering.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Effect } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	createTestLayer,
	mockConversanalyzerRepo,
	mockEvidenceRepo,
	mockMessageRepo,
	postColdStartMessages,
	setupDefaultMocks,
} from "./__fixtures__/send-message.fixtures";

describe("sendMessage — Evidence quality-based filtering", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Evidence saving (no weight filtering)", () => {
		it.effect("should save all extracted evidence regardless of weight", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
					Effect.succeed({
						evidence: [
							{
								bigfiveFacet: "anxiety",
								deviation: -1,
								strength: "weak",
								confidence: "low",
								domain: "health",
								note: "Low anxiety",
							},
							{
								bigfiveFacet: "intellect",
								deviation: 1,
								strength: "weak",
								confidence: "medium",
								domain: "work",
								note: "Curious",
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
								bigfiveFacet: "imagination",
								deviation: 3,
								strength: "strong",
								confidence: "high",
								domain: "work",
								note: "Creative",
							},
						],
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(4);

				const facets = savedRecords.map((r: { bigfiveFacet: string }) => r.bigfiveFacet);
				expect(facets).toContain("anxiety");
				expect(facets).toContain("intellect");
				expect(facets).toContain("trust");
				expect(facets).toContain("imagination");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should keep all 7+ high-quality evidence records", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
					Effect.succeed({
						evidence: [
							{
								bigfiveFacet: "imagination",
								deviation: 3,
								strength: "strong",
								confidence: "high",
								domain: "work",
								note: "Creative",
							},
							{
								bigfiveFacet: "altruism",
								deviation: 3,
								strength: "strong",
								confidence: "high",
								domain: "family",
								note: "Giving",
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
								bigfiveFacet: "orderliness",
								deviation: -2,
								strength: "moderate",
								confidence: "high",
								domain: "work",
								note: "Structured",
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
								bigfiveFacet: "self-discipline",
								deviation: 2,
								strength: "strong",
								confidence: "high",
								domain: "health",
								note: "Disciplined",
							},
							{
								bigfiveFacet: "assertiveness",
								deviation: 2,
								strength: "moderate",
								confidence: "high",
								domain: "work",
								note: "Assertive",
							},
						],
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(7);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save weak evidence too", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(
					Effect.succeed({
						evidence: [
							{
								bigfiveFacet: "anxiety",
								deviation: -1,
								strength: "weak",
								confidence: "low",
								domain: "health",
								note: "Low anxiety",
							},
							{
								bigfiveFacet: "intellect",
								deviation: 1,
								strength: "weak",
								confidence: "medium",
								domain: "work",
								note: "Curious",
							},
						],
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({ sessionId: "session_test_123", message: "ok" });

				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(2);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should always call ConversAnalyzer regardless of existing evidence count", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockEvidenceRepo.findBySession.mockReturnValue(
					Effect.succeed(
						Array.from({ length: 100 }, (_, i) => ({
							id: `ev_${i}`,
							sessionId: "session_test_123",
							messageId: `msg_${i}`,
							bigfiveFacet: "imagination" as const,
							deviation: 1,
							strength: "moderate" as const,
							confidence: "medium" as const,
							domain: "work" as const,
							note: `Evidence ${i}`,
							createdAt: new Date(),
						})),
					),
				);

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
