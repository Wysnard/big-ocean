/**
 * Weekly summary (Sunday letter) generator — Claude Sonnet markdown output.
 */

import { Context, Data, Effect } from "effect";
import type { DailyCheckInMood } from "./daily-check-in.repository";

export interface WeeklySummaryCheckInLine {
	readonly localDate: string;
	readonly mood: DailyCheckInMood;
	readonly note: string | null;
}

export interface WeeklySummaryGenerationInput {
	readonly weekId: string;
	readonly weekStartDate: string;
	readonly weekEndDate: string;
	readonly checkIns: readonly WeeklySummaryCheckInLine[];
	readonly oceanCode: string;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly traitLines: readonly string[];
}

export interface WeeklySummaryGenerationOutput {
	readonly content: string;
	readonly modelUsed: string;
	/** LLM spend for this letter (Story 11-1). */
	readonly llmCostCents: number;
}

export class WeeklySummaryGenerationError extends Data.TaggedError("WeeklySummaryGenerationError")<{
	readonly message: string;
	readonly cause?: string;
}> {}

export class WeeklySummaryGeneratorRepository extends Context.Tag(
	"WeeklySummaryGeneratorRepository",
)<
	WeeklySummaryGeneratorRepository,
	{
		readonly generateLetter: (
			input: WeeklySummaryGenerationInput,
		) => Effect.Effect<WeeklySummaryGenerationOutput, WeeklySummaryGenerationError>;
	}
>() {}
