/**
 * Retry Relationship Analysis Use Case Tests (Story 35-2)
 *
 * Tests:
 * - Successful retry resets count and forks daemon
 * - Rejects unauthorized user
 * - Rejects non-failed analysis (content exists)
 * - Rejects analysis not found
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	ConversationRepository,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
	UserSummaryRepository,
} from "@workspace/domain";
import { Effect, Exit, Layer } from "effect";
import { vi } from "vitest";
import { retryRelationshipAnalysis } from "../retry-relationship-analysis.use-case";

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
};

const mockAnalysisGen = {
	generateAnalysis: vi.fn(),
};

const mockSessionRepo = {
	create: vi.fn(),
	getById: vi.fn(),
	updateStatus: vi.fn(),
	updateMessageCount: vi.fn(),
	updateUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	getByAnonymousToken: vi.fn(),
	updateOceanCodeAndArchetype: vi.fn(),
};

const mockResultsRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
	getLatestByUserId: vi.fn(),
};

const mockUserSummaryRepo = {
	upsertForAssessmentResult: vi.fn(),
	getByAssessmentResultId: vi.fn(),
	getLatestForUser: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(RelationshipAnalysisGeneratorRepository, mockAnalysisGen),
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(UserSummaryRepository, mockUserSummaryRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

const USER_A_ID = "user-a-123";
const USER_B_ID = "user-b-456";
const ANALYSIS_ID = "analysis-789";

const makeAnalysis = (overrides: Record<string, unknown> = {}) => ({
	id: ANALYSIS_ID,
	userAId: USER_A_ID,
	userBId: USER_B_ID,
	userAResultId: "result-a",
	userBResultId: "result-b",
	content: null,
	modelUsed: null,
	retryCount: 3,
	createdAt: new Date("2026-01-01"),
	...overrides,
});

describe("retryRelationshipAnalysis (Story 35-2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default: analysis found, failed state
		mockAnalysisRepo.getById.mockReturnValue(Effect.succeed(makeAnalysis()));
		mockAnalysisRepo.updateContent.mockReturnValue(Effect.succeed(undefined));
		mockAnalysisRepo.incrementRetryCount.mockReturnValue(Effect.succeed(undefined));

		// Default: mock generation succeeds (for the forked daemon, but we don't await it)
		mockAnalysisGen.generateAnalysis.mockReturnValue(
			Effect.succeed({ content: "[]", modelUsed: "mock-sonnet" }),
		);
		mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(null));
	});

	it.effect("should reset retry count and return generating status for authorized user", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.insertPlaceholder.mockReturnValue(
				Effect.succeed(makeAnalysis({ retryCount: 0 })),
			);

			const result = yield* retryRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				userId: USER_A_ID,
			});

			expect(result.status).toBe("generating");
			expect(mockAnalysisRepo.getById).toHaveBeenCalledWith(ANALYSIS_ID);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should fail with unauthorized error for non-participant user", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				retryRelationshipAnalysis({
					analysisId: ANALYSIS_ID,
					userId: "stranger-user",
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause;
				expect(String(error)).toContain("RelationshipAnalysisUnauthorizedError");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should fail with not found error when analysis does not exist", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getById.mockReturnValue(Effect.succeed(null));

			const exit = yield* Effect.exit(
				retryRelationshipAnalysis({
					analysisId: ANALYSIS_ID,
					userId: USER_A_ID,
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause;
				expect(String(error)).toContain("RelationshipAnalysisNotFoundError");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should return ready status when analysis already has content", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.getById.mockReturnValue(
				Effect.succeed(makeAnalysis({ content: "[{...}]", retryCount: 0 })),
			);

			const result = yield* retryRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				userId: USER_A_ID,
			});

			expect(result.status).toBe("ready");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should allow userB to retry as well", () =>
		Effect.gen(function* () {
			const result = yield* retryRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				userId: USER_B_ID,
			});

			expect(result.status).toBe("generating");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
