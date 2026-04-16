/**
 * Create relationship shared note (Story 7.3)
 */

import {
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisRepository,
	RelationshipAnalysisUnauthorizedError,
	RelationshipSharedNoteRepository,
	RelationshipSharedNoteValidationError,
	UserAccountRepository,
} from "@workspace/domain";
import { Effect } from "effect";

const NOTE_MAX_LENGTH = 2000;

export const createRelationshipSharedNote = (input: {
	analysisId: string;
	userId: string;
	body: string;
}) =>
	Effect.gen(function* () {
		const trimmed = input.body.trim();
		if (trimmed.length === 0) {
			return yield* Effect.fail(
				new RelationshipSharedNoteValidationError({
					message: "Note cannot be empty",
				}),
			);
		}
		if (trimmed.length > NOTE_MAX_LENGTH) {
			return yield* Effect.fail(
				new RelationshipSharedNoteValidationError({
					message: `Note must be at most ${NOTE_MAX_LENGTH} characters`,
				}),
			);
		}

		const analysisRepo = yield* RelationshipAnalysisRepository;
		const notesRepo = yield* RelationshipSharedNoteRepository;
		const userAccountRepo = yield* UserAccountRepository;

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
					message: "You are not authorized to add notes to this analysis",
				}),
			);
		}

		const created = yield* notesRepo.insert({
			relationshipAnalysisId: input.analysisId,
			authorUserId: input.userId,
			body: trimmed,
		});

		const identity = yield* userAccountRepo.getEmailAndNameForUser(input.userId);
		const snapshotName = input.userId === analysis.userAId ? analysis.userAName : analysis.userBName;
		const displayName = identity?.name?.trim() || snapshotName || "Someone";

		return {
			id: created.id,
			authorDisplayName: displayName,
			body: created.body,
			createdAt: created.createdAt.toISOString(),
		};
	});
