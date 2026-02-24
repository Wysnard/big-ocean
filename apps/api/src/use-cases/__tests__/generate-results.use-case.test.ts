/**
 * Generate Results Use Case Tests (Story 11.1 + 11.2)
 *
 * Tests idempotency tiers, session validation, FinAnalyzer integration,
 * highlight computation, and evidence persistence.
 */

import { vi } from "vitest";

// Activate mocking — Vitest auto-resolves to __mocks__ siblings
vi.mock("@workspace/infrastructure/repositories/finanalyzer.anthropic.repository");
vi.mock("@workspace/infrastructure/repositories/finalization-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-result.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-message.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/cost-guard.redis.repository");

import { describe, expect, it } from "@effect/vitest";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	LoggerRepository,
} from "@workspace/domain";
import {
	AssessmentMessageDrizzleRepositoryLive,
	_resetMockState as resetMessages,
} from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import {
	AssessmentResultDrizzleRepositoryLive,
	_getStoredResults as getStoredResults,
	_resetMockState as resetResults,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import {
	CostGuardRedisRepositoryLive,
	_resetMockState as resetCostGuard,
} from "@workspace/infrastructure/repositories/cost-guard.redis.repository";
import {
	FinalizationEvidenceDrizzleRepositoryLive,
	_getStoredEvidence as getStoredEvidence,
	_resetMockState as resetEvidence,
	_setExistsOverride as setEvidenceExists,
} from "@workspace/infrastructure/repositories/finalization-evidence.drizzle.repository";
// Import mock layers (Vitest replaces with __mocks__ versions)
// Import mock helpers
import {
	FinanalyzerAnthropicRepositoryLive,
	_failForCalls as failFinanalyzerForCalls,
	_getMockCalls as getFinanalyzerCalls,
	_resetMockState as resetFinanalyzer,
	_setMockError as setFinanalyzerError,
	_setMockOutput as setFinanalyzerOutput,
} from "@workspace/infrastructure/repositories/finanalyzer.anthropic.repository";
import { Effect, Layer } from "effect";
import { generateResults } from "../generate-results.use-case";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	findByToken: vi.fn(),
	assignUserId: vi.fn(),
	rotateToken: vi.fn(),
	incrementMessageCount: vi.fn(),
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
};

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockFinalizingSession = {
	id: "session_123",
	userId: "user_456",
	sessionToken: "mock_token",
	createdAt: new Date("2026-02-01"),
	updatedAt: new Date("2026-02-01"),
	status: "finalizing",
	messageCount: 25,
	finalizationProgress: null,
	personalDescription: null,
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
		FinanalyzerAnthropicRepositoryLive,
		FinalizationEvidenceDrizzleRepositoryLive,
		AssessmentResultDrizzleRepositoryLive,
		AssessmentMessageDrizzleRepositoryLive,
		CostGuardRedisRepositoryLive,
	);

/** Helper: seed messages and return their IDs */
const seedMessages = (
	sessionId: string,
	msgs: Array<{ role: "user" | "assistant"; content: string }>,
) =>
	Effect.gen(function* () {
		const messageRepo = yield* AssessmentMessageRepository;
		const savedIds: string[] = [];
		for (const msg of msgs) {
			const saved = yield* messageRepo.saveMessage(
				sessionId,
				msg.role,
				msg.content,
				msg.role === "user" ? "user_456" : undefined,
			);
			savedIds.push(saved.id);
		}
		return savedIds;
	});

