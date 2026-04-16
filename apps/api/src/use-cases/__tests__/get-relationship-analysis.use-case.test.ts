/**
 * Get Relationship Analysis Use Case Tests (Story 14.4, updated Story 34-1, Story 7.3)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	type AssessmentResultRecord,
	AssessmentResultRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { Effect, Exit, Layer } from "effect";
import { vi } from "vitest";
import { getRelationshipAnalysis } from "../get-relationship-analysis.use-case";

const USER_A = "user-a";
const USER_B = "user-b";
const UNAUTHORIZED_USER = "user-c";
const ANALYSIS_ID = "analysis-123";

const emptyCoverage = {} as Record<string, never>;

const traitBlock = (score: number, confidence: number) => ({
	openness: { score, confidence },
	conscientiousness: { score, confidence },
	extraversion: { score, confidence },
	agreeableness: { score, confidence },
	neuroticism: { score, confidence },
});

function makeResult(
	id: string,
	facets: Record<string, { score: number; confidence: number }>,
	traits: Record<string, { score: number; confidence: number }>,
): AssessmentResultRecord {
	return {
		id,
		assessmentSessionId: "sess-1",
		facets: facets as AssessmentResultRecord["facets"],
		traits: traits as AssessmentResultRecord["traits"],
		domainCoverage: emptyCoverage,
		portrait: "",
		stage: "completed",
		createdAt: new Date(),
	};
}

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
	getById: vi.fn(),
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
		mockResultRepo.getById.mockImplementation((id: string) => {
			if (id === "result-a") {
				return Effect.succeed(
					makeResult("result-a", { imagination: { score: 12, confidence: 0.9 } }, traitBlock(48, 0.9)),
				);
			}
			if (id === "result-b") {
				return Effect.succeed(
					makeResult("result-b", { imagination: { score: 8, confidence: 0.8 } }, traitBlock(40, 0.8)),
				);
			}
			return Effect.succeed(null);
		});
	});

	it.effect("returns analysis content, comparison maps, and timestamps for authorized user", () =>
		Effect.gen(function* () {
			const completedAt = new Date("2026-04-16T10:00:00.000Z");
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					userAId: USER_A,
					userBId: USER_B,
					userAResultId: "result-a",
					userBResultId: "result-b",
					content: "# Analysis\n\nContent here",
					contentCompletedAt: completedAt,
					modelUsed: "sonnet",
					retryCount: 0,
					createdAt: new Date("2026-04-15T12:00:00.000Z"),
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
			expect(result.userAFacets.imagination?.score).toBe(12);
			expect(result.userBFacets.imagination?.score).toBe(8);
			expect(result.userATraits.openness?.score).toBe(48);
			expect(result.userBTraits.openness?.score).toBe(40);
			expect(result.contentCompletedAt).toBe(completedAt.toISOString());
			expect(result.createdAt).toBeDefined();
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
					contentCompletedAt: null,
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
			expect(result.isLatestVersion).toBe(true);
			expect(result.userAFacets).toEqual({});
			expect(result.userBFacets).toEqual({});
			expect(result.userATraits).toEqual({});
			expect(result.userBTraits).toEqual({});
			expect(result.contentCompletedAt).toBeNull();
			expect(mockResultRepo.getById).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("treats blank content as null and skips assessment reads", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getByIdWithParticipantNames.mockReturnValue(
				Effect.succeed({
					id: ANALYSIS_ID,
					userAId: USER_A,
					userBId: USER_B,
					userAResultId: "result-a",
					userBResultId: "result-b",
					content: "   ",
					contentCompletedAt: null,
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

			expect(result.content).toBeNull();
			expect(result.userAFacets).toEqual({});
			expect(mockResultRepo.getById).not.toHaveBeenCalled();
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
					contentCompletedAt: null,
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
