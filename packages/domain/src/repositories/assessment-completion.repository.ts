import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface CommitAssessmentCompletionInput {
	readonly sessionId: string;
	readonly userId: string;
	readonly assessmentResultId: string;
}

/**
 * Atomic persistence for the terminal Assessment Finalization commit:
 * `assessment_results.stage=completed`, session completion, and the shareable public profile row.
 *
 * Implemented as a single database transaction in the Drizzle adapter.
 */
export class AssessmentCompletionRepository extends Context.Tag("AssessmentCompletionRepository")<
	AssessmentCompletionRepository,
	{
		readonly commitCompletionWithPublicProfile: (
			input: CommitAssessmentCompletionInput,
		) => Effect.Effect<void, DatabaseError>;
	}
>() {}
