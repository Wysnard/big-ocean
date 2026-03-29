/**
 * Assessment Exchange Repository Interface
 *
 * Pure data access layer for assessment_exchange table.
 * One row per conversation turn, storing all pipeline state.
 *
 * Story 23-3: Exchange Table & Schema Migration
 */
import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";
import type {
	EnergyBand,
	ExtractionTier,
	SelectionRule,
	SessionPhase,
	TellingBand,
	TransitionType,
} from "../types/pacing-pipeline.types";

/** Partial update data for an exchange row */
export interface AssessmentExchangeUpdateInput {
	// Extraction
	readonly energy?: number;
	readonly energyBand?: EnergyBand;
	readonly telling?: number;
	readonly tellingBand?: TellingBand;
	readonly withinMessageShift?: boolean;
	readonly stateNotes?: unknown;
	readonly extractionTier?: ExtractionTier;

	// Pacing
	readonly smoothedEnergy?: number;
	readonly sessionTrust?: number;
	readonly drain?: number;
	readonly trustCap?: number;
	readonly eTarget?: number;

	// Scoring
	readonly scorerOutput?: unknown;

	// Selection
	readonly selectedTerritory?: string;
	readonly selectionRule?: SelectionRule;

	// Governor
	readonly governorOutput?: unknown;
	readonly governorDebug?: unknown;

	// Derived
	readonly sessionPhase?: SessionPhase;
	readonly transitionType?: TransitionType;
}

/** Full DB row returned from queries */
export interface AssessmentExchangeRecord {
	readonly id: string;
	readonly sessionId: string;
	readonly turnNumber: number;

	// Extraction
	readonly energy: number | null;
	readonly energyBand: string | null;
	readonly telling: number | null;
	readonly tellingBand: string | null;
	readonly withinMessageShift: boolean | null;
	readonly stateNotes: unknown;
	readonly extractionTier: number | null;

	// Pacing
	readonly smoothedEnergy: number | null;
	readonly sessionTrust: number | null;
	readonly drain: number | null;
	readonly trustCap: number | null;
	readonly eTarget: number | null;

	// Scoring
	readonly scorerOutput: unknown;

	// Selection
	readonly selectedTerritory: string | null;
	readonly selectionRule: string | null;

	// Governor
	readonly governorOutput: unknown;
	readonly governorDebug: unknown;

	// Derived
	readonly sessionPhase: string | null;
	readonly transitionType: string | null;

	readonly createdAt: Date;
}

export class AssessmentExchangeRepository extends Context.Tag("AssessmentExchangeRepository")<
	AssessmentExchangeRepository,
	{
		/**
		 * Create a new exchange row for a turn.
		 * Initially created with just sessionId + turnNumber; other fields filled via update().
		 */
		readonly create: (
			sessionId: string,
			turnNumber: number,
		) => Effect.Effect<AssessmentExchangeRecord, DatabaseError>;

		/**
		 * Update an existing exchange row with pipeline results.
		 * Partial update — only provided fields are set.
		 */
		readonly update: (
			exchangeId: string,
			data: AssessmentExchangeUpdateInput,
		) => Effect.Effect<AssessmentExchangeRecord, DatabaseError>;

		/**
		 * Find all exchanges for a session, ordered by turn number ascending.
		 */
		readonly findBySession: (
			sessionId: string,
		) => Effect.Effect<AssessmentExchangeRecord[], DatabaseError>;

		/**
		 * Find all exchanges for a user across all sessions, ordered by createdAt ascending.
		 */
		readonly findByUserId: (
			userId: string,
		) => Effect.Effect<AssessmentExchangeRecord[], DatabaseError>;
	}
>() {}
