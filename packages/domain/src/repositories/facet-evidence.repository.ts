/**
 * Facet Evidence Repository Interface
 *
 * Defines the contract for persisting and retrieving FacetEvidence records.
 * Part of the hexagonal architecture - this is a PORT (interface).
 *
 * Implementations:
 * - FacetEvidenceDrizzleRepositoryLive (production)
 * - createTestFacetEvidenceLayer (testing)
 *
 * @see packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts
 */

import { Context, Effect } from "effect";
import type { FacetEvidence, FacetName } from "../types/facet-evidence.js";
import { FacetEvidencePersistenceError } from "../errors/evidence.errors.js";

/**
 * Saved evidence record with database-generated ID.
 */
export interface SavedFacetEvidence extends FacetEvidence {
  readonly id: string;
  readonly createdAt: Date;
}

/**
 * Facet Evidence Repository Interface
 *
 * Handles persistence of FacetEvidence records to the database.
 */
export interface FacetEvidenceRepository {
  /**
   * Save multiple facet evidence records for a message.
   *
   * @param messageId - The message ID these evidence records belong to
   * @param evidence - Array of FacetEvidence to persist
   * @returns Effect containing saved evidence with generated IDs
   *
   * @example
   * ```typescript
   * const saved = yield* evidenceRepo.saveEvidence("msg_123", [
   *   { facetName: "imagination", score: 16, confidence: 0.85, quote: "...", highlightRange: { start: 0, end: 20 } }
   * ])
   * console.log(saved[0].id) // "evidence_abc123"
   * ```
   */
  saveEvidence(
    messageId: string,
    evidence: FacetEvidence[]
  ): Effect.Effect<SavedFacetEvidence[], FacetEvidencePersistenceError>;

  /**
   * Get all evidence records for a specific message.
   *
   * @param messageId - The message ID to get evidence for
   * @returns Effect containing array of saved evidence records
   */
  getEvidenceByMessage(
    messageId: string
  ): Effect.Effect<SavedFacetEvidence[], FacetEvidencePersistenceError>;

  /**
   * Get all evidence records for a specific facet within a session.
   *
   * @param sessionId - The session ID
   * @param facetName - The facet name to filter by
   * @returns Effect containing array of saved evidence records
   */
  getEvidenceByFacet(
    sessionId: string,
    facetName: FacetName
  ): Effect.Effect<SavedFacetEvidence[], FacetEvidencePersistenceError>;

  /**
   * Get all evidence records for a session.
   *
   * @param sessionId - The session ID
   * @returns Effect containing array of saved evidence records
   */
  getEvidenceBySession(
    sessionId: string
  ): Effect.Effect<SavedFacetEvidence[], FacetEvidencePersistenceError>;
}

/**
 * Context.Tag for FacetEvidenceRepository
 *
 * Used for dependency injection via Effect's Layer system.
 */
export const FacetEvidenceRepository = Context.GenericTag<FacetEvidenceRepository>(
  "FacetEvidenceRepository"
);
