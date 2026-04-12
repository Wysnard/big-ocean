/**
 * Generate Full Portrait Use Case Tests (queue-based architecture)
 *
 * Tests:
 * - Successful generation inserts portrait with content
 * - Missing result inserts failed portrait
 * - LLM failure inserts failed portrait
 * - Correct input shape to generator
 * - Uses ConversationEvidenceRepository (not FinalizationEvidenceRepository)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	AssessmentResultRepository,
	ConversationEvidenceRepository,
	LoggerRepository,
	MessageRepository,
	PortraitGeneratorRepository,
	PortraitRepository,
} from "@workspace/domain";
import { PortraitGenerationError } from "@workspace/domain/repositories/portrait-generator.repository";
import { Effect, Fiber, Layer, TestClock, TestContext } from "effect";
import { vi } from "vitest";
import { generateFullPortrait } from "../generate-full-portrait.use-case";

// Mocks
const mockPortraitRepo = {
	insertWithContent: vi.fn(),
	insertFailed: vi.fn(),
	deleteByResultIdAndTier: vi.fn(),
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

const mockConversationEvidenceRepo = {
	save: vi.fn(),
	findBySession: vi.fn(),
	countByMessage: vi.fn(),
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
		Layer.succeed(ConversationEvidenceRepository, mockConversationEvidenceRepo),
		Layer.succeed(MessageRepository, mockMessageRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AppConfig, { portraitModelId: "test-model" } as any),
	);

const mockResult = {
	id: "result_456",
	sessionId: "session_123",
	userId: "user_789",
	facets: {
		// Openness
		imagination: { score: 15, confidence: 0.8 },
		artistic_interests: { score: 12, confidence: 0.7 },
		emotionality: { score: 18, confidence: 0.9 },
		adventurousness: { score: 10, confidence: 0.6 },
		intellect: { score: 14, confidence: 0.8 },
		liberalism: { score: 16, confidence: 0.7 },
		// Conscientiousness
		self_efficacy: { score: 12, confidence: 0.7 },
		orderliness: { score: 10, confidence: 0.6 },
		dutifulness: { score: 11, confidence: 0.7 },
		achievement_striving: { score: 13, confidence: 0.7 },
		self_discipline: { score: 9, confidence: 0.6 },
		cautiousness: { score: 10, confidence: 0.7 },
		// Extraversion
		friendliness: { score: 10, confidence: 0.6 },
		gregariousness: { score: 8, confidence: 0.5 },
		assertiveness: { score: 9, confidence: 0.6 },
		activity_level: { score: 11, confidence: 0.6 },
		excitement_seeking: { score: 7, confidence: 0.5 },
		cheerfulness: { score: 10, confidence: 0.6 },
		// Agreeableness
		trust: { score: 12, confidence: 0.7 },
		morality: { score: 13, confidence: 0.7 },
		altruism: { score: 11, confidence: 0.7 },
		cooperation: { score: 12, confidence: 0.7 },
		modesty: { score: 10, confidence: 0.6 },
		sympathy: { score: 14, confidence: 0.7 },
		// Neuroticism
		anxiety: { score: 8, confidence: 0.5 },
		anger: { score: 6, confidence: 0.5 },
		depression: { score: 7, confidence: 0.5 },
		self_consciousness: { score: 9, confidence: 0.5 },
		immoderation: { score: 5, confidence: 0.4 },
		vulnerability: { score: 7, confidence: 0.5 },
	},
	traits: {
		openness: { score: 85, confidence: 0.75 },
		conscientiousness: { score: 60, confidence: 0.7 },
		extraversion: { score: 50, confidence: 0.6 },
		agreeableness: { score: 70, confidence: 0.7 },
		neuroticism: { score: 40, confidence: 0.5 },
	},
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockConversationEvidence = [
	{
		id: "ev_1",
		sessionId: "session_123",
		messageId: "msg_1",
		bigfiveFacet: "imagination",
		deviation: 2,
		strength: "strong",
		confidence: "high",
		domain: "work",
		note: "Shows vivid creative thinking when describing projects",
		createdAt: new Date(),
	},
];

const mockMessages = [
	{ id: "msg_1", role: "user", content: "Hello" },
	{ id: "msg_2", role: "assistant", content: "Hi there!" },
];

describe("generateFullPortrait Use Case (queue-based)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default successful mocks
		mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));
		mockConversationEvidenceRepo.findBySession.mockReturnValue(
			Effect.succeed(mockConversationEvidence),
		);
		mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(mockMessages));
		mockPortraitGen.generatePortrait.mockReturnValue(
			Effect.succeed("Your full personality portrait..."),
		);
		mockPortraitRepo.insertWithContent.mockReturnValue(
			Effect.succeed({ id: "portrait_123", content: "Your full personality portrait..." }),
		);
		mockPortraitRepo.insertFailed.mockReturnValue(
			Effect.succeed({ id: "portrait_fail", failedAt: new Date() }),
		);
	});

	it.effect("should generate portrait and insert with content on success", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({ sessionId: "session_123" });

			// Verify portrait generator was called with correct data
			expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: "session_123",
					messages: expect.arrayContaining([
						expect.objectContaining({ role: "user", content: "Hello" }),
					]),
				}),
			);

			// Verify insertWithContent was called
			expect(mockPortraitRepo.insertWithContent).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				content: "Your full personality portrait...",
				modelUsed: "test-model",
			});

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Full portrait generation completed",
				expect.objectContaining({ sessionId: "session_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should insert failed portrait when assessment result not found", () =>
		Effect.gen(function* () {
			mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(null));

			yield* generateFullPortrait({ sessionId: "session_123" });

			expect(mockPortraitRepo.insertFailed).toHaveBeenCalled();
			expect(mockPortraitRepo.insertWithContent).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Assessment result not found for portrait generation",
				expect.anything(),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.scoped("should insert failed portrait when LLM generation fails after 3 attempts", () =>
		Effect.gen(function* () {
			// Track actual effect executions (not mock function calls) since
			// Effect.retry re-runs the same Effect instance, not the function
			let llmExecCount = 0;
			mockPortraitGen.generatePortrait.mockReturnValue(
				Effect.suspend(() => {
					llmExecCount++;
					return Effect.fail(
						new PortraitGenerationError({
							sessionId: "session_123",
							message: "LLM error",
						}),
					);
				}),
			);

			const fiber = yield* Effect.fork(generateFullPortrait({ sessionId: "session_123" }));
			// Advance TestClock past exponential backoff delays (5s + 10s)
			yield* TestClock.adjust("5 seconds");
			yield* TestClock.adjust("10 seconds");
			yield* Fiber.join(fiber);

			// Exponential backoff: 3 total attempts (initial + 2 retries)
			expect(llmExecCount).toBe(3);
			expect(mockPortraitRepo.insertFailed).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				failedAt: expect.any(Date),
			});
			expect(mockPortraitRepo.insertWithContent).not.toHaveBeenCalled();
		}).pipe(Effect.provide(Layer.merge(createTestLayer(), TestContext.TestContext))),
	);

	it.effect("should call portrait generator with correct input shape", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({ sessionId: "session_123" });

			expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: "session_123",
				}),
			);
			// Archetype data should NOT be passed to portrait generator
			const callArg = mockPortraitGen.generatePortrait.mock.calls[0]?.[0];
			expect(callArg).not.toHaveProperty("archetypeName");
			expect(callArg).not.toHaveProperty("archetypeDescription");
			expect(callArg).not.toHaveProperty("oceanCode5");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect(
		"should load conversation evidence by session (not finalization evidence by result)",
		() =>
			Effect.gen(function* () {
				yield* generateFullPortrait({ sessionId: "session_123" });

				expect(mockConversationEvidenceRepo.findBySession).toHaveBeenCalledWith("session_123");
				expect(mockMessageRepo.getMessages).toHaveBeenCalledWith("session_123");

				expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
					expect.objectContaining({
						allEvidence: expect.arrayContaining([
							expect.objectContaining({
								bigfiveFacet: "imagination",
								deviation: 2,
								strength: "strong",
								confidence: "high",
								note: "Shows vivid creative thinking when describing projects",
							}),
						]),
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
	);
});
