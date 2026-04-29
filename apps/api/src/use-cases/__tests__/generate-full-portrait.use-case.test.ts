/**
 * Generate Full Portrait Use Case Tests (ADR-51 three-stage pipeline)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	AssessmentResultRepository,
	ConversationEvidenceRepository,
	ConversationRepository,
	LoggerRepository,
	PortraitGenerationError,
	PortraitProseRendererRepository,
	PortraitRepository,
	SpineExtractorRepository,
	SpineVerifierRepository,
	UserSummaryRepository,
} from "@workspace/domain";
import type { SpineBrief } from "@workspace/domain/types/spine-brief";
import type { SpineVerification } from "@workspace/domain/types/spine-verification";
import { defaultTestConfig } from "@workspace/infrastructure";
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

const mockExtractor = {
	extractSpineBrief: vi.fn(),
};

const mockVerifier = {
	verifySpineBrief: vi.fn(),
};

const mockProse = {
	renderPortraitProse: vi.fn(),
};

const MOCK_SPINE_BRIEF: SpineBrief = {
	insight: {
		surfaceObservation: "s",
		underneathReading: "u",
		bridge: "b",
		falsifiable: true,
	},
	thread: "t",
	lens: "l",
	arc: {
		wonder: {
			focus: "w",
			openingDirection: "o",
			keyMaterial: ["k"],
			endState: "e",
		},
		recognition: {
			focus: "w",
			openingDirection: "o",
			keyMaterial: ["k"],
			endState: "e",
		},
		tension: {
			focus: "w",
			openingDirection: "o",
			keyMaterial: ["k"],
			endState: "e",
		},
		embrace: {
			focus: "w",
			openingDirection: "o",
			keyMaterial: ["k"],
			endState: "e",
		},
		reframe: {
			focus: "w",
			openingDirection: "o",
			keyMaterial: ["k"],
			endState: "e",
		},
		compulsion: {
			focus: "w",
			openingDirection: "o",
			keyMaterial: ["k"],
			endState: "e",
		},
	},
	coinedPhraseTargets: [
		{ phrase: "one", rationale: "r", echoesIn: ["wonder", "recognition"] },
		{ phrase: "two", rationale: "r2", echoesIn: ["tension", "embrace"] },
	],
	ordinaryMomentAnchors: [{ moment: "m", useIn: "wonder", supportsInsight: true }],
	unresolvedCost: { description: "cost" },
};

const MOCK_VERIFICATION_OK: SpineVerification = {
	passed: true,
	missingFields: [],
	shallowAreas: [],
	overallScore: 1,
	gapFeedback: "",
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
		Layer.succeed(SpineExtractorRepository, mockExtractor),
		Layer.succeed(SpineVerifierRepository, mockVerifier),
		Layer.succeed(PortraitProseRendererRepository, mockProse),
		Layer.succeed(AssessmentResultRepository, mockResultsRepo),
		Layer.succeed(ConversationEvidenceRepository, mockConversationEvidenceRepo),
		Layer.succeed(ConversationRepository, mockConversationRepo),
		Layer.succeed(UserSummaryRepository, mockUserSummaryRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.succeed(AppConfig, {
			...defaultTestConfig,
			portraitProseRendererModelId: "test-prose-model",
		}),
	);

const mockResult = {
	id: "result_456",
	sessionId: "session_123",
	userId: "user_789",
	facets: {
		imagination: { score: 15, confidence: 80 },
		artistic_interests: { score: 12, confidence: 70 },
		emotionality: { score: 18, confidence: 90 },
		adventurousness: { score: 10, confidence: 60 },
		intellect: { score: 14, confidence: 80 },
		liberalism: { score: 16, confidence: 70 },
		self_efficacy: { score: 12, confidence: 70 },
		orderliness: { score: 10, confidence: 60 },
		dutifulness: { score: 11, confidence: 70 },
		achievement_striving: { score: 13, confidence: 70 },
		self_discipline: { score: 9, confidence: 60 },
		cautiousness: { score: 10, confidence: 70 },
		friendliness: { score: 10, confidence: 60 },
		gregariousness: { score: 8, confidence: 50 },
		assertiveness: { score: 9, confidence: 60 },
		activity_level: { score: 11, confidence: 60 },
		excitement_seeking: { score: 7, confidence: 50 },
		cheerfulness: { score: 10, confidence: 60 },
		trust: { score: 12, confidence: 70 },
		morality: { score: 13, confidence: 70 },
		altruism: { score: 11, confidence: 70 },
		cooperation: { score: 12, confidence: 70 },
		modesty: { score: 10, confidence: 60 },
		sympathy: { score: 14, confidence: 70 },
		anxiety: { score: 8, confidence: 50 },
		anger: { score: 6, confidence: 50 },
		depression: { score: 7, confidence: 50 },
		self_consciousness: { score: 9, confidence: 50 },
		immoderation: { score: 5, confidence: 40 },
		vulnerability: { score: 7, confidence: 50 },
	},
	traits: {
		openness: { score: 85, confidence: 75 },
		conscientiousness: { score: 60, confidence: 70 },
		extraversion: { score: 50, confidence: 60 },
		agreeableness: { score: 70, confidence: 70 },
		neuroticism: { score: 40, confidence: 50 },
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

describe("generateFullPortrait Use Case (ADR-51 pipeline)", () => {
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
		mockExtractor.extractSpineBrief.mockReturnValue(Effect.succeed(MOCK_SPINE_BRIEF));
		mockVerifier.verifySpineBrief.mockReturnValue(Effect.succeed(MOCK_VERIFICATION_OK));
		mockProse.renderPortraitProse.mockReturnValue(
			Effect.succeed("Your full personality portrait..."),
		);
		mockPortraitRepo.insertWithContent.mockReturnValue(
			Effect.succeed({ id: "portrait_123", content: "Your full personality portrait..." }),
		);
		mockPortraitRepo.insertFailed.mockReturnValue(
			Effect.succeed({ id: "portrait_fail", failedAt: new Date() }),
		);
	});

	it.effect("should run pipeline and insert with artifacts on success", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockExtractor.extractSpineBrief).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: "session_123",
					userSummary: expect.objectContaining({
						summaryText: mockUserSummaryRecord.summaryText,
					}),
				}),
			);
			expect(mockExtractor.extractSpineBrief).not.toHaveBeenCalledWith(
				expect.objectContaining({ messages: expect.anything() }),
			);

			expect(mockProse.renderPortraitProse).toHaveBeenCalledWith({
				sessionId: "session_123",
				brief: MOCK_SPINE_BRIEF,
			});

			expect(mockPortraitRepo.insertWithContent).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				content: "Your full personality portrait...",
				modelUsed: "test-prose-model",
				spineBrief: MOCK_SPINE_BRIEF,
				spineVerification: MOCK_VERIFICATION_OK,
				portraitPipelineModels: {
					spineExtractorModelId: defaultTestConfig.portraitSpineExtractorModelId,
					spineVerifierModelId: defaultTestConfig.portraitSpineVerifierModelId,
					portraitProseRendererModelId: "test-prose-model",
				},
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
			expect(mockExtractor.extractSpineBrief).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.scoped("should insert failed portrait when pipeline fails after 3 attempts", () =>
		Effect.gen(function* () {
			let pipelineRuns = 0;
			mockExtractor.extractSpineBrief.mockImplementation(() =>
				Effect.suspend(() => {
					pipelineRuns++;
					return Effect.fail(
						new PortraitGenerationError({
							sessionId: "session_123",
							message: "LLM error",
							stage: "extract",
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

			expect(pipelineRuns).toBe(3);
			expect(mockPortraitRepo.insertFailed).toHaveBeenCalledWith({
				assessmentResultId: "result_456",
				tier: "full",
				failedAt: expect.any(Date),
			});
			expect(mockPortraitRepo.insertWithContent).not.toHaveBeenCalled();
		}).pipe(Effect.provide(Layer.merge(createTestLayer(), TestContext.TestContext))),
	);

	it.effect("should re-extract once when verifier fails then succeeds", () =>
		Effect.gen(function* () {
			const brief2: SpineBrief = { ...MOCK_SPINE_BRIEF, thread: "retry-thread" };
			mockVerifier.verifySpineBrief
				.mockReturnValueOnce(
					Effect.succeed({
						passed: false,
						missingFields: [],
						shallowAreas: [],
						overallScore: 0.3,
						gapFeedback: "Add depth to arc.wonder",
					}),
				)
				.mockReturnValueOnce(Effect.succeed(MOCK_VERIFICATION_OK));
			mockExtractor.extractSpineBrief
				.mockReturnValueOnce(Effect.succeed(MOCK_SPINE_BRIEF))
				.mockReturnValueOnce(Effect.succeed(brief2));

			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockExtractor.extractSpineBrief).toHaveBeenCalledTimes(2);
			expect(mockExtractor.extractSpineBrief).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({
					gapFeedback: "Add depth to arc.wonder",
				}),
			);
			expect(mockProse.renderPortraitProse).toHaveBeenCalledWith({
				sessionId: "session_123",
				brief: brief2,
			});
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should load conversation evidence by session for scope guard", () =>
		Effect.gen(function* () {
			yield* generateFullPortrait({ sessionId: "session_123", userId: "user_789" });

			expect(mockConversationEvidenceRepo.findBySession).toHaveBeenCalledWith("session_123");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
