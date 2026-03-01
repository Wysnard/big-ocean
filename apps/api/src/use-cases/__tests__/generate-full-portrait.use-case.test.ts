/**
 * Generate Full Portrait Use Case Tests (Story 13.3)
 *
 * Tests:
 * - Successful generation updates placeholder
 * - Retry on failure increments retry_count
 * - Idempotent update (already has content)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentMessageRepository,
	AssessmentResultRepository,
	FinalizationEvidenceRepository,
	LoggerRepository,
	PortraitGeneratorRepository,
	PortraitRepository,
} from "@workspace/domain";
import { PortraitNotFoundError } from "@workspace/domain/repositories/portrait.repository";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { generateFullPortrait } from "../generate-full-portrait.use-case";

// Mocks
const mockPortraitRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
};

const mockPortraitGen = {
	generatePortrait: vi.fn(),
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
	save: vi.fn(),
	delete: vi.fn(),
};

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getLastNMessages: vi.fn(),
	deleteMessages: vi.fn(),
	updateAnalysisState: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(PortraitRepository, mockPortraitRepo),
		Layer.succeed(PortraitGeneratorRepository, mockPortraitGen),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(FinalizationEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

const mockResult = {
	id: "result_456",
	sessionId: "session_123",
	userId: "user_789",
	facets: {
		imagination: { score: 15, confidence: 0.8, signalPower: 1 },
		artistic_interests: { score: 12, confidence: 0.7, signalPower: 1 },
		emotionality: { score: 18, confidence: 0.9, signalPower: 1 },
		adventurousness: { score: 10, confidence: 0.6, signalPower: 1 },
		intellect: { score: 14, confidence: 0.8, signalPower: 1 },
		liberalism: { score: 16, confidence: 0.7, signalPower: 1 },
	},
	traits: {
		openness: { score: 85, confidence: 0.75, signalPower: 1 },
		conscientiousness: { score: 60, confidence: 0.7, signalPower: 1 },
		extraversion: { score: 50, confidence: 0.6, signalPower: 1 },
		agreeableness: { score: 70, confidence: 0.7, signalPower: 1 },
		neuroticism: { score: 40, confidence: 0.5, signalPower: 1 },
	},
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockEvidence = [
	{
		id: "ev_1",
		assessmentMessageId: "msg_1",
		assessmentResultId: "result_456",
		bigfiveFacet: "imagination",
		score: 15,
		confidence: 0.8,
		domain: "creativity",
		rawDomain: "artistic expression",
		quote: "I love painting",
		highlightStart: 0,
		highlightEnd: 15,
		createdAt: new Date(),
	},
];

const mockMessages = [
	{ id: "msg_1", role: "user", content: "Hello" },
	{ id: "msg_2", role: "assistant", content: "Hi there!" },
];

describe("generateFullPortrait Use Case (Story 13.3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default successful mocks
		mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));
		mockEvidenceRepo.getByResultId.mockReturnValue(Effect.succeed(mockEvidence));
		mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(mockMessages));
		mockPortraitGen.generatePortrait.mockReturnValue(
			Effect.succeed("Your full personality portrait..."),
		);
		mockPortraitRepo.updateContent.mockReturnValue(Effect.succeed(undefined));
		mockPortraitRepo.incrementRetryCount.mockReturnValue(Effect.succeed(undefined));
	});

	it.effect("should generate portrait and update placeholder on success", () =>
		Effect.gen(function* () {
			const result = yield* generateFullPortrait({
				portraitId: "portrait_123",
				sessionId: "session_123",
			});

			expect(result.success).toBe(true);

			// Verify portrait generator was called with correct data
			expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: "session_123",
					messages: expect.arrayContaining([
						expect.objectContaining({ role: "user", content: "Hello" }),
					]),
				}),
			);

			// Verify placeholder was updated with generated content
			expect(mockPortraitRepo.updateContent).toHaveBeenCalledWith(
				"portrait_123",
				"Your full personality portrait...",
			);

			// Verify logging
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting full portrait generation",
				expect.objectContaining({ portraitId: "portrait_123" }),
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Full portrait generation completed",
				expect.objectContaining({ portraitId: "portrait_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should increment retry count when assessment result not found", () =>
		Effect.gen(function* () {
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* generateFullPortrait({
				portraitId: "portrait_123",
				sessionId: "session_123",
			});

			expect(result.success).toBe(false);
			expect(mockPortraitRepo.incrementRetryCount).toHaveBeenCalledWith("portrait_123");
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Assessment result not found for portrait generation",
				expect.anything(),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	// Note: Retry behavior with exponential backoff is tested in integration tests.
	// Unit test verifies that LLM generator is called with correct data.
	it.effect("should call portrait generator with correct input shape", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({
				portraitId: "portrait_123",
				sessionId: "session_123",
			});

			// Verify portrait generator received correct structure
			expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: "session_123",
					archetypeName: expect.any(String),
					archetypeDescription: expect.any(String),
					oceanCode5: expect.any(String),
				}),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should handle idempotent update gracefully", () =>
		Effect.gen(function* () {
			// Simulate updateContent failing because portrait already has content
			mockPortraitRepo.updateContent.mockReturnValue(
				Effect.fail(new PortraitNotFoundError({ portraitId: "portrait_123" })),
			);

			const result = yield* generateFullPortrait({
				portraitId: "portrait_123",
				sessionId: "session_123",
			});

			expect(result.success).toBe(true);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Portrait already has content, skipping update",
				expect.objectContaining({ portraitId: "portrait_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should load evidence and messages for portrait context", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({
				portraitId: "portrait_123",
				sessionId: "session_123",
			});

			// Verify evidence was loaded
			expect(mockEvidenceRepo.getByResultId).toHaveBeenCalledWith(mockResult.id);

			// Verify messages were loaded
			expect(mockMessageRepo.getMessages).toHaveBeenCalledWith("session_123");

			// Verify portrait generator received all evidence
			// Note: FinalizationEvidenceRecord.bigfiveFacet is mapped to SavedFacetEvidence.facetName
			expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
				expect.objectContaining({
					allEvidence: expect.arrayContaining([
						expect.objectContaining({
							facetName: "imagination",
							quote: "I love painting",
						}),
					]),
				}),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);
});
