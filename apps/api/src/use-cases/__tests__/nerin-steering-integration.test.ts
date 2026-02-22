/**
 * Nerin Steering Integration Test
 *
 * Verifies that the Orchestrator Router processes messages and
 * passes sessionId + messages to Nerin Agent.
 *
 * Uses a spy Nerin layer to capture and verify input parameters.
 * Uses inline test layers for dependencies (logger, config, analyzer)
 * rather than vi.mock() since this test uses real orchestrator infrastructure.
 *
 * Story 2.9: ScorerRepository removed — scorer node uses FacetEvidenceRepository + pure functions.
 * Story 2.11: facetScores removed from ProcessMessageInput — router reads evidence internally.
 * Story 9.2: NerinInvokeInput simplified to { sessionId, messages, targetDomain?, targetFacet? }.
 *            facetScores and steeringHint no longer part of NerinInvokeInput.
 */

import { vi } from "vitest";

// Only mock domain config — the one __mocks__ file that exists
vi.mock("@workspace/domain/config/app-config");

import { describe, expect, it } from "@effect/vitest";
import { MemorySaver } from "@langchain/langgraph";
import {
	AnalyzerRepository,
	AssessmentMessageRepository,
	FacetEvidenceRepository,
	LoggerRepository,
	NerinAgentRepository,
	type NerinInvokeInput,
	OrchestratorRepository,
} from "@workspace/domain";
// vi.mock() replaces this import with __mocks__/app-config.ts which exports createTestAppConfigLayer
// @ts-expect-error -- TS sees the real module (no createTestAppConfigLayer), Vitest resolves the mock
import { createTestAppConfigLayer } from "@workspace/domain/config/app-config";
import {
	CheckpointerRepository,
	OrchestratorGraphLangGraphRepositoryLive,
	OrchestratorLangGraphRepositoryLive,
} from "@workspace/infrastructure";
import { Effect, Layer } from "effect";

// Inline test layers — no vi.mock() needed for these
const TestLoggerLayer = Layer.succeed(
	LoggerRepository,
	LoggerRepository.of({
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
	}),
);

const TestAnalyzerLayer = Layer.succeed(
	AnalyzerRepository,
	AnalyzerRepository.of({
		analyzeFacets: () => Effect.succeed([]),
		analyzeFacetsBatch: (targets) =>
			Effect.succeed(new Map(targets.map((t) => [t.assessmentMessageId, []]))),
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

// Create memory checkpointer layer
const TestCheckpointerLayer = Layer.succeed(CheckpointerRepository, {
	checkpointer: new MemorySaver(),
});

describe("Nerin Steering Integration", () => {
	/**
	 * Story 9.2: NerinInvokeInput now only contains sessionId, messages,
	 * and optional targetDomain/targetFacet. No facetScores or steeringHint.
	 */
	it.effect("passes sessionId and messages to Nerin via orchestrator", () =>
		Effect.gen(function* () {
			// Capture what Nerin receives
			let capturedInput: NerinInvokeInput | null = null;

			// Create a spy Nerin layer that captures input
			const SpyNerinLayer = Layer.succeed(NerinAgentRepository, {
				invoke: (input: NerinInvokeInput) => {
					capturedInput = input;
					return Effect.succeed({
						response: "Spy response",
						tokenCount: { input: 100, output: 50, total: 150 },
					});
				},
			});

			// Build base layer with all dependencies
			const BaseLayer = Layer.mergeAll(
				TestLoggerLayer,
				createTestAppConfigLayer(),
				SpyNerinLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestAssessmentMessageLayer,
				TestCheckpointerLayer,
			);

			// Build graph layer on top of base
			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));

			// Build orchestrator layer on top of graph
			// Type assertion: all deps are satisfied via Layer.provide but TS can't resolve the full chain
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
				Layer.provide(TestAnalyzerLayer),
				Layer.provide(TestFacetEvidenceLayer),
				Layer.provide(TestAssessmentMessageLayer),
			) as Layer.Layer<OrchestratorRepository>;

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			const result = yield* orchestrator.processMessage({
				sessionId: "test-steering-session",
				userMessage: "I prefer working alone in quiet spaces.",
				messages: [],
				messageCount: 2,
				dailyCostUsed: 10,
			});

			// VERIFY: Nerin received the input
			expect(capturedInput).not.toBeNull();
			expect(capturedInput?.sessionId).toBe("test-steering-session");
			expect(capturedInput?.messages).toBeDefined();

			// VERIFY: Response came through
			expect(result.nerinResponse).toBeDefined();
		}),
	);

	it.effect("passes messages to Nerin without steering on first message", () =>
		Effect.gen(function* () {
			let capturedInput: NerinInvokeInput | null = null;

			const SpyNerinLayer = Layer.succeed(NerinAgentRepository, {
				invoke: (input: NerinInvokeInput) => {
					capturedInput = input;
					return Effect.succeed({
						response: "Spy response - no steering",
						tokenCount: { input: 100, output: 50, total: 150 },
					});
				},
			});

			const BaseLayer = Layer.mergeAll(
				TestLoggerLayer,
				createTestAppConfigLayer(),
				SpyNerinLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestAssessmentMessageLayer,
				TestCheckpointerLayer,
			);

			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
				Layer.provide(TestAnalyzerLayer),
				Layer.provide(TestFacetEvidenceLayer),
				Layer.provide(TestAssessmentMessageLayer),
			);

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			const result = yield* orchestrator.processMessage({
				sessionId: "test-no-steering-session",
				userMessage: "Just a normal conversation.",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 5,
			});

			// VERIFY: Nerin received input
			expect(capturedInput).not.toBeNull();
			expect(capturedInput?.sessionId).toBe("test-no-steering-session");

			// VERIFY: No steering on first message (targetDomain/targetFacet undefined)
			expect(capturedInput?.targetDomain).toBeUndefined();
			expect(capturedInput?.targetFacet).toBeUndefined();

			// VERIFY: Output also has no steering
			expect(result.steeringTarget).toBeUndefined();
			expect(result.steeringHint).toBeUndefined();
		}),
	);

	it.effect("invokes Nerin with correct sessionId on first message", () =>
		Effect.gen(function* () {
			let capturedInput: NerinInvokeInput | null = null;

			const SpyNerinLayer = Layer.succeed(NerinAgentRepository, {
				invoke: (input: NerinInvokeInput) => {
					capturedInput = input;
					return Effect.succeed({
						response: "Welcome to your personality assessment!",
						tokenCount: { input: 80, output: 40, total: 120 },
					});
				},
			});

			const BaseLayer = Layer.mergeAll(
				TestLoggerLayer,
				createTestAppConfigLayer(),
				SpyNerinLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestAssessmentMessageLayer,
				TestCheckpointerLayer,
			);

			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
				Layer.provide(TestAnalyzerLayer),
				Layer.provide(TestFacetEvidenceLayer),
				Layer.provide(TestAssessmentMessageLayer),
			);

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			// First message
			const result = yield* orchestrator.processMessage({
				sessionId: "test-first-message",
				userMessage: "Hello, I'm excited to start!",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 0,
			});

			// VERIFY: Nerin received input with correct sessionId
			expect(capturedInput).not.toBeNull();
			expect(capturedInput?.sessionId).toBe("test-first-message");

			// VERIFY: No steering on first message
			expect(capturedInput?.targetDomain).toBeUndefined();
			expect(capturedInput?.targetFacet).toBeUndefined();

			// VERIFY: Response exists
			expect(result.nerinResponse).toBeDefined();
		}),
	);
});
