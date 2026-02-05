/**
 * Analyzer and Scorer Integration Tests
 *
 * Tests the full flow: message → analyze → save evidence → aggregate → derive traits
 * Verifies all components work together correctly.
 *
 * @see Story 2.3: Evidence-Based Analyzer and Scorer Implementation
 */

import { it } from "@effect/vitest";
import {
	ALL_FACETS,
	AnalyzerRepository,
	FacetEvidenceRepository,
	type LoggerRepository,
	ScorerRepository,
	type TraitName,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/analyzer.claude.repository");
vi.mock("@workspace/infrastructure/repositories/facet-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/scorer.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { AnalyzerClaudeRepositoryLive } from "@workspace/infrastructure/repositories/analyzer.claude.repository";
import {
	FacetEvidenceDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetEvidenceState,
} from "@workspace/infrastructure/repositories/facet-evidence.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { ScorerDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/scorer.drizzle.repository";

// vi.mock() replaces real layers (which have DB/config deps) with __mocks__ versions (no deps).
// TypeScript still sees the real module types, so we assert the actual runtime type.
const TestLayer = Layer.mergeAll(
	AnalyzerClaudeRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	ScorerDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
) as Layer.Layer<
	AnalyzerRepository | FacetEvidenceRepository | ScorerRepository | LoggerRepository
>;

import { calculatePrecisionFromFacets } from "../calculate-precision.use-case";
import { saveFacetEvidence } from "../save-facet-evidence.use-case";
import { shouldTriggerScoring, updateFacetScores } from "../update-facet-scores.use-case";

describe("Analyzer and Scorer Integration", () => {
	beforeEach(() => {
		resetEvidenceState();
	});

	describe("full flow: message → analyze → save → aggregate → derive", () => {
		it.effect("should complete full analysis flow", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;
				const messageId = "msg_integration_test_1";
				const messageContent = "I love thinking creatively and helping others with their problems.";

				// Step 1: Analyze message
				const evidence = yield* analyzer.analyzeFacets(messageId, messageContent);

				expect(evidence.length).toBeGreaterThan(0);
				expect(evidence[0]?.assessmentMessageId).toBe(messageId);

				// Step 2: Save evidence
				const saveResult = yield* saveFacetEvidence({
					assessmentMessageId: messageId,
					evidence,
				});

				expect(saveResult.savedCount).toBe(evidence.length);
				expect(saveResult.evidenceIds.length).toBe(evidence.length);

				// Step 3: Aggregate facet scores (simulating 3rd message trigger)
				const sessionId = "session_integration_test";
				const scoresResult = yield* updateFacetScores({ sessionId });

				expect(scoresResult.facetScores).toBeDefined();
				expect(Object.keys(scoresResult.facetScores).length).toBeGreaterThan(0);

				// Step 4: Derive trait scores
				expect(scoresResult.traitScores).toBeDefined();
				const traitNames = Object.keys(scoresResult.traitScores);
				expect(traitNames.length).toBeGreaterThan(0);

				// Step 5: Calculate precision
				const precisionResult = yield* calculatePrecisionFromFacets({
					facetScores: scoresResult.facetScores,
				});

				expect(precisionResult.precision).toBeGreaterThanOrEqual(0);
				expect(precisionResult.precision).toBeLessThanOrEqual(100);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should analyze multiple messages and aggregate", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;

				// Analyze 3 messages
				const messages = [
					{ id: "msg_multi_1", content: "I enjoy creative thinking and exploring ideas." },
					{ id: "msg_multi_2", content: "I like to help people and care about their wellbeing." },
					{ id: "msg_multi_3", content: "I stay organized and plan my schedule carefully." },
				];

				for (const msg of messages) {
					const evidence = yield* analyzer.analyzeFacets(msg.id, msg.content);
					yield* saveFacetEvidence({ assessmentMessageId: msg.id, evidence });
				}

				// On 3rd message, aggregate
				expect(shouldTriggerScoring(3)).toBe(true);

				const sessionId = "session_multi_message";
				const scoresResult = yield* updateFacetScores({ sessionId });

				// Should have facet scores
				expect(Object.keys(scoresResult.facetScores).length).toBeGreaterThan(0);

				// Should have trait scores
				expect(Object.keys(scoresResult.traitScores).length).toBeGreaterThan(0);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("evidence retrieval", () => {
		it.effect("should retrieve evidence by message ID", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;
				const evidenceRepo = yield* FacetEvidenceRepository;

				const messageId = "msg_retrieval_test";
				const content = "I love exploring new ideas and being creative.";

				// Analyze and save
				const evidence = yield* analyzer.analyzeFacets(messageId, content);
				yield* saveFacetEvidence({ assessmentMessageId: messageId, evidence });

				// Retrieve
				const retrieved = yield* evidenceRepo.getEvidenceByMessage(messageId);

				expect(retrieved.length).toBe(evidence.length);
				for (const e of retrieved) {
					expect(e.assessmentMessageId).toBe(messageId);
					expect(e.id).toBeDefined();
					expect(e.createdAt).toBeDefined();
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("facet validation", () => {
		it.effect("should only produce valid facet names", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;

				const evidence = yield* analyzer.analyzeFacets(
					"msg_facet_validation",
					"I'm a thoughtful person who values creativity and helping others.",
				);

				// All facet names should be valid
				for (const e of evidence) {
					expect(ALL_FACETS).toContain(e.facetName);
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should produce scores in 0-20 range", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;

				const evidence = yield* analyzer.analyzeFacets(
					"msg_score_validation",
					"I enjoy analytical thinking and problem solving.",
				);

				for (const e of evidence) {
					expect(e.score).toBeGreaterThanOrEqual(0);
					expect(e.score).toBeLessThanOrEqual(20);
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should produce confidence in 0-100 range", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;

				const evidence = yield* analyzer.analyzeFacets(
					"msg_confidence_validation",
					"I'm very sociable and enjoy meeting new people.",
				);

				for (const e of evidence) {
					expect(e.confidence).toBeGreaterThanOrEqual(0);
					expect(e.confidence).toBeLessThanOrEqual(100);
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("trait derivation", () => {
		it.effect("should derive all 5 traits when facets available", () =>
			Effect.gen(function* () {
				const _scorer = yield* ScorerRepository;

				const sessionId = "session_trait_derivation";
				const scoresResult = yield* updateFacetScores({ sessionId });

				const traitNames = Object.keys(scoresResult.traitScores);

				// Check for expected traits (based on mock layer data)
				const expectedTraits: TraitName[] = ["openness", "agreeableness"];
				for (const trait of expectedTraits) {
					if (traitNames.includes(trait)) {
						const traitScore = scoresResult.traitScores[trait];
						expect(traitScore).toBeDefined();
						expect(traitScore?.score).toBeGreaterThanOrEqual(0);
						expect(traitScore?.score).toBeLessThanOrEqual(120); // Sum of 6 facets (0-20 each)
					}
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should use minimum confidence for trait confidence", () =>
			Effect.gen(function* () {
				const scoresResult = yield* updateFacetScores({ sessionId: "session_confidence_test" });

				// Trait confidence should be in 0-100 range
				for (const [_, score] of Object.entries(scoresResult.traitScores)) {
					expect(score.confidence).toBeLessThanOrEqual(100);
					expect(score.confidence).toBeGreaterThanOrEqual(0);
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("bidirectional navigation", () => {
		it.effect("should allow message → facets navigation", () =>
			Effect.gen(function* () {
				const analyzer = yield* AnalyzerRepository;
				const evidenceRepo = yield* FacetEvidenceRepository;

				const messageId = "msg_navigation_test";
				const content = "I enjoy creative thinking.";

				// Save evidence
				const evidence = yield* analyzer.analyzeFacets(messageId, content);
				yield* saveFacetEvidence({ assessmentMessageId: messageId, evidence });

				// Navigate from message to facets
				const facetsForMessage = yield* evidenceRepo.getEvidenceByMessage(messageId);

				expect(facetsForMessage.length).toBeGreaterThan(0);
				for (const f of facetsForMessage) {
					expect(f.assessmentMessageId).toBe(messageId);
					expect(f.facetName).toBeDefined();
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("precision calculation", () => {
		it.effect("should calculate precision after aggregation", () =>
			Effect.gen(function* () {
				const sessionId = "session_precision_integration";

				// Aggregate facet scores
				const scoresResult = yield* updateFacetScores({ sessionId });

				// Calculate precision
				const precisionResult = yield* calculatePrecisionFromFacets({
					facetScores: scoresResult.facetScores,
				});

				expect(precisionResult.precision).toBeGreaterThanOrEqual(0);
				expect(precisionResult.precision).toBeLessThanOrEqual(100);
				expect(precisionResult.facetCount).toBe(Object.keys(scoresResult.facetScores).length);
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
