/**
 * Get Relationship Analysis Use Case Tests (Story 14.4, updated Story 34-1)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AssessmentResultRepository, RelationshipAnalysisRepository } from "@workspace/domain";
import { Effect, Exit, Layer } from "effect";
import { vi } from "vitest";
import { getRelationshipAnalysis } from "../get-relationship-analysis.use-case";

const USER_A = "user-a";
const USER_B = "user-b";
const UNAUTHORIZED_USER = "user-c";
const ANALYSIS_ID = "analysis-123";

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
	getByIdWithParticipantNames: vi.fn(),
};

const mockResultRepo = {
	create: vi.fn(),
	getBySessionId: vi.fn(),
	update: vi.fn(),
	upsert: vi.fn(),
	updateStage: vi.fn(),
	getLatestByUserId: vi.fn(() => Effect.succeed(null)),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(AssessmentResultRepository, mockResultRepo),
	);

describe("getRelationshipAnalysis Use Case (Story 14.4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("returns analysis content and participant names for authorized user", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					userAId: USER_A,
					userBId: USER_B,
					userAResultId: "result-a",
					userBResultId: "result-b",
					content: "# Analysis\n\nContent here",
					modelUsed: "sonnet",
					retryCount: 0,
					createdAt: new Date(),
					userAName: "Alice",
					userBName: "Bob",
				}),
			);

			const result = yield* getRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				userId: USER_A,
			});

			expect(result.analysisId).toBe(ANALYSIS_ID);
			expect(result.content).toContain("Analysis");
			expect(result.isLatestVersion).toBe(true);
			expect(result.userAName).toBe("Alice");
			expect(result.userBName).toBe("Bob");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns null content when analysis is still generating", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					userAId: USER_A,
					userBId: USER_B,
					userAResultId: "result-a",
					userBResultId: "result-b",
					content: null,
					modelUsed: null,
					retryCount: 0,
					createdAt: new Date(),
					userAName: "Alice",
					userBName: "Bob",
				}),
			);

			const result = yield* getRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				userId: USER_A,
			});

			expect(result.analysisId).toBe(ANALYSIS_ID);
			expect(result.content).toBeNull();
			expect(result.userAName).toBe("Alice");
			expect(result.userBName).toBe("Bob");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("fails with RelationshipAnalysisNotFoundError when analysis not found", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(Effect.succeed(null));

			const exit = yield* Effect.exit(
				getRelationshipAnalysis({ analysisId: ANALYSIS_ID, userId: USER_A }),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("RelationshipAnalysisNotFoundError");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("fails with RelationshipAnalysisUnauthorizedError when user is not a participant", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					userAId: USER_A,
					userBId: USER_B,
					userAResultId: "result-a",
					userBResultId: "result-b",
					content: "Analysis content",
					modelUsed: "sonnet",
					retryCount: 0,
					createdAt: new Date(),
					userAName: "Alice",
					userBName: "Bob",
				}),
			);

			const exit = yield* Effect.exit(
				getRelationshipAnalysis({ analysisId: ANALYSIS_ID, userId: UNAUTHORIZED_USER }),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				const error = cause._tag === "Fail" ? cause.error : null;
				expect((error as { _tag: string })._tag).toBe("RelationshipAnalysisUnauthorizedError");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);
});
