/**
 * Send Message Use Case Tests — Evidence cap enforcement (Story 18-3)
 *
 * Tests per-message cap (top 5 by finalWeight) and session-level cap (80 records).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import type { ConversationEvidenceRecord } from "@workspace/domain";
import { Effect } from "effect";
import {
	PER_MESSAGE_EVIDENCE_CAP,
	SESSION_EVIDENCE_CAP,
	sendMessage,
} from "../send-message.use-case";
import {
	createTestLayer,
	mockConversanalyzerRepo,
	mockEvidenceRepo,
	mockLoggerRepo,
	mockMessageRepo,
	postColdStartMessages,
	setupDefaultMocks,
} from "./__fixtures__/send-message.fixtures";

describe("sendMessage — Evidence cap enforcement (Story 18-3)", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("exports correct cap constants", () => {
		expect(PER_MESSAGE_EVIDENCE_CAP).toBe(5);
		expect(SESSION_EVIDENCE_CAP).toBe(80);
	});

	describe("Per-message cap — top 5 by finalWeight", () => {
		it.effect("should sort by finalWeight and keep top 5 when >5 records returned", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockConversanalyzerRepo.analyze.mockReturnValue(
					Effect.succeed({
						evidence: [
							// finalWeight: 0.3 * 0.3 = 0.09 (weakest — should be dropped)
							{
								bigfiveFacet: "anxiety",
								deviation: -1,
								strength: "weak",
								confidence: "low",
								domain: "solo",
								note: "Low anxiety",
							},
							// finalWeight: 1.0 * 0.9 = 0.90 (strongest)
							{
								bigfiveFacet: "imagination",
								deviation: 3,
								strength: "strong",
								confidence: "high",
								domain: "work",
								note: "Creative",
							},
							// finalWeight: 0.6 * 0.6 = 0.36
							{
								bigfiveFacet: "trust",
								deviation: 1,
								strength: "moderate",
								confidence: "medium",
								domain: "relationships",
								note: "Trusting",
							},
							// finalWeight: 0.6 * 0.9 = 0.54
							{
								bigfiveFacet: "orderliness",
								deviation: -2,
								strength: "moderate",
								confidence: "high",
								domain: "work",
								note: "Structured",
							},
							// finalWeight: 1.0 * 0.6 = 0.60
							{
								bigfiveFacet: "cheerfulness",
								deviation: 2,
								strength: "strong",
								confidence: "medium",
								domain: "leisure",
								note: "Joyful",
							},
							// finalWeight: 0.3 * 0.6 = 0.18 (second weakest — should be dropped)
							{
								bigfiveFacet: "intellect",
								deviation: 1,
								strength: "weak",
								confidence: "medium",
								domain: "work",
								note: "Curious",
							},
							// finalWeight: 1.0 * 0.9 = 0.90 (tied strongest)
							{
								bigfiveFacet: "altruism",
								deviation: 3,
								strength: "strong",
								confidence: "high",
								domain: "family",
								note: "Giving",
							},
						],
						tokenUsage: { input: 200, output: 50 },
					}),
				);

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				expect(mockEvidenceRepo.save).toHaveBeenCalledTimes(1);
				const savedRecords = mockEvidenceRepo.save.mock.calls[0][0];
				expect(savedRecords).toHaveLength(5);

				// The two weakest (anxiety: 0.09, intellect: 0.18) should be dropped
				const facets = savedRecords.map((r: { bigfiveFacet: string }) => r.bigfiveFacet);
				expect(facets).not.toContain("anxiety");
				expect(facets).not.toContain("intellect");
				// Top 5 should be present
				expect(facets).toContain("imagination");
				expect(facets).toContain("altruism");
				expect(facets).toContain("cheerfulness");
				expect(facets).toContain("orderliness");
				expect(facets).toContain("trust");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Session-level cap", () => {
		function makeExistingEvidence(count: number): ConversationEvidenceRecord[] {
			return Array.from({ length: count }, (_, i) => ({
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
			}));
		}

		it.effect("should skip ConversAnalyzer when session has 80+ evidence records", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed(makeExistingEvidence(80)));

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				// ConversAnalyzer should NOT be called
				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
				expect(mockEvidenceRepo.save).not.toHaveBeenCalled();
				// Info log about cap
				expect(mockLoggerRepo.info).toHaveBeenCalledWith(
					"Session evidence cap reached, skipping ConversAnalyzer",
					expect.objectContaining({
						sessionId: "session_test_123",
						evidenceCount: 80,
						cap: SESSION_EVIDENCE_CAP,
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should skip ConversAnalyzer when session has >80 evidence records", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed(makeExistingEvidence(95)));

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				expect(mockConversanalyzerRepo.analyze).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should still call ConversAnalyzer when session has 79 evidence records", () =>
			Effect.gen(function* () {
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(postColdStartMessages));
				mockEvidenceRepo.findBySession.mockReturnValue(Effect.succeed(makeExistingEvidence(79)));

				yield* sendMessage({ sessionId: "session_test_123", message: "I work in tech" });

				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
