/**
 * List relationship shared notes (Story 7.3)
 */

import {
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisRepository,
	RelationshipAnalysisUnauthorizedError,
	RelationshipSharedNoteRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export const listRelationshipSharedNotes = (input: { analysisId: string; userId: string }) =>
	Effect.gen(function* () {
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const notesRepo = yield* RelationshipSharedNoteRepository;

		const analysis = yield* analysisRepo.getByIdWithParticipantNames(input.analysisId);

		if (!analysis) {
			return yield* Effect.fail(
				new RelationshipAnalysisNotFoundError({
					message: `Relationship analysis not found: ${input.analysisId}`,
				}),
			);
		}

		if (analysis.userAId !== input.userId && analysis.userBId !== input.userId) {
			return yield* Effect.fail(
				new RelationshipAnalysisUnauthorizedError({
					message: "You are not authorized to view this analysis",
				}),
			);
		}

		const rows = yield* notesRepo.listByAnalysisId(input.analysisId);

		return rows.map((n) => ({
			id: n.id,
			authorDisplayName: n.authorDisplayName,
			body: n.body,
			createdAt: n.createdAt.toISOString(),
		}));
	});
