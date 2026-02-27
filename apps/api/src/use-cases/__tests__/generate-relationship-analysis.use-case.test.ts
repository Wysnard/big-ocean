/**
 * Generate Relationship Analysis Use Case Tests (Story 14.4)
 *
 * Tests:
 * - Successful generation updates placeholder
 * - Retry when inviter data not found
 * - Retry when invitee data not found
 * - Idempotent update (already has content)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	FinalizationEvidenceRepository,
	LoggerRepository,
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { AnalysisNotFoundError } from "@workspace/domain/repositories/relationship-analysis.repository";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { generateRelationshipAnalysis } from "../generate-relationship-analysis.use-case";

const mockAnalysisRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByInvitationId: vi.fn(),
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
};

const mockEvidenceRepo = {
	getByResultId: vi.fn(),
	saveBatch: vi.fn(),
	existsForSession: vi.fn(),
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
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(FinalizationEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

const INVITER_ID = "inviter-user-1";
const INVITEE_ID = "invitee-user-2";
const ANALYSIS_ID = "analysis-123";

const mockSession = (userId: string) => ({
	id: `session-${userId}`,
	createdAt: new Date(),
	updatedAt: new Date(),
	status: "completed",
	messageCount: 12,
	oceanCode5: "HHMHM",
	archetypeName: "The Explorer",
});

const mockResult = (sessionId: string) => ({
	id: `result-${sessionId}`,
	sessionId,
	userId: "user",
	facets: {
		imagination: { score: 15, confidence: 0.8 },
		artistic_interests: { score: 12, confidence: 0.7 },
	},
	createdAt: new Date(),
	updatedAt: new Date(),
});

const mockEvidence = [
	{
		id: "ev_1",
		assessmentMessageId: "msg_1",
		assessmentResultId: "result_1",
		bigfiveFacet: "imagination",
		score: 15,
		confidence: 0.8,
		domain: "creativity",
		rawDomain: "artistic expression",
		quote: "I love creating things",
		highlightStart: 0,
		highlightEnd: 21,
		createdAt: new Date(),
	},
];

describe("generateRelationshipAnalysis Use Case (Story 14.4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default successful mocks for both users
		mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
			Effect.succeed(mockSession(userId)),
		);
		mockResultsRepo.getBySessionId.mockImplementation((sessionId: string) =>
			Effect.succeed(mockResult(sessionId)),
		);
		mockEvidenceRepo.getByResultId.mockReturnValue(Effect.succeed(mockEvidence));
		mockAnalysisGen.generateAnalysis.mockReturnValue(
			Effect.succeed({
				content: "# Relationship Analysis\n\nYour dynamic is fascinating...",
				modelUsed: "claude-sonnet",
			}),
		);
		mockAnalysisRepo.updateContent.mockReturnValue(Effect.succeed(undefined));
		mockAnalysisRepo.incrementRetryCount.mockReturnValue(Effect.succeed(undefined));
	});

	it.effect("should generate analysis and update placeholder on success", () =>
		Effect.gen(function* () {
			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(true);

			expect(mockAnalysisGen.generateAnalysis).toHaveBeenCalledWith(
				expect.objectContaining({
					userAName: "Person A",
					userBName: "Person B",
				}),
			);

			expect(mockAnalysisRepo.updateContent).toHaveBeenCalledWith({
				id: ANALYSIS_ID,
				content: expect.stringContaining("Relationship Analysis"),
				modelUsed: "claude-sonnet",
			});
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should increment retry count when inviter session not found", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
				Effect.succeed(userId === INVITER_ID ? null : mockSession(userId)),
			);

			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(false);
			expect(mockAnalysisRepo.incrementRetryCount).toHaveBeenCalledWith(ANALYSIS_ID);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should increment retry count when invitee session not found", () =>
		Effect.gen(function* () {
			mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) =>
				Effect.succeed(userId === INVITEE_ID ? null : mockSession(userId)),
			);

			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(false);
			expect(mockAnalysisRepo.incrementRetryCount).toHaveBeenCalledWith(ANALYSIS_ID);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should handle idempotent update gracefully", () =>
		Effect.gen(function* () {
			mockAnalysisRepo.updateContent.mockReturnValue(
				Effect.fail(new AnalysisNotFoundError({ analysisId: ANALYSIS_ID })),
			);

			const result = yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			expect(result.success).toBe(true);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Analysis already has content, skipping update",
				expect.objectContaining({ analysisId: ANALYSIS_ID }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should load both users' data from session → result → evidence chain", () =>
		Effect.gen(function* () {
			yield* generateRelationshipAnalysis({
				analysisId: ANALYSIS_ID,
				inviterUserId: INVITER_ID,
				inviteeUserId: INVITEE_ID,
			});

			// Both users' sessions queried
			expect(mockSessionRepo.findSessionByUserId).toHaveBeenCalledWith(INVITER_ID);
			expect(mockSessionRepo.findSessionByUserId).toHaveBeenCalledWith(INVITEE_ID);

			// Results loaded for both sessions
			expect(mockResultsRepo.getBySessionId).toHaveBeenCalledTimes(2);

			// Evidence loaded for both results
			expect(mockEvidenceRepo.getByResultId).toHaveBeenCalledTimes(2);
		}).pipe(Effect.provide(createTestLayer())),
	);
});
