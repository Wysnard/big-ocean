/**
 * UserSummary LLM generator (Story 7.1) — Claude Haiku, structured JSON output.
 */

import { Context, Effect, Schema as S } from "effect";
import type { ConversationEvidenceRecord } from "./conversation-evidence.repository";
import type {
	UserSummaryPreviousSnapshot,
	UserSummaryQuoteEntry,
	UserSummaryThemeEntry,
} from "./user-summary.repository";

export interface UserSummaryGenerationInput {
	readonly sessionId: string;
	readonly facets: Readonly<Record<string, { score: number; confidence: number }>>;
	readonly evidence: readonly ConversationEvidenceRecord[];
	readonly previousSummary?: UserSummaryPreviousSnapshot | null;
}

export interface UserSummaryGenerationOutput {
	readonly themes: readonly UserSummaryThemeEntry[];
	readonly quoteBank: readonly UserSummaryQuoteEntry[];
	readonly summaryText: string;
	readonly modelUsed: string;
}

export class UserSummaryGenerationError extends S.TaggedError<UserSummaryGenerationError>()(
	"UserSummaryGenerationError",
	{
		message: S.String,
		cause: S.optional(S.String),
	},
) {}

export class UserSummaryGeneratorRepository extends Context.Tag("UserSummaryGeneratorRepository")<
	UserSummaryGeneratorRepository,
	{
		readonly generate: (
			input: UserSummaryGenerationInput,
		) => Effect.Effect<UserSummaryGenerationOutput, UserSummaryGenerationError>;
	}
>() {}
