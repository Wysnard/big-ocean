/**
 * Three-Tier Extraction Pipeline Tests (Story 24-2, Story 42-2, Story 43-6)
 *
 * Tests the evidence-only three-tier ConversAnalyzer extraction strategy:
 * - Tier 1: strict schema with retry (3 attempts)
 * - Tier 2: lenient schema (1 attempt)
 * - Tier 3: neutral defaults (no LLM call)
 *
 * User-state extraction removed in Story 43-6 — Director reads energy/telling natively.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	ConversanalyzerError,
	type ConversanalyzerEvidenceOutput,
	ConversanalyzerRepository,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import type { ThreeTierExtractionInput } from "../three-tier-extraction";
import { runThreeTierExtraction } from "../three-tier-extraction";

// ---- Mock Repos ----

const mockConversanalyzerRepo = {
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

describe("Three-Tier Extraction Pipeline (Story 43-6 — evidence-only)", () => {
	beforeEach(() => {
		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Tier 1: strict succeeds", () => {
		it.effect("happy path: evidence extraction succeeds -> extractionTier = 1", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.succeed(successfulEvidence));

				const result = yield* runThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(1);
				expect(result.output.evidence).toHaveLength(1);
				expect(result.output.tokenUsage).toEqual({ input: 100, output: 25 });
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Tier 2: lenient fallback", () => {
		it.effect("strict fails, lenient succeeds -> extractionTier = 2", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
					Effect.succeed(successfulEvidence),
				);

				const result = yield* runThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(2);
				expect(result.output.evidence).toHaveLength(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Tier 3: neutral defaults", () => {
		it.effect("both tiers fail -> neutral defaults, extractionTier = 3", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
					Effect.fail(conversanalyzerError),
				);

				const result = yield* runThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(3);
				expect(result.output.evidence).toEqual([]);
				expect(result.output.tokenUsage).toEqual({ input: 0, output: 0 });
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Retry behavior", () => {
		it.effect("retries strict 3 times before falling to Tier 2", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeEvidenceLenient.mockReturnValue(
					Effect.succeed(successfulEvidence),
				);

				const result = yield* runThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(2);
				// 1 initial + 2 retries = 3 calls
				expect(mockConversanalyzerRepo.analyzeEvidence).toHaveBeenCalledTimes(3);
				expect(mockConversanalyzerRepo.analyzeEvidenceLenient).toHaveBeenCalledTimes(1);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Logging", () => {
		it.effect("logs completion with extraction tier", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyzeEvidence.mockReturnValue(Effect.succeed(successfulEvidence));

				yield* runThreeTierExtraction(testInput);

				expect(mockLoggerRepo.info).toHaveBeenCalledWith(
					expect.stringContaining("extraction"),
					expect.objectContaining({
						extractionTier: 1,
						sessionId: "session_test_123",
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
