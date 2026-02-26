/**
 * Portrait Repository Interface (Story 13.3)
 *
 * Database operations for two-tier portrait system (teaser/full).
 * Uses placeholder row pattern: content=NULL means generating.
 * Status derived from data, not stored column.
 */

import { Context, Data, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PortraitTier = "teaser" | "full";

export type PortraitStatus = "none" | "generating" | "ready" | "failed";

export interface Portrait {
	readonly id: string;
	readonly assessmentResultId: string;
	readonly tier: PortraitTier;
	readonly content: string | null;
	readonly lockedSectionTitles: ReadonlyArray<string> | null;
	readonly modelUsed: string;
	readonly retryCount: number;
	readonly createdAt: Date;
}

export interface InsertPortraitPlaceholder {
	readonly assessmentResultId: string;
	readonly tier: PortraitTier;
	readonly modelUsed: string;
}

// ─── Infrastructure Errors (co-located with repository) ─────────────────────

/**
 * Duplicate portrait error — unique constraint violation
 * This is an infrastructure error, NOT HTTP-facing.
 */
export class DuplicatePortraitError extends Data.TaggedError("DuplicatePortraitError")<{
	readonly assessmentResultId: string;
	readonly tier: PortraitTier;
}> {}

/**
 * Portrait not found error — no matching row exists
 * This is an infrastructure error, NOT HTTP-facing.
 */
export class PortraitNotFoundError extends Data.TaggedError("PortraitNotFoundError")<{
	readonly portraitId: string;
}> {}

// ─── Repository Interface ────────────────────────────────────────────────────

export class PortraitRepository extends Context.Tag("PortraitRepository")<
	PortraitRepository,
	{
		/**
		 * Insert a placeholder row for async portrait generation.
		 * content=NULL indicates generation in progress.
		 *
		 * @throws DuplicatePortraitError if (assessment_result_id, tier) already exists
		 */
		readonly insertPlaceholder: (
			data: InsertPortraitPlaceholder,
		) => Effect.Effect<Portrait, DatabaseError | DuplicatePortraitError>;

		/**
		 * Update portrait content (idempotent).
		 * Uses WHERE content IS NULL to ensure only pending portraits are updated.
		 *
		 * @throws PortraitNotFoundError if no row with matching id AND content IS NULL
		 */
		readonly updateContent: (
			id: string,
			content: string,
		) => Effect.Effect<Portrait, DatabaseError | PortraitNotFoundError>;

		/**
		 * Increment retry count after failed generation attempt.
		 */
		readonly incrementRetryCount: (
			id: string,
		) => Effect.Effect<Portrait, DatabaseError | PortraitNotFoundError>;

		/**
		 * Get portrait by assessment result ID and tier.
		 * Returns null if not found.
		 */
		readonly getByResultIdAndTier: (
			assessmentResultId: string,
			tier: PortraitTier,
		) => Effect.Effect<Portrait | null, DatabaseError>;

		/**
		 * Update locked section titles on a portrait row.
		 *
		 * @throws PortraitNotFoundError if no row with matching id
		 */
		readonly updateLockedSectionTitles: (
			id: string,
			titles: ReadonlyArray<string>,
		) => Effect.Effect<Portrait, DatabaseError | PortraitNotFoundError>;

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
