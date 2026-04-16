import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	RelationshipAnalysisRepository,
	RelationshipSharedNoteRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { listRelationshipSharedNotes } from "../list-relationship-shared-notes.use-case";

const USER_A = "user-a";
const USER_B = "user-b";
const ANALYSIS_ID = "analysis-1";

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
	getByIdWithParticipantNames: vi.fn(),
	listByUserId: vi.fn(),
	getParticipantEmails: vi.fn(),
};

const mockNotesRepo = {
	listByAnalysisId: vi.fn(),
	insert: vi.fn(),
};

const layer = Layer.mergeAll(
	Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
	Layer.succeed(RelationshipSharedNoteRepository, mockNotesRepo),
);

describe("listRelationshipSharedNotes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("returns notes for a participant", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					userAId: USER_A,
					userBId: USER_B,
					userAResultId: "r1",
					userBResultId: "r2",
					content: "x",
					contentCompletedAt: null,
					modelUsed: null,
					retryCount: 0,
					createdAt: new Date(),
					userAName: "A",
					userBName: "B",
				}),
			);
			const created = new Date("2026-04-16T12:00:00.000Z");
			mockNotesRepo.listByAnalysisId.mockReturnValue(
				Effect.succeed([
					{
						id: "n1",
						relationshipAnalysisId: ANALYSIS_ID,
						authorUserId: USER_A,
						body: "Hello",
						createdAt: created,
						authorDisplayName: "A",
					},
				]),
			);

			const rows = yield* listRelationshipSharedNotes({
				analysisId: ANALYSIS_ID,
				userId: USER_B,
			});

			expect(rows).toHaveLength(1);
			expect(rows[0]?.body).toBe("Hello");
			expect(rows[0]?.authorDisplayName).toBe("A");
			expect(rows[0]?.createdAt).toBe(created.toISOString());
		}).pipe(Effect.provide(layer)),
	);
});
