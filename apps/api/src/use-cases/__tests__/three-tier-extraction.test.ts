/**
 * Three-Tier Extraction Pipeline Tests (Story 24-2, Story 42-2)
 *
 * Tests the split three-tier ConversAnalyzer extraction strategy:
 * - Two parallel calls (user state + evidence), each with:
 *   Tier 1: strict schema with retry (3 attempts)
 *   Tier 2: lenient schema (1 attempt)
 *   Tier 3: neutral defaults (no LLM call)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	ConversanalyzerError,
	type ConversanalyzerEvidenceOutput,
	ConversanalyzerRepository,
	type ConversanalyzerUserStateOutput,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import type { ThreeTierExtractionInput } from "../three-tier-extraction";
import { runSplitThreeTierExtraction } from "../three-tier-extraction";

// ---- Mock Repos ----

const mockConversanalyzerRepo = {
	analyzeUserState: vi.fn(),
	analyzeUserStateLenient: vi.fn(),
	analyzeEvidence: vi.fn(),
	analyzeEvidenceLenient: vi.fn(),
};

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(ConversanalyzerRepository, mockConversanalyzerRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
	);

// ---- Test Data ----

const testInput: ThreeTierExtractionInput = {
	sessionId: "session_test_123",
	message: "I enjoy solving complex problems at work",
	recentMessages: [
		{ id: "msg_1", role: "assistant", content: "Tell me more about your work." },
		{ id: "msg_2", role: "user", content: "I enjoy solving complex problems at work" },
	],
	domainDistribution: { work: 2, relationships: 1, leisure: 0, self: 0, growth: 0, health: 0 },
};

const successfulUserState: ConversanalyzerUserStateOutput = {
	userState: {
		energyBand: "high",
		tellingBand: "mostly_compliant",
		energyReason: "User shows enthusiasm",
		tellingReason: "Sharing personal work experience",
		withinMessageShift: false,
	},
	tokenUsage: { input: 100, output: 25 },
};

const successfulEvidence: ConversanalyzerEvidenceOutput = {
	evidence: [
		{
			bigfiveFacet: "imagination",
			deviation: 1,
			strength: "moderate",
			confidence: "medium",
			domain: "work",
			note: "Creative problem solving",
		},
	],
	tokenUsage: { input: 100, output: 25 },
};

const conversanalyzerError = new ConversanalyzerError({ message: "LLM call failed" });

describe("Split Three-Tier Extraction Pipeline (Story 42-2)", () => {
	beforeEach(() => {
		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Both calls succeed at Tier 1", () => {
		it.effect("happy path: both extractions succeed -> extractionTier = 1", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeUserState.mockReturnValue(Effect.succeed(successfulUserState));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.succeed(successfulEvidence));

				const result = yield* runSplitThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(1);
				expect(result.output.userState.energyBand).toBe("high");
				expect(result.output.evidence).toHaveLength(1);
				expect(result.output.tokenUsage).toEqual({ input: 200, output: 50 });
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Independent fallback", () => {
		it.effect("user state falls to Tier 3, evidence succeeds at Tier 1 -> extractionTier = 3", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeUserState.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeUserStateLenient.mockReturnValue(
					Effect.fail(conversanalyzerError),
				);
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.succeed(successfulEvidence));

				const result = yield* runSplitThreeTierExtraction(testInput);

				// Worst tier wins
				expect(result.extractionTier).toBe(3);
				// User state defaults
				expect(result.output.userState.energyBand).toBe("steady");
				expect(result.output.userState.tellingBand).toBe("mixed");
				// Evidence still present
				expect(result.output.evidence).toHaveLength(1);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("evidence falls to Tier 3, user state succeeds at Tier 1 -> extractionTier = 3", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeUserState.mockReturnValue(Effect.succeed(successfulUserState));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
					Effect.fail(conversanalyzerError),
				);

				const result = yield* runSplitThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(3);
				expect(result.output.userState.energyBand).toBe("high");
				expect(result.output.evidence).toEqual([]);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Both calls fail to Tier 3", () => {
		it.effect("both fail -> neutral defaults for everything, extractionTier = 3", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeUserState.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeUserStateLenient.mockReturnValue(
					Effect.fail(conversanalyzerError),
				);
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
					Effect.fail(conversanalyzerError),
				);

				const result = yield* runSplitThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(3);
				expect(result.output.userState.energyBand).toBe("steady");
				expect(result.output.userState.tellingBand).toBe("mixed");
				expect(result.output.userState.withinMessageShift).toBe(false);
				expect(result.output.evidence).toEqual([]);
				expect(result.output.tokenUsage).toEqual({ input: 0, output: 0 });
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Retry behavior", () => {
		it.effect("user state retries 3 times before falling to Tier 2", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeUserState.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeUserStateLenient.mockReturnValue(
					Effect.succeed(successfulUserState),
				);
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.succeed(successfulEvidence));

				const result = yield* runSplitThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(2);
				// 1 initial + 2 retries = 3 calls
				expect(mockConversanalyzerRepo.analyzeUserState).toHaveBeenCalledTimes(3);
				expect(mockConversanalyzerRepo.analyzeUserStateLenient).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Sequential execution order (Story 42-4)", () => {
		it.effect("calls user state before evidence extraction", () =>
			Effect.gen(function* () {
				const callOrder: string[] = [];

				mockConversanalyzerRepo.analyzeUserState.mockImplementation(() => {
					callOrder.push("userState");
					return Effect.succeed(successfulUserState);
				});
				mockConversanalyzerRepo.analyzeEvidence.mockImplementation(() => {
					callOrder.push("evidence");
					return Effect.succeed(successfulEvidence);
				});

				yield* runSplitThreeTierExtraction(testInput);

				// User state must complete before evidence starts
				expect(callOrder).toEqual(["userState", "evidence"]);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("evidence still runs when user state fails to Tier 3", () =>
			Effect.gen(function* () {
				const callOrder: string[] = [];

				mockConversanalyzerRepo.analyzeUserState.mockImplementation(() => {
					callOrder.push("userState");
					return Effect.fail(conversanalyzerError);
				});
				mockConversanalyzerRepo.analyzeUserStateLenient.mockImplementation(() => {
					callOrder.push("userStateLenient");
					return Effect.fail(conversanalyzerError);
				});
				mockConversanalyzerRepo.analyzeEvidence.mockImplementation(() => {
					callOrder.push("evidence");
					return Effect.succeed(successfulEvidence);
				});

				const result = yield* runSplitThreeTierExtraction(testInput);

				// User state should be attempted (and fail) before evidence runs
				expect(callOrder[callOrder.length - 1]).toBe("evidence");
				// Evidence should succeed despite user state failure
				expect(result.output.evidence).toHaveLength(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Logging", () => {
		it.effect("logs completion with both tier numbers", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeUserState.mockReturnValue(Effect.succeed(successfulUserState));
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.succeed(successfulEvidence));

				yield* runSplitThreeTierExtraction(testInput);

				expect(mockLoggerRepo.info).toHaveBeenCalledWith(
					expect.stringContaining("extraction"),
					expect.objectContaining({
						userStateTier: 1,
						evidenceTier: 1,
						sessionId: "session_test_123",
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
