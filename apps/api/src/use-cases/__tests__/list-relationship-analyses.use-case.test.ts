/**
 * List Relationship Analyses Use Case Tests (Story 35-4)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	ALL_FACETS,
	type AssessmentResultRecord,
	AssessmentResultRepository,
	LoggerRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { listRelationshipAnalyses } from "../list-relationship-analyses.use-case";

const USER_A = "user-a";
const USER_B = "user-b";
const USER_C = "user-c";

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByUserId: vi.fn(),
	getById: vi.fn(),
	getByIdWithParticipantNames: vi.fn(),
	listByUserId: vi.fn(),
};

const mockResultRepo = {
	create: vi.fn(),
	getById: vi.fn(),
	getBySessionId: vi.fn(),
	update: vi.fn(),
	upsert: vi.fn(),
	updateStage: vi.fn(),
	getLatestByUserId: vi.fn(() => Effect.succeed(null)),
};

const createCompletedResult = (id: string): AssessmentResultRecord => ({
	id,
	assessmentSessionId: `session-${id}`,
	facets: Object.fromEntries(
		ALL_FACETS.map((facet) => [facet, { score: 20, confidence: 0.9 }]),
	) as AssessmentResultRecord["facets"],
	traits: {},
	domainCoverage: {},
	portrait: "",
	stage: "completed",
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
});

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(RelationshipAnalysisRepository, mockAnalysisRepo),
		Layer.succeed(AssessmentResultRepository, mockResultRepo),
		Layer.succeed(LoggerRepository, {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		}),
	);

describe("listRelationshipAnalyses Use Case (Story 35-4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockResultRepo.getById.mockImplementation((id: string) =>
			Effect.succeed(createCompletedResult(id)),
		);
	});

	it.effect("returns empty array when user has no analyses", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.listByUserId.mockReturnValue(Effect.succeed([]));

			const result = yield* listRelationshipAnalyses(USER_A);

			expect(result).toEqual([]);
			expect(mockAnalysisRepo.listByUserId).toHaveBeenCalledWith(USER_A);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns analyses with isLatestVersion = true when result IDs match latest", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.listByUserId.mockReturnValue(
				Effect.succeed([
					{
						id: "analysis-1",
						userAId: USER_A,
						userBId: USER_B,
						userAResultId: "result-a-latest",
						userBResultId: "result-b-latest",
						content: "Analysis content",
						modelUsed: "sonnet",
						retryCount: 0,
						createdAt: new Date("2026-03-20"),
						userAName: "Alice",
						userBName: "Bob",
					},
				]),
			);

			mockResultRepo.getLatestByUserId.mockImplementation((userId: string) => {
				if (userId === USER_A) return Effect.succeed({ id: "result-a-latest" });
				if (userId === USER_B) return Effect.succeed({ id: "result-b-latest" });
				return Effect.succeed(null);
			});

			const result = yield* listRelationshipAnalyses(USER_A);

			expect(result).toHaveLength(1);
			expect(result[0].analysisId).toBe("analysis-1");
			expect(result[0].isLatestVersion).toBe(true);
			expect(result[0].hasContent).toBe(true);
			expect(result[0].userAName).toBe("Alice");
			expect(result[0].userBName).toBe("Bob");
			expect(result[0].partnerName).toBe("Bob");
			expect(result[0].partnerArchetypeName).toBe("The Beacon");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("marks analysis as previous version when user has newer results", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.listByUserId.mockReturnValue(
				Effect.succeed([
					{
						id: "analysis-old",
						userAId: USER_A,
						userBId: USER_B,
						userAResultId: "result-a-old",
						userBResultId: "result-b-latest",
						content: "Old analysis",
						modelUsed: "sonnet",
						retryCount: 0,
						createdAt: new Date("2026-03-10"),
						userAName: "Alice",
						userBName: "Bob",
					},
				]),
			);

			mockResultRepo.getLatestByUserId.mockImplementation((userId: string) => {
				if (userId === USER_A) return Effect.succeed({ id: "result-a-new" });
				if (userId === USER_B) return Effect.succeed({ id: "result-b-latest" });
				return Effect.succeed(null);
			});

			const result = yield* listRelationshipAnalyses(USER_A);

			expect(result).toHaveLength(1);
			expect(result[0].isLatestVersion).toBe(false);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("handles multiple analyses with different partners", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.listByUserId.mockReturnValue(
				Effect.succeed([
					{
						id: "analysis-1",
						userAId: USER_A,
						userBId: USER_B,
						userAResultId: "result-a",
						userBResultId: "result-b",
						content: "Analysis 1",
						modelUsed: "sonnet",
						retryCount: 0,
						createdAt: new Date("2026-03-20"),
						userAName: "Alice",
						userBName: "Bob",
					},
					{
						id: "analysis-2",
						userAId: USER_A,
						userBId: USER_C,
						userAResultId: "result-a",
						userBResultId: "result-c",
						content: null,
						modelUsed: null,
						retryCount: 0,
						createdAt: new Date("2026-03-19"),
						userAName: "Alice",
						userBName: "Charlie",
					},
				]),
			);

			mockResultRepo.getLatestByUserId.mockImplementation((userId: string) => {
				if (userId === USER_A) return Effect.succeed({ id: "result-a" });
				if (userId === USER_B) return Effect.succeed({ id: "result-b" });
				if (userId === USER_C) return Effect.succeed({ id: "result-c" });
				return Effect.succeed(null);
			});

			const result = yield* listRelationshipAnalyses(USER_A);

			expect(result).toHaveLength(2);
			expect(result[0].analysisId).toBe("analysis-1");
			expect(result[0].hasContent).toBe(true);
			expect(result[0].partnerName).toBe("Bob");
			expect(result[0].partnerArchetypeName).toBe("The Beacon");
			expect(result[1].analysisId).toBe("analysis-2");
			expect(result[1].hasContent).toBe(false);
			expect(result[1].partnerName).toBe("Charlie");
			expect(result[1].partnerArchetypeName).toBe("The Beacon");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("defaults to latest version when getLatestByUserId fails (fail-open)", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.listByUserId.mockReturnValue(
				Effect.succeed([
					{
						id: "analysis-1",
						userAId: USER_A,
						userBId: USER_B,
						userAResultId: "result-a",
						userBResultId: "result-b",
						content: "Analysis",
						modelUsed: "sonnet",
						retryCount: 0,
						createdAt: new Date("2026-03-20"),
						userAName: "Alice",
						userBName: "Bob",
					},
				]),
			);

			mockResultRepo.getLatestByUserId.mockReturnValue(
				Effect.fail({ _tag: "AssessmentResultError", message: "DB error" }),
			);

			const result = yield* listRelationshipAnalyses(USER_A);

			expect(result).toHaveLength(1);
			// Fail-open: default to latest version
			expect(result[0].isLatestVersion).toBe(true);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("fails open on partner archetype enrichment and keeps the list response usable", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.listByUserId.mockReturnValue(
				Effect.succeed([
					{
						id: "analysis-1",
						userAId: USER_A,
						userBId: USER_B,
						userAResultId: "result-a",
						userBResultId: "result-b",
						content: "Analysis",
						modelUsed: "sonnet",
						retryCount: 0,
						createdAt: new Date("2026-03-20"),
						userAName: "Alice",
						userBName: "Bob",
					},
				]),
			);

			mockResultRepo.getLatestByUserId.mockImplementation((userId: string) => {
				if (userId === USER_A) return Effect.succeed({ id: "result-a" });
				if (userId === USER_B) return Effect.succeed({ id: "result-b" });
				return Effect.succeed(null);
			});

			mockResultRepo.getById.mockReturnValue(
				Effect.fail({ _tag: "AssessmentResultError", message: "partner result missing" }),
			);

			const result = yield* listRelationshipAnalyses(USER_A);

			expect(result).toHaveLength(1);
			expect(result[0].partnerName).toBe("Bob");
			expect(result[0].partnerArchetypeName).toBe("Unknown");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
