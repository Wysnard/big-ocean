/**
 * Relationship Analysis Repository Interface (Story 14.4, updated Story 34-1, Story 35-4)
 *
 * Port for relationship analysis CRUD operations.
 * Uses placeholder row pattern: content=NULL means generating.
 * Canonical user ordering: userAId = MIN(inviter, invitee), userBId = MAX(inviter, invitee).
 *
 * Updated: invitationId replaced with userAResultId/userBResultId (ADR-10).
 * Story 35-4: Added listByUserId for version management.
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
			userAId: string;
			userBId: string;
			userAResultId: string;
			userBResultId: string;
		}) => Effect.Effect<RelationshipAnalysis | null, DatabaseError>;

		readonly updateContent: (input: {
			id: string;
			content: string;
			modelUsed: string;
		}) => Effect.Effect<RelationshipAnalysis, DatabaseError | AnalysisNotFoundError>;

		readonly incrementRetryCount: (
			id: string,
		) => Effect.Effect<RelationshipAnalysis, DatabaseError | AnalysisNotFoundError>;

		readonly getByUserId: (
			userId: string,
		) => Effect.Effect<ReadonlyArray<RelationshipAnalysis>, DatabaseError>;

		readonly getById: (id: string) => Effect.Effect<RelationshipAnalysis | null, DatabaseError>;

		readonly getByIdWithParticipantNames: (
			id: string,
		) => Effect.Effect<
			(RelationshipAnalysis & { userAName: string; userBName: string }) | null,
			DatabaseError
		>;

		/**
		 * List all analyses for a user with participant names (Story 35-4).
		 * JOINs through user table for both participants.
		 * Ordered by createdAt DESC.
		 */
		readonly listByUserId: (
			userId: string,
		) => Effect.Effect<
			ReadonlyArray<RelationshipAnalysis & { userAName: string; userBName: string }>,
			DatabaseError
		>;

		readonly getParticipantEmails: (analysisId: string) => Effect.Effect<
			{
				userAId: string;
				userAEmail: string;
				userAName: string;
				userBId: string;
				userBEmail: string;
				userBName: string;
			} | null,
			DatabaseError
		>;
	}
>() {}
