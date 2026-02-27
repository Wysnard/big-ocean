/**
 * Relationship Analysis Repository Interface (Story 14.4)
 *
 * Port for relationship analysis CRUD operations.
 * Uses placeholder row pattern: content=NULL means generating.
 * Canonical user ordering: userAId = MIN(inviter, invitee), userBId = MAX(inviter, invitee).
 */

import { Context, Data, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";
import type { RelationshipAnalysis } from "../types/relationship.types";

/**
 * Analysis not found error — infrastructure error, NOT HTTP-facing.
 * Co-located with repository per architecture rules.
 */
export class AnalysisNotFoundError extends Data.TaggedError("AnalysisNotFoundError")<{
	readonly analysisId: string;
}> {}

export class RelationshipAnalysisRepository extends Context.Tag("RelationshipAnalysisRepository")<
	RelationshipAnalysisRepository,
	{
		readonly insertPlaceholder: (input: {
			invitationId: string;
			userAId: string;
			userBId: string;
		}) => Effect.Effect<RelationshipAnalysis | null, DatabaseError>;

		readonly updateContent: (input: {
			id: string;
			content: string;
			modelUsed: string;
		}) => Effect.Effect<RelationshipAnalysis, DatabaseError | AnalysisNotFoundError>;

		readonly incrementRetryCount: (
			id: string,
		) => Effect.Effect<RelationshipAnalysis, DatabaseError | AnalysisNotFoundError>;

		readonly getByInvitationId: (
			invitationId: string,
		) => Effect.Effect<RelationshipAnalysis | null, DatabaseError>;

		readonly getByUserId: (
			userId: string,
		) => Effect.Effect<ReadonlyArray<RelationshipAnalysis>, DatabaseError>;

		readonly getById: (id: string) => Effect.Effect<RelationshipAnalysis | null, DatabaseError>;
	}
>() {}
