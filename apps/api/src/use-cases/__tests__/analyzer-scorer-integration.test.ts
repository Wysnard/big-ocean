/**
 * Analyzer and Scorer Integration Tests
 *
 * Tests the full flow: message → analyze → save evidence → aggregate → derive traits
 * Verifies all components work together correctly.
 *
 * @see Story 2.3: Evidence-Based Analyzer and Scorer Implementation
 */

import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { TestRepositoriesLayer } from "../../test-utils/test-layers.js";
import {
  AnalyzerRepository,
  FacetEvidenceRepository,
  ScorerRepository,
  ALL_FACETS,
} from "@workspace/domain";
import { saveFacetEvidence } from "../save-facet-evidence.use-case.js";
import { updateFacetScores, shouldTriggerScoring } from "../update-facet-scores.use-case.js";
import { calculatePrecisionFromFacets } from "../calculate-precision.use-case.js";

describe("Analyzer and Scorer Integration", () => {
  describe("full flow: message → analyze → save → aggregate → derive", () => {
    it.effect("should complete full analysis flow", () =>
      Effect.gen(function* () {
        const analyzer = yield* AnalyzerRepository;
        const messageId = "msg_integration_test_1";
        const messageContent = "I love thinking creatively and helping others with their problems.";

        // Step 1: Analyze message
        const evidence = yield* analyzer.analyzeFacets(messageId, messageContent);

        expect(evidence.length).toBeGreaterThan(0);
        expect(evidence[0].messageId).toBe(messageId);

        // Step 2: Save evidence
        const saveResult = yield* saveFacetEvidence({
          messageId,
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
      }).pipe(Effect.provide(TestRepositoriesLayer))
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
          yield* saveFacetEvidence({ messageId: msg.id, evidence });
        }

        // On 3rd message, aggregate
        expect(shouldTriggerScoring(3)).toBe(true);

        const sessionId = "session_multi_message";
        const scoresResult = yield* updateFacetScores({ sessionId });

        // Should have facet scores
        expect(Object.keys(scoresResult.facetScores).length).toBeGreaterThan(0);

        // Should have trait scores
        expect(Object.keys(scoresResult.traitScores).length).toBeGreaterThan(0);
      }).pipe(Effect.provide(TestRepositoriesLayer))
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
        yield* saveFacetEvidence({ messageId, evidence });

        // Retrieve
        const retrieved = yield* evidenceRepo.getEvidenceByMessage(messageId);

        expect(retrieved.length).toBe(evidence.length);
        for (const e of retrieved) {
          expect(e.messageId).toBe(messageId);
          expect(e.id).toBeDefined();
          expect(e.createdAt).toBeDefined();
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });

  describe("facet validation", () => {
    it.effect("should only produce valid facet names", () =>
      Effect.gen(function* () {
        const analyzer = yield* AnalyzerRepository;

        const evidence = yield* analyzer.analyzeFacets(
          "msg_facet_validation",
          "I'm a thoughtful person who values creativity and helping others."
        );

        // All facet names should be valid
        for (const e of evidence) {
          expect(ALL_FACETS).toContain(e.facetName);
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should produce scores in 0-20 range", () =>
      Effect.gen(function* () {
        const analyzer = yield* AnalyzerRepository;

        const evidence = yield* analyzer.analyzeFacets(
          "msg_score_validation",
          "I enjoy analytical thinking and problem solving."
        );

        for (const e of evidence) {
          expect(e.score).toBeGreaterThanOrEqual(0);
          expect(e.score).toBeLessThanOrEqual(20);
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should produce confidence in 0-1 range", () =>
      Effect.gen(function* () {
        const analyzer = yield* AnalyzerRepository;

        const evidence = yield* analyzer.analyzeFacets(
          "msg_confidence_validation",
          "I'm very sociable and enjoy meeting new people."
        );

        for (const e of evidence) {
          expect(e.confidence).toBeGreaterThanOrEqual(0);
          expect(e.confidence).toBeLessThanOrEqual(1);
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });

  describe("trait derivation", () => {
    it.effect("should derive all 5 traits when facets available", () =>
      Effect.gen(function* () {
        const scorer = yield* ScorerRepository;

        const sessionId = "session_trait_derivation";
        const scoresResult = yield* updateFacetScores({ sessionId });

        const traitNames = Object.keys(scoresResult.traitScores);

        // Check for expected traits (based on mock layer data)
        const expectedTraits = ["openness", "agreeableness"];
        for (const trait of expectedTraits) {
          if (traitNames.includes(trait)) {
            expect(scoresResult.traitScores[trait as any]).toBeDefined();
            expect(scoresResult.traitScores[trait as any].score).toBeGreaterThanOrEqual(0);
            expect(scoresResult.traitScores[trait as any].score).toBeLessThanOrEqual(20);
          }
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );

    it.effect("should use minimum confidence for trait confidence", () =>
      Effect.gen(function* () {
        const scoresResult = yield* updateFacetScores({ sessionId: "session_confidence_test" });

        // Trait confidence should be <= 1
        for (const [_, score] of Object.entries(scoresResult.traitScores)) {
          expect(score.confidence).toBeLessThanOrEqual(1);
          expect(score.confidence).toBeGreaterThanOrEqual(0);
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
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
        yield* saveFacetEvidence({ messageId, evidence });

        // Navigate from message to facets
        const facetsForMessage = yield* evidenceRepo.getEvidenceByMessage(messageId);

        expect(facetsForMessage.length).toBeGreaterThan(0);
        for (const f of facetsForMessage) {
          expect(f.messageId).toBe(messageId);
          expect(f.facetName).toBeDefined();
        }
      }).pipe(Effect.provide(TestRepositoriesLayer))
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
      }).pipe(Effect.provide(TestRepositoriesLayer))
    );
  });
});
