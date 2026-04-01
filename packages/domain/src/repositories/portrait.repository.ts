/**
 * Portrait Repository Interface (Story 13.3, refactored for queue-based generation)
 *
 * Database operations for portrait system.
 * Row inserted only on final outcome: content (success) or failedAt (failure).
 * Status derived from portrait row + purchase event, not stored column.
 */

import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PortraitTier = "full";

export type PortraitStatus = "none" | "generating" | "ready" | "failed";

export interface Portrait {
	readonly id: string;
	readonly assessmentResultId: string;
	readonly tier: PortraitTier;
	readonly content: string | null;
	readonly modelUsed: string | null;
	readonly failedAt: Date | null;
	readonly createdAt: Date;
}

export interface InsertPortraitWithContent {
	readonly assessmentResultId: string;
	readonly tier: PortraitTier;
	readonly content: string;
	readonly modelUsed: string;
}

export interface InsertPortraitFailed {
	readonly assessmentResultId: string;
	readonly tier: PortraitTier;
	readonly failedAt: Date;
}

// ─── Repository Interface ────────────────────────────────────────────────────

export class PortraitRepository extends Context.Tag("PortraitRepository")<
	PortraitRepository,
	{
		/**
		 * Insert a completed portrait with content (success path).
		 * Uses ON CONFLICT DO NOTHING for idempotency on (assessment_result_id, tier).
		 * Returns the portrait row, or null if it already existed.
		 */
		readonly insertWithContent: (
			data: InsertPortraitWithContent,
		) => Effect.Effect<Portrait | null, DatabaseError>;

		/**
		 * Insert a failed portrait record (failure path — retries exhausted).
		 * Uses ON CONFLICT DO NOTHING for idempotency on (assessment_result_id, tier).
		 * Returns the portrait row, or null if it already existed.
		 */
		readonly insertFailed: (
			data: InsertPortraitFailed,
		) => Effect.Effect<Portrait | null, DatabaseError>;

		/**
		 * Delete portrait by assessment result ID and tier.
		 * Used for manual retry: delete the failed row so generation can create a new one.
		 * Returns true if a row was deleted, false if nothing matched.
		 */
		readonly deleteByResultIdAndTier: (
			assessmentResultId: string,
			tier: PortraitTier,
		) => Effect.Effect<boolean, DatabaseError>;

		/**
		 * Get portrait by assessment result ID and tier.
		 * Returns null if not found.
		 */
		readonly getByResultIdAndTier: (
			assessmentResultId: string,
			tier: PortraitTier,
		) => Effect.Effect<Portrait | null, DatabaseError>;

		/**
		 * Get full portrait by session ID.
		 * Joins through assessment_sessions → assessment_results → portraits.
		 * Returns null if no full portrait exists (no completed assessment or no portrait row).
		 */
		readonly getFullPortraitBySessionId: (
			sessionId: string,
		) => Effect.Effect<Portrait | null, DatabaseError>;
	}
>() {}
