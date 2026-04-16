/**
 * Relationship shared notes (Story 7.3 — Section D1)
 *
 * User-owned notes visible to both participants in a relationship analysis dyad.
 */

import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface RelationshipSharedNoteRecord {
	readonly id: string;
	readonly relationshipAnalysisId: string;
	readonly authorUserId: string;
	readonly body: string;
	readonly createdAt: Date;
}

export interface RelationshipSharedNoteWithAuthor extends RelationshipSharedNoteRecord {
	readonly authorDisplayName: string;
}

export class RelationshipSharedNoteRepository extends Context.Tag(
	"RelationshipSharedNoteRepository",
)<
	RelationshipSharedNoteRepository,
	{
		readonly listByAnalysisId: (
			analysisId: string,
		) => Effect.Effect<ReadonlyArray<RelationshipSharedNoteWithAuthor>, DatabaseError>;

		readonly insert: (input: {
			relationshipAnalysisId: string;
			authorUserId: string;
			body: string;
		}) => Effect.Effect<RelationshipSharedNoteRecord, DatabaseError>;
	}
>() {}
