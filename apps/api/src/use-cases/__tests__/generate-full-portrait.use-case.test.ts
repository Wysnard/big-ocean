/**
 * Generate Full Portrait Use Case Tests (queue-based architecture)
 *
 * Tests:
 * - Successful generation inserts portrait with content
 * - Missing result inserts failed portrait
 * - Missing UserSummary inserts failed portrait
 * - LLM failure inserts failed portrait
 * - Correct input shape to generator (including UserSummary)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	AssessmentResultRepository,
	ConversationEvidenceRepository,
	ConversationRepository,
	LoggerRepository,
	MessageRepository,
	PortraitGenerationError,
	PortraitGeneratorRepository,
	PortraitRepository,
	UserSummaryRepository,
} from "@workspace/domain";
import { Effect, Fiber, Layer, TestClock, TestContext } from "effect";
import { vi } from "vitest";
import { generateFullPortrait } from "../generate-full-portrait.use-case";

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
	findByUserId: vi.fn(),
	countByMessage: vi.fn(),
};

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessagesByUserId: vi.fn(),
	getLastNMessages: vi.fn(),
	deleteMessages: vi.fn(),
	updateAnalysisState: vi.fn(),
};

const mockConversationRepo = {
	getSession: vi.fn(),
};

const mockUserSummaryRepo = {
	getByAssessmentResultId: vi.fn(),
	getLatestForUser: vi.fn(),
	upsertForAssessmentResult: vi.fn(),
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
		Layer.succeed(ConversationRepository, mockConversationRepo),
		Layer.succeed(UserSummaryRepository, mockUserSummaryRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AppConfig, { portraitModelId: "test-model" } as unknown as AppConfig),
	);

const mockResult = {
	id: "result_456",
	sessionId: "session_123",
	userId: "user_789",
	facets: {
		imagination: { score: 15, confidence: 0.8 },
		artistic_interests: { score: 12, confidence: 0.7 },
		emotionality: { score: 18, confidence: 0.9 },
		adventurousness: { score: 10, confidence: 0.6 },
		intellect: { score: 14, confidence: 0.8 },
		liberalism: { score: 16, confidence: 0.7 },
		self_efficacy: { score: 12, confidence: 0.7 },
		orderliness: { score: 10, confidence: 0.6 },
		dutifulness: { score: 11, confidence: 0.7 },
		achievement_striving: { score: 13, confidence: 0.7 },
		self_discipline: { score: 9, confidence: 0.6 },
		cautiousness: { score: 10, confidence: 0.7 },
		friendliness: { score: 10, confidence: 0.6 },
		gregariousness: { score: 8, confidence: 0.5 },
		assertiveness: { score: 9, confidence: 0.6 },
		activity_level: { score: 11, confidence: 0.6 },
		excitement_seeking: { score: 7, confidence: 0.5 },
		cheerfulness: { score: 10, confidence: 0.6 },
		trust: { score: 12, confidence: 0.7 },
		morality: { score: 13, confidence: 0.7 },
		altruism: { score: 11, confidence: 0.7 },
		cooperation: { score: 12, confidence: 0.7 },
		modesty: { score: 10, confidence: 0.6 },
		sympathy: { score: 14, confidence: 0.7 },
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
		bigfiveFacet: "imagination" as const,
		deviation: 2,
		strength: "strong" as const,
		confidence: "high" as const,
		domain: "work" as const,
		note: "Shows vivid creative thinking when describing projects",
		createdAt: new Date(),
	},
];

const mockMessages = [
	{ id: "msg_1", role: "user" as const, content: "Hello" },
	{ id: "msg_2", role: "assistant" as const, content: "Hi there!" },
];

const mockOwnedSession = {
	id: "session_123",
	userId: "user_789",
	status: "completed" as const,
	parentConversationId: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	messageCount: 20,
	finalizationProgress: "completed" as const,
};

const mockUserSummaryRecord = {
	id: "us_1",
	userId: "user_789",
	assessmentResultId: "result_456",
	themes: [{ theme: "Curiosity", description: "Asks thoughtful questions" }],
	quoteBank: [{ quote: "I map everything first" }],
	summaryText: "A reflective, systematic mind.",
	version: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("generateFullPortrait Use Case (queue-based)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockResultsRepo.getBySessionId.mockReturnValue(Effect.succeed(mockResult));
		mockConversationRepo.getSession.mockReturnValue(Effect.succeed(mockOwnedSession));
		mockUserSummaryRepo.getByAssessmentResultId.mockReturnValue(
			Effect.succeed(mockUserSummaryRecord),
		);
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
			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockPortraitGen.generatePortrait).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: "session_123",
					userSummary: expect.objectContaining({
						summaryText: mockUserSummaryRecord.summaryText,
					}),
					messages: expect.arrayContaining([
						expect.objectContaining({ role: "user", content: "Hello" }),
					]),
				}),
			);

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

			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockPortraitRepo.insertFailed).toHaveBeenCalled();
			expect(mockPortraitRepo.insertWithContent).not.toHaveBeenCalled();
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Assessment result not found for portrait generation",
				expect.anything(),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should insert failed portrait when UserSummary is missing", () =>
		Effect.gen(function* () {
			mockUserSummaryRepo.getByAssessmentResultId.mockReturnValue(Effect.succeed(null));

			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockPortraitRepo.insertFailed).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				failedAt: expect.any(Date),
			});
			expect(mockPortraitGen.generatePortrait).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.scoped("should insert failed portrait when LLM generation fails after 3 attempts", () =>
		Effect.gen(function* () {
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

			const fiber = yield* Effect.fork(
				generateFullPortrait({ sessionId: "session_123", userId: "user_789" }),
			);
			yield* TestClock.adjust("5 seconds");
			yield* TestClock.adjust("10 seconds");
			yield* Fiber.join(fiber);

			expect(llmExecCount).toBe(3);
			expect(mockPortraitRepo.insertFailed).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				failedAt: expect.any(Date),
			});
			expect(mockPortraitRepo.insertWithContent).not.toHaveBeenCalled();
		}).pipe(Effect.provide(Layer.merge(createTestLayer(), TestContext.TestContext))),
	);

	it.effect("should call portrait generator without archetype surface fields", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			const callArg = mockPortraitGen.generatePortrait.mock.calls[0]?.[0];
			expect(callArg).not.toHaveProperty("archetypeName");
			expect(callArg).not.toHaveProperty("oceanCode5");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should load conversation evidence by session for base assessment scope", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockConversationEvidenceRepo.findBySession).toHaveBeenCalledWith("session_123");
			expect(mockMessageRepo.getMessages).toHaveBeenCalledWith("session_123");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
