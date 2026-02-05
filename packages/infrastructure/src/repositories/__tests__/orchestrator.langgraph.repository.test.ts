/**
 * Orchestrator LangGraph Repository Tests
 *
 * Tests for the OrchestratorLangGraphRepositoryLive Effect Layer.
 * Uses pure Effect DI with mock layers for testing.
 */

import { HumanMessage } from "@langchain/core/messages";
import {
	BudgetPausedError,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	type FacetScoresMap,
	type GraphOutput,
	type LoggerMethods,
	LoggerRepository,
	OrchestratorGraphRepository,
	OrchestratorRepository,
	type TraitScoresMap,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";
import { OrchestratorLangGraphRepositoryLive } from "../orchestrator.langgraph.repository";
import {
	DAILY_COST_LIMIT,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
} from "../orchestrator.nodes";

// ============================================
// Test Utilities
// ============================================

/**
 * Creates a mock logger for tests.
 */
const createMockLogger = (): LoggerMethods => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
});

/**
 * Mock graph output for tests.
 */
interface MockGraphConfig {
	nerinResponse?: string;
	tokenUsage?: { input: number; output: number; total: number };
	costIncurred?: number;
	facetEvidence?: GraphOutput["facetEvidence"];
	facetScores?: FacetScoresMap;
	traitScores?: TraitScoresMap;
}

/**
 * Creates a mock OrchestratorGraphRepository layer.
 * Simulates the graph behavior (router, nerin, analyzer, scorer) without LangGraph.
 */
function createMockGraphLayer(config: MockGraphConfig = {}) {
	return Layer.succeed(
		OrchestratorGraphRepository,
		OrchestratorGraphRepository.of({
			invoke: (input, _threadId) =>
				Effect.gen(function* () {
					// Simulate router node - budget check
					if (input.dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
						const overallConfidence = input.facetScores
							? calculateConfidenceFromFacetScores(input.facetScores)
							: 50;

						return yield* Effect.fail(
							new BudgetPausedError(
								input.sessionId,
								"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
								getNextDayMidnightUTC(),
								overallConfidence,
							),
						);
					}

					// Calculate steering
					const steeringTarget = getSteeringTarget(input.facetScores ?? createInitialFacetScoresMap());
					const steeringHint = getSteeringHint(steeringTarget);

					// Determine if batch
					const isBatchMessage = input.messageCount % 3 === 0;

					// Build base response
					const baseOutput: GraphOutput = {
						nerinResponse: config.nerinResponse ?? `Response to: ${input.userMessage}`,
						tokenUsage: config.tokenUsage ?? { input: 100, output: 50, total: 150 },
						costIncurred: config.costIncurred ?? 0.0043,
						isBatchMessage,
						steeringTarget: steeringTarget ?? undefined,
						steeringHint: steeringHint ?? undefined,
					};

					// Add batch processing results if batch message
					if (isBatchMessage) {
						return {
							...baseOutput,
							facetEvidence: config.facetEvidence ?? [
								{
									assessmentMessageId: "msg-1",
									facetName: "imagination" as const,
									score: 14,
									confidence: 75,
									quote: "test",
									highlightRange: { start: 0, end: 4 },
								},
							],
							facetScores:
								config.facetScores ??
								createInitialFacetScoresMap({
									imagination: { score: 14, confidence: 75 },
								}),
							traitScores:
								config.traitScores ??
								createInitialTraitScoresMap({
									openness: { score: 70, confidence: 75 },
								}),
						};
					}

					return baseOutput;
				}),
		}),
	);
}

/**
 * Creates the test layer stack with mock dependencies.
 */
function createTestLayers(config: MockGraphConfig = {}) {
	const loggerLayer = Layer.succeed(LoggerRepository, LoggerRepository.of(createMockLogger()));

	const graphLayer = createMockGraphLayer(config);

	// OrchestratorLangGraphRepositoryLive requires OrchestratorGraphRepository + LoggerRepository
	return OrchestratorLangGraphRepositoryLive.pipe(
		Layer.provide(Layer.mergeAll(loggerLayer, graphLayer)),
	);
}

