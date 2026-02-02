/**
 * Save Facet Evidence Use Case
 *
 * Business logic for persisting FacetEvidence from the Analyzer.
 * Validates evidence structure and saves to database.
 *
 * Integration: FacetEvidenceRepository via dependency injection (hexagonal architecture).
 *
 * @see packages/domain/src/types/facet-evidence.ts
 * @see packages/domain/src/repositories/facet-evidence.repository.ts
 */

import { Effect } from "effect";
import {
  ALL_FACETS,
  EvidenceValidationError,
  FacetEvidenceRepository,
  FacetEvidencePersistenceError,
  isFacetName,
  LoggerRepository,
  type FacetEvidence,
} from "@workspace/domain";

export interface SaveFacetEvidenceInput {
  readonly assessmentMessageId: string;
  readonly evidence: FacetEvidence[];
}

export interface SaveFacetEvidenceOutput {
  readonly savedCount: number;
  readonly evidenceIds: string[];
}

/**
 * Validates a single FacetEvidence record.
 *
 * Checks:
 * - Score is in 0-20 range
 * - Confidence is in 0-1 range
 * - Facet name is valid (one of 30 defined facets)
 * - Highlight range is valid (start < end)
 */
const validateEvidence = (
  assessmentMessageId: string,
  evidence: FacetEvidence
): Effect.Effect<void, EvidenceValidationError> =>
  Effect.gen(function* () {
    // Validate score range
    if (evidence.score < 0 || evidence.score > 20) {
      yield* Effect.fail(
        new EvidenceValidationError({
          assessmentMessageId,
          field: "score",
          value: evidence.score,
          reason: `Score must be between 0 and 20, got ${evidence.score}`,
        })
      );
    }

    // Validate confidence range
    if (evidence.confidence < 0 || evidence.confidence > 1) {
      yield* Effect.fail(
        new EvidenceValidationError({
          assessmentMessageId,
          field: "confidence",
          value: evidence.confidence,
          reason: `Confidence must be between 0 and 1, got ${evidence.confidence}`,
        })
      );
    }

    // Validate facet name
    if (!isFacetName(evidence.facetName)) {
      yield* Effect.fail(
        new EvidenceValidationError({
          assessmentMessageId,
          field: "facetName",
          value: evidence.facetName,
          reason: `Invalid facet name: ${evidence.facetName}. Must be one of: ${ALL_FACETS.join(", ")}`,
        })
      );
    }

    // Validate highlight range
    if (evidence.highlightRange.start >= evidence.highlightRange.end) {
      yield* Effect.fail(
        new EvidenceValidationError({
          assessmentMessageId,
          field: "highlightRange",
          value: evidence.highlightRange,
          reason: `Highlight range start (${evidence.highlightRange.start}) must be less than end (${evidence.highlightRange.end})`,
        })
      );
    }
  });

/**
 * Save Facet Evidence Use Case
 *
 * Validates and persists FacetEvidence records to the database.
 *
 * Dependencies: FacetEvidenceRepository, LoggerRepository
 * Returns: Count of saved records and their IDs
 *
 * @example
 * ```typescript
 * const result = yield* saveFacetEvidence({
 *   assessmentMessageId: "msg_123",
 *   evidence: [
 *     { facetName: "imagination", score: 16, confidence: 0.85, ... }
 *   ]
 * })
 * console.log(result.savedCount) // 1
 * ```
 */
export const saveFacetEvidence = (
  input: SaveFacetEvidenceInput
): Effect.Effect<
  SaveFacetEvidenceOutput,
  EvidenceValidationError | FacetEvidencePersistenceError,
  FacetEvidenceRepository | LoggerRepository
> =>
  Effect.gen(function* () {
    const evidenceRepo = yield* FacetEvidenceRepository;
    const logger = yield* LoggerRepository;

    // Handle empty evidence array
    if (input.evidence.length === 0) {
      logger.debug("No evidence to save", { assessmentMessageId: input.assessmentMessageId });
      return { savedCount: 0, evidenceIds: [] };
    }

    // Validate all evidence records
    for (const evidence of input.evidence) {
      yield* validateEvidence(input.assessmentMessageId, evidence);
    }

    logger.info("Saving facet evidence", {
      assessmentMessageId: input.assessmentMessageId,
      evidenceCount: input.evidence.length,
      facets: input.evidence.map((e) => e.facetName),
    });

    // Save evidence to database
    const savedEvidence = yield* evidenceRepo.saveEvidence(
      input.assessmentMessageId,
      input.evidence
    );

    logger.info("Facet evidence saved", {
      assessmentMessageId: input.assessmentMessageId,
      savedCount: savedEvidence.length,
      evidenceIds: savedEvidence.map((e) => e.id),
    });

    return {
      savedCount: savedEvidence.length,
      evidenceIds: savedEvidence.map((e) => e.id),
    };
  });
