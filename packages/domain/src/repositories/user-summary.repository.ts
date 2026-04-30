/**
 * UserSummary persistence (ADR-55 — versioned history + frozen reads per assessment result).
 *
 * - **Current** summary for a user: highest `version` for that `user_id`.
 * - **Frozen** summary for a Portrait: the row whose `assessment_result_id` matches the portrait’s result.
 */

import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

/** What triggered this version (ADR-55 refresh sources). */
export type UserSummaryRefreshSource =
	| "assessment_completion"
	| "conversation_extension"
	| "subscriber_chat_completion"
	| "monthly_checkin_aggregation";

export interface UserSummaryThemeEntry {
	readonly theme: string;
	readonly description: string;
	readonly themeAge?: number;
	readonly lastCorroborated?: string;
}

export interface UserSummaryQuoteEntry {
	readonly quote: string;
	readonly themeTag?: string;
	readonly context?: string;
}

/** Denormalized row returned from persistence (content expanded for callers). */
export interface UserSummaryRecord {
	readonly id: string;
	readonly userId: string;
	/** Present for assessment-tied versions; null reserved for future non-assessment rows. */
	readonly assessmentResultId: string | null;
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
	/** Monotonic per `user_id` (ADR-55). */
	readonly version: number;
	readonly refreshSource: UserSummaryRefreshSource;
	readonly generatedAt: Date;
}

export interface UserSummarySaveVersionInput {
	readonly userId: string;
	readonly assessmentResultId: string;
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
	readonly refreshSource: UserSummaryRefreshSource;
	readonly tokenCount?: number;
}

/** Prior summary body for rolling regeneration prompts (ADR-55). */
export interface UserSummaryPreviousSnapshot {
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
}

export class UserSummaryRepository extends Context.Tag("UserSummaryRepository")<
	UserSummaryRepository,
	{
		/**
		 * Append a new version for this user (next version = max(version)+1).
		 * `assessment_result_id` must be unique among rows where it is not null (one frozen snapshot per result).
		 */
		readonly saveVersion: (
			input: UserSummarySaveVersionInput,
		) => Effect.Effect<UserSummaryRecord, DatabaseError>;

		/** Frozen snapshot for this assessment result (Portrait pipeline, ADR-51). */
		readonly getForAssessmentResult: (
			assessmentResultId: string,
		) => Effect.Effect<UserSummaryRecord | null, DatabaseError>;

		/** Latest version for this user (Living Personality Model / relationship letter, ADR-55). */
		readonly getCurrentForUser: (
			userId: string,
		) => Effect.Effect<UserSummaryRecord | null, DatabaseError>;
	}
>() {}
