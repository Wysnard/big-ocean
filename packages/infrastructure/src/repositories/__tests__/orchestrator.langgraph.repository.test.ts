/**
 * Orchestrator LangGraph Repository Tests
 *
 * Tests for the OrchestratorLangGraphRepositoryLive Effect Layer.
 * Uses pure Effect DI with mock layers for testing.
 *
 * Story 2.11: Lean response — no facetEvidence/facetScores/traitScores in output.
 * Batch decision computed by caller from messageCount.
 */

import {
	AnalyzerRepository,
	AssessmentMessageRepository,
	BudgetPausedError,
	createInitialFacetScoresMap,
	FacetEvidenceRepository,
	type GraphOutput,
	type LoggerMethods,
	LoggerRepository,
	OrchestratorGraphRepository,
	OrchestratorRepository,
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

const createMockLogger = (): LoggerMethods => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
});

interface MockGraphConfig {
	nerinResponse?: string;
	tokenUsage?: { input: number; output: number; total: number };
	costIncurred?: number;
}

/**
 * Creates a mock OrchestratorGraphRepository layer.
 * Story 2.11: Lean output — no scoring data.
 */
function createMockGraphLayer(config: MockGraphConfig = {}) {
	return Layer.succeed(
		OrchestratorGraphRepository,
		OrchestratorGraphRepository.of({
			invoke: (input, _threadId) =>
				Effect.gen(function* () {
					// Simulate router node - budget check
					if (input.dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
						return yield* Effect.fail(
							new BudgetPausedError(
								input.sessionId,
								"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
								getNextDayMidnightUTC(),
								50,
							),
						);
					}

					// Calculate steering (using default scores — real router reads from DB)
					const facetScores = createInitialFacetScoresMap();
					const steeringTarget = getSteeringTarget(facetScores);
					const steeringHint = getSteeringHint(steeringTarget);

					const output: GraphOutput = {
						nerinResponse: config.nerinResponse ?? `Response to: ${input.userMessage}`,
						tokenUsage: config.tokenUsage ?? { input: 100, output: 50, total: 150 },
						costIncurred: config.costIncurred ?? 0.0043,
						steeringTarget: steeringTarget ?? undefined,
						steeringHint: steeringHint ?? undefined,
					};

					return output;
				}),
		}),
	);
}

const TestAnalyzerLayer = Layer.succeed(
	AnalyzerRepository,
	AnalyzerRepository.of({
		analyzeFacets: () => Effect.succeed([]),
	}),
);

const TestFacetEvidenceLayer = Layer.succeed(
	FacetEvidenceRepository,
	FacetEvidenceRepository.of({
		saveEvidence: () => Effect.succeed([]),
		getEvidenceByMessage: () => Effect.succeed([]),
		getEvidenceByFacet: () => Effect.succeed([]),
		getEvidenceBySession: () => Effect.succeed([]),
	}),
);

const TestAssessmentMessageLayer = Layer.succeed(
	AssessmentMessageRepository,
	AssessmentMessageRepository.of({
		saveMessage: () =>
			Effect.succeed({
				id: "msg_test",
				sessionId: "test-session",
				role: "user",
				content: "",
				createdAt: new Date(),
			} as never),
		getMessages: () => Effect.succeed([]),
		getMessageCount: () => Effect.succeed(0),
	}),
);

function createTestLayers(config: MockGraphConfig = {}) {
	const loggerLayer = Layer.succeed(LoggerRepository, LoggerRepository.of(createMockLogger()));
	const graphLayer = createMockGraphLayer(config);

	return OrchestratorLangGraphRepositoryLive.pipe(
		Layer.provide(
			Layer.mergeAll(
				loggerLayer,
				graphLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestAssessmentMessageLayer,
			),
		),
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

			expect(caughtError).toBeDefined();
			const errorMessage = String(caughtError);
			expect(errorMessage).toContain("BudgetPausedError");
			expect(errorMessage).toContain("saved");
		});

		it("returns steering target and hint", async () => {
			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					return yield* orchestrator.processMessage({
						sessionId: "test-session",
						userMessage: "Test message",
						messages: [],
						messageCount: 1,
						dailyCostUsed: 10,
					});
				}).pipe(Effect.provide(createTestLayers())),
			);

			// With default scores, steering target may or may not be set
			// Just verify the fields exist in the response
			expect("steeringTarget" in result).toBe(true);
			expect("steeringHint" in result).toBe(true);
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

	describe("processAnalysis", () => {
		it("completes without error", async () => {
			await Effect.runPromise(
				Effect.gen(function* () {
					const orchestrator = yield* OrchestratorRepository;

					yield* orchestrator.processAnalysis({
						sessionId: "test-session",
						messages: [],
						messageCount: 3,
					});
				}).pipe(Effect.provide(createTestLayers())),
			);
		});
	});
});
