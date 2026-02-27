/**
 * Get Relationship Analysis Use Case Tests (Story 14.4)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { RelationshipAnalysisRepository } from "@workspace/domain";
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
	getByInvitationId: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo));

describe("getRelationshipAnalysis Use Case (Story 14.4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("returns analysis content for authorized user", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getById.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					invitationId: "inv-1",
					userAId: USER_A,
					userBId: USER_B,
					content: "# Analysis\n\nContent here",
					modelUsed: "sonnet",
					retryCount: 0,
					createdAt: new Date(),
				}),
			);

			const result = yield* getRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				userId: USER_A,
			});

			expect(result.analysisId).toBe(ANALYSIS_ID);
			expect(result.content).toContain("Analysis");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("fails with RelationshipAnalysisNotFoundError when analysis not found", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getById.mockReturnValue(Effect.succeed(null));

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
			mockAnalysisRepo.getById.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					invitationId: "inv-1",
					userAId: USER_A,
					userBId: USER_B,
					content: "Analysis content",
					modelUsed: "sonnet",
					retryCount: 0,
					createdAt: new Date(),
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

	it.effect("fails with RelationshipAnalysisNotFoundError when content is null", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getById.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					invitationId: "inv-1",
					userAId: USER_A,
					userBId: USER_B,
					content: null,
					modelUsed: null,
					retryCount: 0,
					createdAt: new Date(),
				}),
			);

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
});
