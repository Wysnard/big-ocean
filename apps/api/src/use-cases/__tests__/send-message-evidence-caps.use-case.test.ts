/**
 * Send Message Use Case Tests — Evidence quality-based filtering
 *
 * Tests weight-threshold filtering (MIN_EVIDENCE_WEIGHT = 0.36) replacing hard caps.
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

	describe("Weight threshold filtering (config.minEvidenceWeight = 0.36)", () => {
		it.effect("should drop evidence with finalWeight below 0.36", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						evidence: [
							// finalWeight: 0.3 * 0.3 = 0.09 — below threshold, dropped
							{
								bigfiveFacet: "anxiety",
								deviation: -1,
								strength: "weak",
								confidence: "low",
								domain: "solo",
								note: "Low anxiety",
							},
							// finalWeight: 0.3 * 0.6 = 0.18 — below threshold, dropped
							{
								bigfiveFacet: "intellect",
								deviation: 1,
								strength: "weak",
								confidence: "medium",
								domain: "work",
								note: "Curious",
							},
							// finalWeight: 0.6 * 0.6 = 0.36 — exactly at threshold, kept
							{
								bigfiveFacet: "trust",
								deviation: 1,
								strength: "moderate",
								confidence: "medium",
								domain: "relationships",
								note: "Trusting",
							},
							// finalWeight: 1.0 * 0.9 = 0.90 — above threshold, kept
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
				expect(savedRecords).toHaveLength(2);

				const facets = savedRecords.map((r: { bigfiveFacet: string }) => r.bigfiveFacet);
				expect(facets).toContain("trust");
				expect(facets).toContain("imagination");
				expect(facets).not.toContain("anxiety");
				expect(facets).not.toContain("intellect");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should keep all 7+ high-quality evidence records", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
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
								domain: "solo",
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

		it.effect("should save nothing when all evidence is below threshold", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						evidence: [
							{
								bigfiveFacet: "anxiety",
								deviation: -1,
								strength: "weak",
								confidence: "low",
								domain: "solo",
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

				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
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

				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
