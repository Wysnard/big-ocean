import type {
	RelationshipSharedNoteRecord,
	RelationshipSharedNoteWithAuthor,
} from "@workspace/domain";
import { RelationshipSharedNoteRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const notes: RelationshipSharedNoteWithAuthor[] = [];

/** Clears in-memory notes — call from test `beforeEach` to avoid cross-file leakage. */
export function resetRelationshipSharedNoteMockStore(): void {
	notes.length = 0;
}

export const RelationshipSharedNoteDrizzleRepositoryLive = Layer.succeed(
	RelationshipSharedNoteRepository,
	RelationshipSharedNoteRepository.of({
		listByAnalysisId: (analysisId) =>
			Effect.succeed(notes.filter((n) => n.relationshipAnalysisId === analysisId)),

		insert: (input) => {
			const row: RelationshipSharedNoteRecord = {
				id: `note-${notes.length + 1}-${Date.now()}`,
				relationshipAnalysisId: input.relationshipAnalysisId,
				authorUserId: input.authorUserId,
				body: input.body,
				createdAt: new Date(),
			};
			notes.push({ ...row, authorDisplayName: "Test Author" });
			return Effect.succeed(row);
		},
	}),
);
