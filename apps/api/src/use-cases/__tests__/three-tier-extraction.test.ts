/**
 * Three-Tier Extraction Pipeline Tests (Story 24-2)
 *
 * Tests the three-tier ConversAnalyzer extraction strategy:
 * Tier 1: strict schema with retry (3 attempts)
 * Tier 2: lenient schema (1 attempt)
 * Tier 3: neutral defaults (no LLM call)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import {
	ConversanalyzerError,
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { NEUTRAL_DEFAULTS, runThreeTierExtraction } from "../three-tier-extraction";
import type { ThreeTierExtractionInput } from "../three-tier-extraction";

// ---- Mock Repos ----

const mockConversanalyzerRepo = {
	analyze: vi.fn(),
	analyzeLenient: vi.fn(),
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

const successfulV2Output: ConversanalyzerV2Output = {
	userState: {
		energyBand: "high",
		tellingBand: "disclosing",
		energyReason: "User shows enthusiasm",
		tellingReason: "Sharing personal work experience",
		withinMessageShift: false,
	},
	evidence: [
		{
			bigfiveFacet: "imagination",
			deviation: 1,
			strength: "moderate",
			confidence: "medium",
			domain: "work",
			note: "Creative problem solving",
		},
		{
			bigfiveFacet: "competence",
			deviation: 2,
			strength: "strong",
			confidence: "high",
			domain: "work",
			note: "Enjoys complex challenges",
		},
	],
	tokenUsage: { input: 200, output: 50 },
};

const partialV2Output: ConversanalyzerV2Output = {
	userState: {
		energyBand: "steady",
		tellingBand: "mixed",
		energyReason: "",
		tellingReason: "",
		withinMessageShift: false,
	},
	evidence: [
		{
			bigfiveFacet: "imagination",
			deviation: 1,
			strength: "moderate",
			confidence: "medium",
			domain: "work",
			note: "Creative thinking",
		},
	],
	tokenUsage: { input: 180, output: 40 },
};

const conversanalyzerError = new ConversanalyzerError({ message: "LLM call failed" });

describe("Three-Tier Extraction Pipeline (Story 24-2)", () => {
	beforeEach(() => {
		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.error.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockLoggerRepo.debug.mockImplementation(() => {});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Tier 1 — Strict Schema", () => {
		it.effect("happy path: Tier 1 succeeds on first attempt -> extractionTier = 1", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyze.mockReturnValue(Effect.succeed(successfulV2Output));

				const result = yield* runThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(1);
				expect(result.output).toEqual(successfulV2Output);
				expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(1);
				expect(mockConversanalyzerRepo.analyzeLenient).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("Tier 1 retry: fails twice, succeeds on third -> extractionTier = 1", () =>
			Effect.gen(function* () {
				let callCount = 0;
				mockConversanalyzerRepo.analyze.mockImplementation(() => {
					callCount++;
					if (callCount < 3) {
						return Effect.fail(conversanalyzerError);
					}
					return Effect.succeed(successfulV2Output);
				});

				const result = yield* runThreeTierExtraction(testInput);

				expect(result.extractionTier).toBe(1);
				expect(result.output).toEqual(successfulV2Output);
				expect(callCount).toBe(3); // 2 failures + 1 success
				expect(mockConversanalyzerRepo.analyzeLenient).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Tier 2 — Lenient Schema Fallback", () => {
		it.effect(
			"Tier 2 fallback: Tier 1 fails 3 times, Tier 2 succeeds -> extractionTier = 2",
			() =>
				Effect.gen(function* () {
					mockConversanalyzerRepo.analyze.mockReturnValue(Effect.fail(conversanalyzerError));
					mockConversanalyzerRepo.analyzeLenient.mockReturnValue(
						Effect.succeed(successfulV2Output),
					);

					const result = yield* runThreeTierExtraction(testInput);

					expect(result.extractionTier).toBe(2);
					expect(result.output).toEqual(successfulV2Output);
					// Tier 1: 1 initial + 2 retries = 3 calls
					expect(mockConversanalyzerRepo.analyze).toHaveBeenCalledTimes(3);
					expect(mockConversanalyzerRepo.analyzeLenient).toHaveBeenCalledTimes(1);
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"Partial Tier 2: lenient schema returns subset of evidence -> valid items kept",
			() =>
				Effect.gen(function* () {
					mockConversanalyzerRepo.analyze.mockReturnValue(Effect.fail(conversanalyzerError));
					mockConversanalyzerRepo.analyzeLenient.mockReturnValue(
						Effect.succeed(partialV2Output),
					);

					const result = yield* runThreeTierExtraction(testInput);

					expect(result.extractionTier).toBe(2);
					expect(result.output.evidence).toHaveLength(1);
					expect(result.output.evidence[0]?.bigfiveFacet).toBe("imagination");
				}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Tier 3 — Neutral Defaults Fallback", () => {
		it.effect(
			"Tier 3 fallback: both Tier 1 and Tier 2 fail -> neutral defaults returned, extractionTier = 3",
			() =>
				Effect.gen(function* () {
					mockConversanalyzerRepo.analyze.mockReturnValue(Effect.fail(conversanalyzerError));
					mockConversanalyzerRepo.analyzeLenient.mockReturnValue(
						Effect.fail(conversanalyzerError),
					);

					const result = yield* runThreeTierExtraction(testInput);

					expect(result.extractionTier).toBe(3);
					expect(result.output).toEqual(NEUTRAL_DEFAULTS);
					expect(result.output.userState.energyBand).toBe("steady");
					expect(result.output.userState.tellingBand).toBe("mixed");
					expect(result.output.userState.withinMessageShift).toBe(false);
					expect(result.output.evidence).toEqual([]);
					expect(result.output.tokenUsage).toEqual({ input: 0, output: 0 });
				}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Logging", () => {
		it.effect("logs extraction tier on success at info level", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyze.mockReturnValue(Effect.succeed(successfulV2Output));

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

		it.effect("logs at warn level when Tier 2 is used (degraded extraction)", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyze.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeLenient.mockReturnValue(
					Effect.succeed(partialV2Output),
				);

				yield* runThreeTierExtraction(testInput);

				expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
					expect.stringContaining("Tier 2"),
					expect.objectContaining({
						sessionId: "session_test_123",
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("logs at warn level when Tier 3 neutral defaults are used", () =>
			Effect.gen(function* () {
				mockConversanalyzerRepo.analyze.mockReturnValue(Effect.fail(conversanalyzerError));
				mockConversanalyzerRepo.analyzeLenient.mockReturnValue(
					Effect.fail(conversanalyzerError),
				);

				yield* runThreeTierExtraction(testInput);

				expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
					expect.stringContaining("Tier 3"),
					expect.objectContaining({
						sessionId: "session_test_123",
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("NEUTRAL_DEFAULTS constant", () => {
		it("has correct default values", () => {
			expect(NEUTRAL_DEFAULTS.userState.energyBand).toBe("steady");
			expect(NEUTRAL_DEFAULTS.userState.tellingBand).toBe("mixed");
			expect(NEUTRAL_DEFAULTS.userState.withinMessageShift).toBe(false);
			expect(NEUTRAL_DEFAULTS.userState.energyReason).toBe("");
			expect(NEUTRAL_DEFAULTS.userState.tellingReason).toBe("");
			expect(NEUTRAL_DEFAULTS.evidence).toEqual([]);
			expect(NEUTRAL_DEFAULTS.tokenUsage).toEqual({ input: 0, output: 0 });
		});
	});
});
