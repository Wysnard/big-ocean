import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface WeeklySummary {
	readonly id: string;
	readonly userId: string;
	readonly weekStartDate: string;
	readonly weekEndDate: string;
	readonly content: string | null;
	readonly generatedAt: Date | null;
	readonly failedAt: Date | null;
	readonly retryCount: number;
	readonly llmCostCents: number | null;
	readonly createdAt: Date;
}

export type WeeklySummarySaveInput =
	| {
			readonly outcome: "generated";
			readonly userId: string;
			readonly weekStartDate: string;
			readonly weekEndDate: string;
			readonly content: string;
			readonly generatedAt: Date;
			readonly llmCostCents?: number;
	  }
	| {
			readonly outcome: "failed";
			readonly userId: string;
			readonly weekStartDate: string;
			readonly weekEndDate: string;
			readonly failedAt: Date;
	  };

export class WeeklySummaryRepository extends Context.Tag("WeeklySummaryRepository")<
	WeeklySummaryRepository,
	{
		/** Insert or update one row per (user_id, week_start_date). */
		readonly save: (input: WeeklySummarySaveInput) => Effect.Effect<WeeklySummary, DatabaseError>;
		readonly getByUserAndWeekStart: (
			userId: string,
			weekStartDate: string,
		) => Effect.Effect<WeeklySummary | null, DatabaseError>;
		/** Resolve ISO `YYYY-Www` to stored row for that user + week. */
		readonly getByWeekId: (
			userId: string,
			weekId: string,
		) => Effect.Effect<WeeklySummary | null, DatabaseError>;
		readonly getByUserId: (userId: string) => Effect.Effect<WeeklySummary[], DatabaseError>;
		readonly getLatestForUser: (userId: string) => Effect.Effect<WeeklySummary | null, DatabaseError>;

		/** Rows with LLM cost since `since` (Story 11-1 — circuit breaker numerator). */
		readonly listGeneratedCostsSince: (
			since: Date,
		) => Effect.Effect<ReadonlyArray<{ userId: string; llmCostCents: number }>, DatabaseError>;
	}
>() {}
