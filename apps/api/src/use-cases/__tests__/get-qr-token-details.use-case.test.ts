/**
 * Get QR Token Details Use Case Tests (Story 34-3)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/qr-token.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	PurchaseEventRepository,
	QrTokenRepository,
} from "@workspace/domain";
import {
	_resetMockState,
	QrTokenDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/qr-token.drizzle.repository";
import { Effect, Layer } from "effect";
import { getQrTokenDetails } from "../get-qr-token-details.use-case";

const INITIATOR_USER_ID = "initiator-user-1";
const ACCEPTOR_USER_ID = "acceptor-user-2";

// Mock facet scores that produce a known archetype
const mockFacets = {
	imagination: { score: 15, confidence: 0.8, signalPower: 0.7 },
	artisticInterests: { score: 14, confidence: 0.7, signalPower: 0.6 },
	emotionality: { score: 12, confidence: 0.6, signalPower: 0.5 },
	adventurousness: { score: 13, confidence: 0.7, signalPower: 0.6 },
	intellect: { score: 16, confidence: 0.8, signalPower: 0.7 },
	liberalism: { score: 11, confidence: 0.6, signalPower: 0.5 },
	selfEfficacy: { score: 15, confidence: 0.8, signalPower: 0.7 },
	orderliness: { score: 14, confidence: 0.7, signalPower: 0.6 },
	dutifulness: { score: 13, confidence: 0.7, signalPower: 0.6 },
	achievementStriving: { score: 16, confidence: 0.8, signalPower: 0.7 },
	selfDiscipline: { score: 15, confidence: 0.8, signalPower: 0.7 },
	cautiousness: { score: 12, confidence: 0.6, signalPower: 0.5 },
	friendliness: { score: 14, confidence: 0.7, signalPower: 0.6 },
	gregariousness: { score: 13, confidence: 0.7, signalPower: 0.6 },
	assertiveness: { score: 15, confidence: 0.8, signalPower: 0.7 },
	activityLevel: { score: 14, confidence: 0.7, signalPower: 0.6 },
	excitementSeeking: { score: 12, confidence: 0.6, signalPower: 0.5 },
	cheerfulness: { score: 13, confidence: 0.7, signalPower: 0.6 },
	trust: { score: 14, confidence: 0.7, signalPower: 0.6 },
	morality: { score: 15, confidence: 0.8, signalPower: 0.7 },
	altruism: { score: 13, confidence: 0.7, signalPower: 0.6 },
	cooperation: { score: 14, confidence: 0.7, signalPower: 0.6 },
	modesty: { score: 12, confidence: 0.6, signalPower: 0.5 },
	sympathy: { score: 13, confidence: 0.7, signalPower: 0.6 },
	anxiety: { score: 10, confidence: 0.5, signalPower: 0.4 },
	anger: { score: 9, confidence: 0.5, signalPower: 0.4 },
	depression: { score: 8, confidence: 0.4, signalPower: 0.3 },
	selfConsciousness: { score: 11, confidence: 0.5, signalPower: 0.4 },
	immoderation: { score: 10, confidence: 0.5, signalPower: 0.4 },
	vulnerability: { score: 9, confidence: 0.4, signalPower: 0.3 },
};

const mockPurchaseRepo = {
	getCapabilities: vi.fn(),
	insertEvent: vi.fn(),
	getByCheckoutId: vi.fn(),
	getByUserId: vi.fn(),
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
	getSessionsByUserId: vi.fn(),
};

const mockResultRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	QrTokenDrizzleRepositoryLive,
	Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
	Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
	Layer.succeed(AssessmentResultRepository, mockResultRepo),
);

describe("getQrTokenDetails Use Case (Story 34-3)", () => {
	beforeEach(() => {
		_resetMockState();
		vi.clearAllMocks();
	});

	it.effect("returns token details with initiator archetype and acceptor credits", () =>
		Effect.gen(function* () {
			// 1. Generate a token via the mock repo
			const qrTokenRepo = yield* QrTokenRepository;
			const generatedToken = yield* qrTokenRepo.generate(INITIATOR_USER_ID);

			// 2. Mock session and results for both users
			mockSessionRepo.findSessionByUserId.mockImplementation((userId: string) => {
				if (userId === INITIATOR_USER_ID) {
					return Effect.succeed({ id: "session-1", status: "completed" });
				}
				if (userId === ACCEPTOR_USER_ID) {
					return Effect.succeed({ id: "session-2", status: "completed" });
				}
				return Effect.succeed(null);
			});

			mockResultRepo.getBySessionId.mockImplementation((sessionId: string) => {
				if (sessionId === "session-1" || sessionId === "session-2") {
					return Effect.succeed({
						id: `result-${sessionId}`,
						assessmentSessionId: sessionId,
						facets: mockFacets,
						traits: {},
						domainCoverage: {},
						portrait: "",
						stage: "completed",
						createdAt: new Date(),
					});
				}
				return Effect.succeed(null);
			});

			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed({ availableCredits: 2, hasPortrait: true, canExtend: false }),
			);

			// 3. Call the use-case
			const result = yield* getQrTokenDetails(generatedToken.token, ACCEPTOR_USER_ID);

			expect(result.tokenStatus).toBe("valid");
			expect(result.initiator.name).toBe("Test User");
			expect(result.initiator.archetypeName).toBeDefined();
			expect(result.initiator.archetypeName).not.toBe("Unknown");
			expect(result.initiator.oceanCode4).toHaveLength(4);
			expect(result.initiator.oceanCode5).toHaveLength(5);
			expect(result.initiator.overallConfidence).toBeGreaterThanOrEqual(0);
			expect(result.acceptor.availableCredits).toBe(2);
			expect(result.acceptor.hasCompletedAssessment).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns not-found for nonexistent token", () =>
		Effect.gen(function* () {
			const result = yield* getQrTokenDetails("nonexistent-token", ACCEPTOR_USER_ID).pipe(
				Effect.either,
			);

			expect(result._tag).toBe("Left");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns unknown archetype when initiator has no results", () =>
		Effect.gen(function* () {
			const qrTokenRepo = yield* QrTokenRepository;
			const generatedToken = yield* qrTokenRepo.generate(INITIATOR_USER_ID);

			// No sessions or results
			mockSessionRepo.findSessionByUserId.mockReturnValue(Effect.succeed(null));
			mockPurchaseRepo.getCapabilities.mockReturnValue(
				Effect.succeed({ availableCredits: 0, hasPortrait: false, canExtend: false }),
			);

			const result = yield* getQrTokenDetails(generatedToken.token, ACCEPTOR_USER_ID);

			expect(result.tokenStatus).toBe("valid");
			expect(result.initiator.archetypeName).toBe("Unknown");
			expect(result.acceptor.hasCompletedAssessment).toBe(false);
			expect(result.acceptor.availableCredits).toBe(0);
		}).pipe(Effect.provide(TestLayer)),
	);
});
