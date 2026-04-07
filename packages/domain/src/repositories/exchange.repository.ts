/**
 * Assessment Exchange Repository Interface
 *
 * Pure data access layer for assessment_exchange table.
 * One row per conversation turn, storing Director model pipeline state.
 *
 * Story 43-1: Replaced pacing/scoring/governor fields with Director model fields.
 */
import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";
import type { ExtractionTier } from "../types/pacing-pipeline.types";

/** Partial update data for an exchange row */
export interface ExchangeUpdateInput {
	// Extraction
	readonly extractionTier?: ExtractionTier;

	// Director model
	readonly directorOutput?: string;
	readonly coverageTargets?: unknown;
}

/** Full DB row returned from queries */
export interface ExchangeRecord {
	readonly id: string;
	readonly sessionId: string;
	readonly turnNumber: number;

	// Extraction
	readonly extractionTier: number | null;

	// Director model
	readonly directorOutput: string | null;
	readonly coverageTargets: unknown;

	readonly createdAt: Date;
}

export class ExchangeRepository extends Context.Tag("ExchangeRepository")<
	ExchangeRepository,
	{
		/**
		 * Create a new exchange row for a turn.
		 * Initially created with just sessionId + turnNumber; other fields filled via update().
		 */
		readonly create: (
			sessionId: string,
			turnNumber: number,
		) => Effect.Effect<ExchangeRecord, DatabaseError>;

		/**
		 * Update an existing exchange row with pipeline results.
		 * Partial update — only provided fields are set.
		 */
		readonly update: (
			exchangeId: string,
			data: ExchangeUpdateInput,
		) => Effect.Effect<ExchangeRecord, DatabaseError>;

		/**
		 * Find all exchanges for a session, ordered by turn number ascending.
		 */
		readonly findBySession: (sessionId: string) => Effect.Effect<ExchangeRecord[], DatabaseError>;

		/**
		 * Find all exchanges for a user across all sessions, ordered by createdAt ascending.
		 */
		readonly findByUserId: (userId: string) => Effect.Effect<ExchangeRecord[], DatabaseError>;
	}
>() {}
