import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	RelationshipAnalysisRepository,
	RelationshipSharedNoteRepository,
	RelationshipSharedNoteValidationError,
	UserAccountRepository,
} from "@workspace/domain";
import { Effect, Exit, Layer } from "effect";
import { vi } from "vitest";
import { createRelationshipSharedNote } from "../create-relationship-shared-note.use-case";

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

const mockUserAccountRepo = {
	getEmailAndNameForUser: vi.fn(),
	getFirstVisitCompleted: vi.fn(),
	markFirstVisitCompleted: vi.fn(),
	scheduleFirstDailyPrompt: vi.fn(),
	deleteAccount: vi.fn(),
};

const layer = Layer.mergeAll(
	Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
	Layer.succeed(RelationshipSharedNoteRepository, mockNotesRepo),
	Layer.succeed(UserAccountRepository, mockUserAccountRepo),
);

describe("createRelationshipSharedNote", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("rejects empty body", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				createRelationshipSharedNote({
					analysisId: ANALYSIS_ID,
					userId: USER_A,
					body: "   ",
				}),
			);
			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
				expect(exit.cause.error).toBeInstanceOf(RelationshipSharedNoteValidationError);
			}
		}).pipe(Effect.provide(layer)),
	);

	it.effect("creates a trimmed note for a participant", () =>
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
					userAName: "Alice",
					userBName: "Bob",
				}),
			);
			const createdAt = new Date("2026-04-16T12:00:00.000Z");
			mockNotesRepo.insert.mockReturnValue(
				Effect.succeed({
					id: "note-1",
					relationshipAnalysisId: ANALYSIS_ID,
					authorUserId: USER_B,
					body: "Thanks",
					createdAt: createdAt,
				}),
			);
			mockUserAccountRepo.getEmailAndNameForUser.mockReturnValue(
				Effect.succeed({ email: "bob@example.com", name: "Bob Live" }),
			);

			const row = yield* createRelationshipSharedNote({
				analysisId: ANALYSIS_ID,
				userId: USER_B,
				body: "  Thanks  ",
			});

			expect(row.body).toBe("Thanks");
			expect(row.authorDisplayName).toBe("Bob Live");
			expect(mockNotesRepo.insert).toHaveBeenCalledWith({
				relationshipAnalysisId: ANALYSIS_ID,
				authorUserId: USER_B,
				body: "Thanks",
			});
		}).pipe(Effect.provide(layer)),
	);
});