// ============================================
// Tests
// ============================================

describe("OrchestratorLangGraphRepository", () => {
	describe("processMessage", () => {
		it("processes non-batch message successfully", async () => {
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					return yield* orchestrator.processMessage({
						sessionId: "test-session",
						userMessage: "Hello there!",
						messages: [],
						messageCount: 1,
						dailyCostUsed: 10,
					});
				}).pipe(Effect.provide(createTestLayers())),
			);

			expect(result.nerinResponse).toContain("Response to: Hello there!");
			expect(result.tokenUsage).toBeDefined();
			expect(result.costIncurred).toBeGreaterThan(0);
			// Non-batch: no scoring data
			expect(result.facetEvidence).toBeUndefined();
			expect(result.facetScores).toBeUndefined();
		});

		it("processes batch message with scoring", async () => {
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					return yield* orchestrator.processMessage({
						sessionId: "test-session",
						userMessage: "I enjoy creative activities",
						messages: [new HumanMessage("Previous message")],
						messageCount: 3, // Batch trigger
						dailyCostUsed: 10,
					});
				}).pipe(Effect.provide(createTestLayers())),
			);

			expect(result.nerinResponse).toBeDefined();
			expect(result.facetEvidence).toBeDefined();
			expect(result.facetEvidence).toHaveLength(1);
			expect(result.facetScores).toBeDefined();
			expect(result.traitScores).toBeDefined();
			// Precision is now a map, check imagination facet
		});

		it("throws BudgetPausedError when budget exceeded", async () => {
			let caughtError: unknown;

			try {
				await Effect.runPromise(
					Effect.gen(function* () {
						const orchestrator = yield* OrchestratorRepository;

						return yield* orchestrator.processMessage({
							sessionId: "test-session",
							userMessage: "Hello",
							messages: [],
							messageCount: 1,
							dailyCostUsed: 75, // At limit
						});
					}).pipe(Effect.provide(createTestLayers())),
				);
			} catch (error) {
				caughtError = error;
			}

			// Effect wraps errors in FiberFailure - check the message/cause
			expect(caughtError).toBeDefined();
			const errorMessage = String(caughtError);
			expect(errorMessage).toContain("BudgetPausedError");
			expect(errorMessage).toContain("saved");
		});

		it("calculates steering target from existing facet scores", async () => {
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					return yield* orchestrator.processMessage({
						sessionId: "test-session",
						userMessage: "Test message",
						messages: [],
						messageCount: 1,
						dailyCostUsed: 10,
						facetScores: createInitialFacetScoresMap({
							imagination: { score: 16, confidence: 80 },
							orderliness: { score: 8, confidence: 20 }, // outlier
							altruism: { score: 14, confidence: 75 },
						}),
					});
				}).pipe(Effect.provide(createTestLayers())),
			);

			expect(result.steeringTarget).toBe("orderliness");
			expect(result.steeringHint).toContain("organize");
		});

		it("processes 6th message as batch", async () => {
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					return yield* orchestrator.processMessage({
						sessionId: "test-session",
						userMessage: "Another message",
						messages: [],
						messageCount: 6, // Batch trigger
						dailyCostUsed: 20,
					});
				}).pipe(Effect.provide(createTestLayers())),
			);

			expect(result.facetEvidence).toBeDefined();
			expect(result.facetScores).toBeDefined();
			expect(result.traitScores).toBeDefined();
		});

		it("includes token usage and cost in response", async () => {
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					return yield* orchestrator.processMessage({
						sessionId: "test-session",
						userMessage: "Hello",
						messages: [],
						messageCount: 1,
						dailyCostUsed: 10,
					});
				}).pipe(Effect.provide(createTestLayers())),
			);

			expect(result.tokenUsage).toEqual({
				input: 100,
				output: 50,
				total: 150,
			});
			expect(result.costIncurred).toBe(0.0043);
		});
	});
});