describe("generateResults Use Case", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetFinanalyzer();
		resetEvidence();
		resetResults();
		resetMessages();
		resetCostGuard();
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockFinalizingSession));
		mockSessionRepo.updateSession.mockReturnValue(Effect.succeed(mockFinalizingSession));
		mockSessionRepo.acquireSessionLock.mockReturnValue(Effect.void);
		mockSessionRepo.releaseSessionLock.mockReturnValue(Effect.void);
		mockLoggerRepo.info.mockImplementation(() => {});
		mockLoggerRepo.warn.mockImplementation(() => {});
	});

	describe("Session validation (Story 11.1)", () => {
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

	describe("Idempotency tier 1: already completed (Story 11.1)", () => {
		it.effect("should return completed without side effects", () =>
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
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Idempotency tier 2: concurrent duplicate (Story 11.1)", () => {
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
				expect(mockSessionRepo.updateSession).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Phase 1: FinAnalyzer integration (Story 11.2)", () => {
		it.effect("happy path: FinAnalyzer called, evidence saved, result placeholder created", () =>
			Effect.gen(function* () {
				// Seed messages
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I love brainstorming new things" },
					{ role: "assistant", content: "That sounds creative!" },
				]);

				// Configure finanalyzer to reference real message IDs
				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.7,
							domain: "work",
							rawDomain: "creative work",
							quote: "I love brainstorming",
						},
						{
							messageId: ids[1],
							bigfiveFacet: "trust",
							score: 13,
							confidence: 0.6,
							domain: "relationships",
							rawDomain: "friends",
							quote: "sounds creative",
						},
					],
					tokenUsage: { input: 3000, output: 1500 },
				});

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });

				// FinAnalyzer was called with messages
				const calls = getFinanalyzerCalls();
				expect(calls).toHaveLength(1);
				expect(calls[0].messages).toHaveLength(2);

				// Evidence was saved
				const evidence = getStoredEvidence();
				expect(evidence).toHaveLength(2);
				expect(evidence[0].bigfiveFacet).toBe("imagination");
				expect(evidence[1].bigfiveFacet).toBe("trust");

				// Assessment result placeholder was created
				const results = getStoredResults();
				expect(results.size).toBe(1);
				const resultRecord = results.get("session_123");
				expect(resultRecord).toBeDefined();
				expect(resultRecord?.portrait).toBe("");
				expect(resultRecord?.facets).toEqual({});

				// Lock was released
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("idempotency Guard 2: evidence exists, FinAnalyzer NOT called", () =>
			Effect.gen(function* () {
				setEvidenceExists(true);

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });

				// FinAnalyzer was NOT called
				const calls = getFinanalyzerCalls();
				expect(calls).toHaveLength(0);

				// Logger recorded the skip
				expect(mockLoggerRepo.info).toHaveBeenCalledWith(
					expect.stringContaining("Idempotency Guard 2"),
					expect.any(Object),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("FinAnalyzer failure after retry: error propagates, lock released", () =>
			Effect.gen(function* () {
				yield* seedMessages("session_123", [{ role: "user", content: "test message" }]);

				setFinanalyzerError("Anthropic API timeout");

				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("FinanalyzerError");
				}

				// Verify retry was attempted (AC#6: retries once)
				const calls = getFinanalyzerCalls();
				expect(calls).toHaveLength(2); // initial call + 1 retry

				// Lock was still released
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("FinAnalyzer first call fails, retry succeeds: evidence saved correctly", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I enjoy creative problem solving" },
				]);

				// Configure: first call fails, retry succeeds
				failFinanalyzerForCalls(1, "Transient network error");
				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "intellect",
							score: 15,
							confidence: 0.8,
							domain: "work",
							rawDomain: "engineering",
							quote: "creative problem solving",
						},
					],
					tokenUsage: { input: 2000, output: 1000 },
				});

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });

				// Verify 2 calls (initial failed + successful retry)
				const calls = getFinanalyzerCalls();
				expect(calls).toHaveLength(2);

				// Evidence was saved from the successful retry
				const evidence = getStoredEvidence();
				expect(evidence).toHaveLength(1);
				expect(evidence[0].bigfiveFacet).toBe("intellect");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("invalid messageId from LLM: evidence item skipped, others saved", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I love problem solving" },
				]);

				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "intellect",
							score: 15,
							confidence: 0.8,
							domain: "work",
							rawDomain: "engineering",
							quote: "I love problem solving",
						},
						{
							messageId: "nonexistent-id",
							bigfiveFacet: "trust",
							score: 12,
							confidence: 0.5,
							domain: "relationships",
							rawDomain: "friends",
							quote: "some quote",
						},
					],
					tokenUsage: { input: 2000, output: 1000 },
				});

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });

				// Only valid evidence saved
				const evidence = getStoredEvidence();
				expect(evidence).toHaveLength(1);
				expect(evidence[0].bigfiveFacet).toBe("intellect");

				// Warning logged
				expect(mockLoggerRepo.warn).toHaveBeenCalledWith(
					expect.stringContaining("invalid messageId"),
					expect.objectContaining({ messageId: "nonexistent-id" }),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("highlight computation: found → positions, not found → null", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I really enjoy solving complex problems at work" },
				]);

				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "intellect",
							score: 16,
							confidence: 0.8,
							domain: "work",
							rawDomain: "engineering",
							quote: "solving complex problems",
						},
						{
							messageId: ids[0],
							bigfiveFacet: "achievement_striving",
							score: 14,
							confidence: 0.6,
							domain: "work",
							rawDomain: "career",
							quote: "nonexistent quote text",
						},
					],
					tokenUsage: { input: 2000, output: 1000 },
				});

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const evidence = getStoredEvidence();
				expect(evidence).toHaveLength(2);

				// Quote found → positions set
				const found = evidence.find((e) => e.bigfiveFacet === "intellect");
				expect(found?.highlightStart).toBe(15);
				expect(found?.highlightEnd).toBe(39);

				// Quote not found → null
				const notFound = evidence.find((e) => e.bigfiveFacet === "achievement_striving");
				expect(notFound?.highlightStart).toBeNull();
				expect(notFound?.highlightEnd).toBeNull();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("messages are passed to FinAnalyzer in insertion order", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "First message" },
					{ role: "assistant", content: "Second message" },
					{ role: "user", content: "Third message" },
				]);

				setFinanalyzerOutput({
					evidence: [],
					tokenUsage: { input: 1000, output: 500 },
				});

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const calls = getFinanalyzerCalls();
				expect(calls).toHaveLength(1);
				const msgs = calls[0].messages;
				expect(msgs).toHaveLength(3);
				expect(msgs[0].content).toBe("First message");
				expect(msgs[1].content).toBe("Second message");
				expect(msgs[2].content).toBe("Third message");
				expect(msgs[0].id).toBe(ids[0]);
				expect(msgs[1].id).toBe(ids[1]);
				expect(msgs[2].id).toBe(ids[2]);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("empty conversation: FinAnalyzer called with empty array, placeholder created", () =>
			Effect.gen(function* () {
				setFinanalyzerOutput({
					evidence: [],
					tokenUsage: { input: 500, output: 100 },
				});

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });

				// FinAnalyzer called with empty messages
				const calls = getFinanalyzerCalls();
				expect(calls).toHaveLength(1);
				expect(calls[0].messages).toHaveLength(0);

				// Assessment result placeholder still created
				const results = getStoredResults();
				expect(results.size).toBe(1);

				// No evidence saved (empty batch)
				const evidence = getStoredEvidence();
				expect(evidence).toHaveLength(0);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
