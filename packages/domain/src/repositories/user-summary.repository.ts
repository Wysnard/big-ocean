/**
 * UserSummary persistence (Story 7.1).
 *
 * One row per assessment result — canonical compressed user-state for Nerin surfaces.
 */

import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

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

export interface UserSummaryRecord {
	readonly id: string;
	readonly userId: string;
	readonly assessmentResultId: string;
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
	readonly version: number;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface UserSummaryUpsertInput {
	readonly userId: string;
	readonly assessmentResultId: string;
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
	readonly version: number;
}

export class UserSummaryRepository extends Context.Tag("UserSummaryRepository")<
	UserSummaryRepository,
	{
		readonly upsertForAssessmentResult: (
			input: UserSummaryUpsertInput,
		) => Effect.Effect<UserSummaryRecord, DatabaseError>;
		readonly getByAssessmentResultId: (
			assessmentResultId: string,
		) => Effect.Effect<UserSummaryRecord | null, DatabaseError>;
		readonly getLatestForUser: (
			userId: string,
		) => Effect.Effect<UserSummaryRecord | null, DatabaseError>;
	}
>() {}
