/**
 * Generate Results Use Case Tests (Story 18-4: Staged Idempotency Rewrite)
 *
 * Tests staged idempotency (scored -> completed), session validation,
 * conversation evidence as authoritative source, score computation,
 * and progress status transitions.
 */

import { vi } from "vitest";

// Activate mocking — Vitest auto-resolves to __mocks__ siblings
vi.mock("@workspace/infrastructure/repositories/assessment-result.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/conversation-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/user-summary.drizzle.repository");

import { describe, expect, it } from "@effect/vitest";
import {
	ALL_FACETS,
	type ConversationEvidenceRecord,
	ConversationRepository,
	CostGuardRepository,
	FORMULA_DEFAULTS,
	LIFE_DOMAINS,
	LoggerRepository,
	PortraitJobQueue,
	PublicProfileRepository,
	TRAIT_NAMES,
	UserSummaryGenerationError,
	UserSummaryGeneratorRepository,
} from "@workspace/domain";
import {
	AssessmentResultDrizzleRepositoryLive,
	_getStoredResults as getStoredResults,
	_resetMockState as resetResults,
	_seedResult as seedResult,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import {
	ConversationEvidenceDrizzleRepositoryLive,
	_resetMockState as resetConversationEvidence,
	_seedEvidence as seedConversationEvidence,
} from "@workspace/infrastructure/repositories/conversation-evidence.drizzle.repository";
import {
	_resetUserSummaryMockState as resetUserSummary,
	UserSummaryDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/user-summary.drizzle.repository";
import { UserSummaryGeneratorMockRepositoryLive } from "@workspace/infrastructure/repositories/user-summary-generator.mock.repository";
import { Effect, Layer, Option, Queue } from "effect";
import { generateResults } from "../generate-results.use-case";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	incrementMessageCount: vi.fn(),
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
	countCompletedExtensionSessionsExcluding: vi.fn(() => Effect.succeed(1)),
};

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockCostGuardRepo = {
	incrementDailyCost: vi.fn(() => Effect.succeed(0)),
	getDailyCost: vi.fn(() => Effect.succeed(0)),
	incrementAssessmentCount: vi.fn(() => Effect.succeed(0)),
	getAssessmentCount: vi.fn(() => Effect.succeed(0)),
	canStartAssessment: vi.fn(() => Effect.succeed(true)),
	recordAssessmentStart: vi.fn(() => Effect.void),
	checkDailyBudget: vi.fn(() => Effect.void),
	checkMessageRateLimit: vi.fn(() => Effect.void),
	checkAndRecordGlobalAssessmentStart: vi.fn(() => Effect.void),
	incrementSessionCost: vi.fn(() => Effect.succeed(0)),
	getSessionCost: vi.fn(() => Effect.succeed(0)),
	checkSessionBudget: vi.fn(() => Effect.void),
	getFreeTierLlmPaused: vi.fn(() => Effect.succeed(false)),
	setFreeTierLlmPaused: vi.fn(() => Effect.void),
};

const mockProfileRepo = {
	createProfile: vi.fn(() =>
		Effect.succeed({
			id: "profile_session_123",
			sessionId: "session_123",
			userId: "user_456",
			displayName: "Test",
			isPublic: false,
			viewCount: 0,
			createdAt: new Date(),
		}),
	),
	getProfile: vi.fn(() => Effect.succeed(null)),
	getProfileBySessionId: vi.fn(() => Effect.succeed(null)),
	toggleVisibility: vi.fn(() => Effect.void),
	incrementViewCount: vi.fn(() => Effect.void),
};

const mockFinalizingSession = {
	id: "session_123",
	userId: "user_456",
	createdAt: new Date("2026-02-01"),
	updatedAt: new Date("2026-02-01"),
	status: "finalizing",
	messageCount: 25,
	finalizationProgress: null,
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
		Layer.succeed(PublicProfileRepository, mockProfileRepo),
		AssessmentResultDrizzleRepositoryLive,
		ConversationEvidenceDrizzleRepositoryLive,
		UserSummaryDrizzleRepositoryLive,
		UserSummaryGeneratorMockRepositoryLive,
		Layer.effect(PortraitJobQueue, Queue.unbounded()),
	);

const createTestLayerWithFailingUserSummaryGenerator = () =>
	Layer.mergeAll(
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		Layer.succeed(CostGuardRepository, mockCostGuardRepo),
		Layer.succeed(PublicProfileRepository, mockProfileRepo),
		AssessmentResultDrizzleRepositoryLive,
		ConversationEvidenceDrizzleRepositoryLive,
		UserSummaryDrizzleRepositoryLive,
		Layer.succeed(
			UserSummaryGeneratorRepository,
			UserSummaryGeneratorRepository.of({
				generate: () =>
					Effect.fail(
						new UserSummaryGenerationError({
							message: "forced failure for test",
						}),
					),
			}),
		),
		Layer.effect(PortraitJobQueue, Queue.unbounded()),
	);

/** Helper: create conversation evidence records for seeding */
const makeConversationEvidence = (
	sessionId: string,
	records: Array<{
		facet: string;
		deviation: number;
		strength: "weak" | "moderate" | "strong";
		confidence: "low" | "medium" | "high";
		domain: string;
		note: string;
	}>,
): ConversationEvidenceRecord[] =>
	records.map((r) => ({
		id: crypto.randomUUID(),
		sessionId,
		messageId: `msg-${crypto.randomUUID()}`,
		exchangeId: `exchange-${crypto.randomUUID()}`,
		bigfiveFacet: r.facet as ConversationEvidenceRecord["bigfiveFacet"],
		deviation: r.deviation,
		strength: r.strength,
		confidence: r.confidence,
		domain: r.domain as ConversationEvidenceRecord["domain"],
		polarity: r.deviation >= 0 ? ("high" as const) : ("low" as const),
		note: r.note,
		createdAt: new Date(),
	}));

describe("generateResults Use Case (Story 18-4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetResults();
		resetConversationEvidence();
		resetUserSummary();
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockFinalizingSession));
		mockSessionRepo.updateSession.mockReturnValue(Effect.succeed(mockFinalizingSession));
		mockSessionRepo.acquireSessionLock.mockReturnValue(Effect.void);
		mockSessionRepo.releaseSessionLock.mockReturnValue(Effect.void);
		mockSessionRepo.countCompletedExtensionSessionsExcluding.mockReturnValue(Effect.succeed(1));
		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
		mockProfileRepo.getProfileBySessionId.mockReturnValue(Effect.succeed(null));
		mockProfileRepo.createProfile.mockReturnValue(
			Effect.succeed({
				id: "profile_session_123",
				sessionId: "session_123",
				userId: "user_456",
				displayName: "Test",
				isPublic: false,
				viewCount: 0,
				createdAt: new Date(),
			}),
		);
	});

	describe("Session validation", () => {
		it.effect("should fail with SessionNotFound when userId doesn't match", () =>
			Effect.gen(function* () {
				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "wrong_user",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should fail with SessionNotFinalizing when session is active", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockFinalizingSession, status: "active" }),
				);

				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFinalizing");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Idempotency: session already completed", () => {
		it.effect(
			"should return completed, ensure public profile, and not re-acquire finalization lock",
			() =>
				Effect.gen(function* () {
					mockSessionRepo.getSession.mockReturnValue(
						Effect.succeed({ ...mockFinalizingSession, status: "completed" }),
					);

					const result = yield* generateResults({
						sessionId: "session_123",
						authenticatedUserId: "user_456",
					});

					expect(result).toEqual({ status: "completed" });
					expect(mockSessionRepo.acquireSessionLock).not.toHaveBeenCalled();
					expect(mockSessionRepo.updateSession).not.toHaveBeenCalled();
					expect(mockProfileRepo.getProfileBySessionId).toHaveBeenCalledWith("session_123");
					expect(mockProfileRepo.createProfile).toHaveBeenCalledWith({
						sessionId: "session_123",
						userId: "user_456",
					});
				}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Idempotency: result at stage=completed", () => {
		it.effect(
			"should return immediately when result already at completed stage and ensure profile",
			() =>
				Effect.gen(function* () {
					seedResult("session_123", { stage: "completed" });

					const result = yield* generateResults({
						sessionId: "session_123",
						authenticatedUserId: "user_456",
					});

					expect(result).toEqual({ status: "completed" });
					expect(mockSessionRepo.acquireSessionLock).not.toHaveBeenCalled();
					expect(mockProfileRepo.getProfileBySessionId).toHaveBeenCalledWith("session_123");
				}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Idempotency: result at stage=scored -> skip scoring, complete", () => {
		it.effect("should skip scoring and proceed to completion when stage=scored", () =>
			Effect.gen(function* () {
				seedResult("session_123", { stage: "scored" });

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });

				// Verify stage was updated to completed
				const results = getStoredResults();
				const record = results.get("session_123");
				expect(record?.stage).toBe("completed");

				// Session marked completed
				expect(mockSessionRepo.updateSession).toHaveBeenCalledWith(
					"session_123",
					expect.objectContaining({ status: "completed", finalizationProgress: "completed" }),
				);

				// Lock released
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Concurrent duplicate", () => {
		it.effect("should return current progress when lock fails", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({
						...mockFinalizingSession,
						finalizationProgress: "analyzing",
					}),
				);
				mockSessionRepo.acquireSessionLock.mockReturnValue(
					Effect.fail({
						_tag: "ConcurrentMessageError",
						sessionId: "session_123",
						message: "Lock held",
					}),
				);

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "analyzing" });
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Full pipeline: conversation evidence -> scores -> completed", () => {
		it.effect(
			"happy path: reads conversation evidence, computes scores, no portrait at finalization",
			() =>
				Effect.gen(function* () {
					// Seed conversation evidence
					const evidence = makeConversationEvidence("session_123", [
						{
							facet: "imagination",
							deviation: 2,
							strength: "strong",
							confidence: "high",
							domain: "work",
							note: "loves brainstorming",
						},
						{
							facet: "trust",
							deviation: 1,
							strength: "moderate",
							confidence: "medium",
							domain: "relationships",
							note: "open with friends",
						},
					]);
					seedConversationEvidence(evidence);

					const result = yield* generateResults({
						sessionId: "session_123",
						authenticatedUserId: "user_456",
					});

					expect(result).toEqual({ status: "completed" });

					expect(mockProfileRepo.createProfile).toHaveBeenCalledWith({
						sessionId: "session_123",
						userId: "user_456",
					});

					// Assessment result created with scores but no portrait (Story 32-0)
					const results = getStoredResults();
					expect(results.size).toBe(1);
					const record = results.get("session_123");
					expect(record).toBeDefined();
					expect(record?.stage).toBe("completed");
					expect(Object.keys(record?.facets ?? {})).toHaveLength(30);
					expect(Object.keys(record?.traits ?? {})).toHaveLength(5);
					expect(record?.portrait).toBe("");

					// Lock released
					expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("Story 8.3: queues bundled portrait job on first extension session completion", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({
						...mockFinalizingSession,
						parentConversationId: "parent-session-1",
					}),
				);
				mockSessionRepo.countCompletedExtensionSessionsExcluding.mockReturnValue(Effect.succeed(0));

				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 2,
						strength: "strong",
						confidence: "high",
						domain: "work",
						note: "extension evidence",
					},
				]);
				seedConversationEvidence(evidence);

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const queue = yield* PortraitJobQueue;
				const job = yield* Queue.take(queue);
				expect(job.sessionId).toBe("session_123");
				expect(job.userId).toBe("user_456");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"Story 8.3: does not queue bundled portrait on subsequent extension session completion",
			() =>
				Effect.gen(function* () {
					mockSessionRepo.getSession.mockReturnValue(
						Effect.succeed({
							...mockFinalizingSession,
							parentConversationId: "parent-session-1",
						}),
					);
					mockSessionRepo.countCompletedExtensionSessionsExcluding.mockReturnValue(Effect.succeed(1));

					const evidence = makeConversationEvidence("session_123", [
						{
							facet: "imagination",
							deviation: 2,
							strength: "strong",
							confidence: "high",
							domain: "work",
							note: "second extension evidence",
						},
					]);
					seedConversationEvidence(evidence);

					yield* generateResults({
						sessionId: "session_123",
						authenticatedUserId: "user_456",
					});

					const queue = yield* PortraitJobQueue;
					const polled = yield* Queue.poll(queue);
					expect(Option.isNone(polled)).toBe(true);
				}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("all 30 facets populated including defaults for missing evidence", () =>
			Effect.gen(function* () {
				// Only 1 facet has evidence
				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 3,
						strength: "strong",
						confidence: "high",
						domain: "leisure",
						note: "very creative",
					},
				]);
				seedConversationEvidence(evidence);

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const facets = record?.facets as Record<string, { score: number; confidence: number }>;

				for (const facet of ALL_FACETS) {
					expect(facets[facet]).toBeDefined();
				}

				// imagination has real evidence
				expect(facets.imagination.confidence).toBeGreaterThan(0);
				// Other facets at defaults
				expect(facets.artistic_interests.score).toBe(FORMULA_DEFAULTS.SCORE_MIDPOINT);
				expect(facets.artistic_interests.confidence).toBe(0);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("trait derivation: each trait score is mean of its 6 facets", () =>
			Effect.gen(function* () {
				// No evidence -> all defaults
				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const traits = record?.traits as Record<string, { score: number; confidence: number }>;

				for (const trait of TRAIT_NAMES) {
					expect(traits[trait].score).toBeCloseTo(FORMULA_DEFAULTS.SCORE_MIDPOINT * 6);
					expect(traits[trait].confidence).toBe(0);
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("domain coverage normalization: values sum to ~1.0", () =>
			Effect.gen(function* () {
				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 1,
						strength: "moderate",
						confidence: "medium",
						domain: "work",
						note: "test",
					},
					{
						facet: "altruism",
						deviation: 2,
						strength: "strong",
						confidence: "high",
						domain: "family",
						note: "test",
					},
					{
						facet: "trust",
						deviation: 1,
						strength: "moderate",
						confidence: "medium",
						domain: "work",
						note: "test",
					},
				]);
				seedConversationEvidence(evidence);

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const dc = record?.domainCoverage as Record<string, number>;

				const sum = LIFE_DOMAINS.reduce((acc, d) => acc + (dc[d] ?? 0), 0);
				expect(sum).toBeCloseTo(1.0);
				expect(dc.work).toBeCloseTo(2 / 3);
				expect(dc.family).toBeCloseTo(1 / 3);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("empty evidence: all defaults, domainCoverage all zeros", () =>
			Effect.gen(function* () {
				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const facets = record?.facets as Record<string, { score: number; confidence: number }>;
				const traits = record?.traits as Record<string, { score: number; confidence: number }>;
				const dc = record?.domainCoverage as Record<string, number>;

				for (const facet of ALL_FACETS) {
					expect(facets[facet].score).toBe(FORMULA_DEFAULTS.SCORE_MIDPOINT);
					expect(facets[facet].confidence).toBe(0);
				}
				for (const trait of TRAIT_NAMES) {
					expect(traits[trait].score).toBeCloseTo(FORMULA_DEFAULTS.SCORE_MIDPOINT * 6);
				}
				for (const domain of LIFE_DOMAINS) {
					expect(dc[domain]).toBe(0);
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Progress transitions", () => {
		it.effect("analyzing -> completed (no portrait generation step)", () =>
			Effect.gen(function* () {
				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 1,
						strength: "moderate",
						confidence: "medium",
						domain: "work",
						note: "test",
					},
				]);
				seedConversationEvidence(evidence);

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const updateCalls = mockSessionRepo.updateSession.mock.calls;
				const progressUpdates = updateCalls
					.filter(
						([, update]: [string, Record<string, unknown>]) => update.finalizationProgress !== undefined,
					)
					.map(([, update]: [string, Record<string, unknown>]) => update.finalizationProgress);

				expect(progressUpdates).toEqual(["analyzing", "completed"]);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Stage transitions", () => {
		it.effect("full pipeline: null -> scored -> completed", () =>
			Effect.gen(function* () {
				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 1,
						strength: "moderate",
						confidence: "medium",
						domain: "work",
						note: "test",
					},
				]);
				seedConversationEvidence(evidence);

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				// Final stage should be completed
				expect(record?.stage).toBe("completed");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("User summary (Story 7.1)", () => {
		it.effect("fails finalization when session has no userId", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockFinalizingSession, userId: null }),
				);

				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 1,
						strength: "moderate",
						confidence: "medium",
						domain: "work",
						note: "test",
					},
				]);
				seedConversationEvidence(evidence);

				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("fails pipeline when UserSummary generation fails", () =>
			Effect.gen(function* () {
				const evidence = makeConversationEvidence("session_123", [
					{
						facet: "imagination",
						deviation: 1,
						strength: "moderate",
						confidence: "medium",
						domain: "work",
						note: "test",
					},
				]);
				seedConversationEvidence(evidence);

				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("UserSummaryGenerationError");
				}
			}).pipe(Effect.provide(createTestLayerWithFailingUserSummaryGenerator())),
		);
	});
});
