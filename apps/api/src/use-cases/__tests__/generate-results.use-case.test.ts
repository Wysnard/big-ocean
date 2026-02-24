/**
 * Generate Results Use Case Tests (Story 11.1 + 11.2 + 11.3)
 *
 * Tests idempotency tiers, session validation, FinAnalyzer integration,
 * highlight computation, evidence persistence, and score computation.
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
	ALL_FACETS,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	type FinalizationEvidenceRecord,
	FORMULA_DEFAULTS,
	LIFE_DOMAINS,
	LoggerRepository,
	TRAIT_NAMES,
} from "@workspace/domain";
import {
	AssessmentMessageDrizzleRepositoryLive,
	_resetMockState as resetMessages,
} from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import {
	AssessmentResultDrizzleRepositoryLive,
	_getStoredResults as getStoredResults,
	_resetMockState as resetResults,
	_seedResult as seedResult,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import {
	CostGuardRedisRepositoryLive,
	_resetMockState as resetCostGuard,
} from "@workspace/infrastructure/repositories/cost-guard.redis.repository";
import {
	FinalizationEvidenceDrizzleRepositoryLive,
	_getStoredEvidence as getStoredEvidence,
	_resetMockState as resetEvidence,
	_seedEvidence as seedEvidence,
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

				// Assessment result was created and updated with Phase 2 scores
				const results = getStoredResults();
				expect(results.size).toBe(1);
				const resultRecord = results.get("session_123");
				expect(resultRecord).toBeDefined();
				expect(resultRecord?.portrait).toBe("");
				// Phase 2 populated facets/traits (no longer empty)
				expect(Object.keys(resultRecord?.facets ?? {})).toHaveLength(30);

				// Lock was released
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect(
			"idempotency Guard 2: evidence exists, FinAnalyzer NOT called, scores still computed",
			() =>
				Effect.gen(function* () {
					setEvidenceExists(true);
					// Pre-seed assessment result (Phase 1 ran in a previous attempt)
					const seededResult = seedResult("session_123", { id: "ar-guard2" });
					// Pre-seed finalization evidence linked to that result
					seedEvidence([
						{
							id: "fe-1",
							assessmentMessageId: "msg-1",
							assessmentResultId: seededResult.id,
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.7,
							domain: "work",
							rawDomain: "creative work",
							quote: "test",
							highlightStart: 0,
							highlightEnd: 4,
							createdAt: new Date(),
						} as FinalizationEvidenceRecord,
					]);

					const result = yield* generateResults({
						sessionId: "session_123",
						authenticatedUserId: "user_456",
					});

					expect(result).toEqual({ status: "completed" });

					// FinAnalyzer was NOT called
					const calls = getFinanalyzerCalls();
					expect(calls).toHaveLength(0);

					// But Phase 2 still computed scores
					const results = getStoredResults();
					const resultRecord = results.get("session_123");
					expect(Object.keys(resultRecord?.facets ?? {})).toHaveLength(30);
					expect(Object.keys(resultRecord?.traits ?? {})).toHaveLength(5);

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

				// Assessment result created and updated with defaults (Phase 2 ran)
				const results = getStoredResults();
				expect(results.size).toBe(1);

				// No evidence saved (empty batch — saveBatch([]) is a no-op)
				const evidence = getStoredEvidence();
				expect(evidence).toHaveLength(0);

				// Lock was released
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Phase 2: Score computation (Story 11.3)", () => {
		it.effect("happy path: evidence → scores computed → assessment_results updated", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I love brainstorming new things" },
					{ role: "assistant", content: "That sounds creative!" },
				]);

				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.7,
							domain: "work",
							rawDomain: "creative work",
							quote: "brainstorming",
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

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				expect(record).toBeDefined();

				// All 30 facets populated
				const facetKeys = Object.keys(record?.facets);
				expect(facetKeys).toHaveLength(30);

				// All 5 traits populated
				const traitKeys = Object.keys(record?.traits);
				expect(traitKeys).toHaveLength(5);

				// Domain coverage populated
				const dcKeys = Object.keys(record?.domainCoverage);
				expect(dcKeys).toHaveLength(6);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("all 30 facets populated including defaults for missing evidence", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I like to explore" },
				]);

				// Only 1 facet has evidence
				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "imagination",
							score: 16,
							confidence: 0.9,
							domain: "leisure",
							rawDomain: "hobbies",
							quote: "explore",
						},
					],
					tokenUsage: { input: 1000, output: 500 },
				});

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const facets = record?.facets as Record<
					string,
					{ score: number; confidence: number; signalPower: number }
				>;

				// All 30 facets present
				for (const facet of ALL_FACETS) {
					expect(facets[facet]).toBeDefined();
				}

				// imagination has real evidence
				expect(facets.imagination.confidence).toBeGreaterThan(0);

				// Other 29 facets have defaults
				expect(facets.artistic_interests.score).toBe(FORMULA_DEFAULTS.SCORE_MIDPOINT);
				expect(facets.artistic_interests.confidence).toBe(0);
				expect(facets.artistic_interests.signalPower).toBe(0);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("trait derivation: each trait score is mean of its 6 facets", () =>
			Effect.gen(function* () {
				// Use empty evidence → all facets at defaults → all traits = SCORE_MIDPOINT
				setFinanalyzerOutput({
					evidence: [],
					tokenUsage: { input: 500, output: 100 },
				});

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const traits = record?.traits as Record<
					string,
					{ score: number; confidence: number; signalPower: number }
				>;

				for (const trait of TRAIT_NAMES) {
					expect(traits[trait].score).toBeCloseTo(FORMULA_DEFAULTS.SCORE_MIDPOINT);
					expect(traits[trait].confidence).toBe(0);
					expect(traits[trait].signalPower).toBe(0);
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("domain coverage normalization: values sum to ~1.0", () =>
			Effect.gen(function* () {
				const ids = yield* seedMessages("session_123", [
					{ role: "user", content: "I love work and family" },
					{ role: "assistant", content: "Tell me more" },
				]);

				setFinanalyzerOutput({
					evidence: [
						{
							messageId: ids[0],
							bigfiveFacet: "imagination",
							score: 14,
							confidence: 0.7,
							domain: "work",
							rawDomain: "career",
							quote: "work",
						},
						{
							messageId: ids[0],
							bigfiveFacet: "altruism",
							score: 16,
							confidence: 0.8,
							domain: "family",
							rawDomain: "kids",
							quote: "family",
						},
						{
							messageId: ids[0],
							bigfiveFacet: "trust",
							score: 12,
							confidence: 0.6,
							domain: "work",
							rawDomain: "office",
							quote: "love",
						},
					],
					tokenUsage: { input: 2000, output: 1000 },
				});

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const dc = record?.domainCoverage as Record<string, number>;

				const sum = LIFE_DOMAINS.reduce((acc, d) => acc + (dc[d] ?? 0), 0);
				expect(sum).toBeCloseTo(1.0);
				// 2 work + 1 family = 2/3 work, 1/3 family
				expect(dc.work).toBeCloseTo(2 / 3);
				expect(dc.family).toBeCloseTo(1 / 3);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("empty evidence edge case: all defaults, domainCoverage all zeros", () =>
			Effect.gen(function* () {
				setFinanalyzerOutput({
					evidence: [],
					tokenUsage: { input: 500, output: 100 },
				});

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const facets = record?.facets as Record<
					string,
					{ score: number; confidence: number; signalPower: number }
				>;
				const traits = record?.traits as Record<
					string,
					{ score: number; confidence: number; signalPower: number }
				>;
				const dc = record?.domainCoverage as Record<string, number>;

				// All 30 facets at defaults
				for (const facet of ALL_FACETS) {
					expect(facets[facet].score).toBe(FORMULA_DEFAULTS.SCORE_MIDPOINT);
					expect(facets[facet].confidence).toBe(0);
				}

				// All traits at defaults
				for (const trait of TRAIT_NAMES) {
					expect(traits[trait].score).toBeCloseTo(FORMULA_DEFAULTS.SCORE_MIDPOINT);
				}

				// Domain coverage all zeros
				for (const domain of LIFE_DOMAINS) {
					expect(dc[domain]).toBe(0);
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("Guard 2 path: scores computed from pre-existing evidence", () =>
			Effect.gen(function* () {
				setEvidenceExists(true);
				const seededResult = seedResult("session_123", { id: "ar-g2-scores" });
				seedEvidence([
					{
						id: "fe-g2-1",
						assessmentMessageId: "msg-1",
						assessmentResultId: seededResult.id,
						bigfiveFacet: "intellect",
						score: 18,
						confidence: 0.9,
						domain: "work",
						rawDomain: "research",
						quote: "test",
						highlightStart: 0,
						highlightEnd: 4,
						createdAt: new Date(),
					} as FinalizationEvidenceRecord,
					{
						id: "fe-g2-2",
						assessmentMessageId: "msg-2",
						assessmentResultId: seededResult.id,
						bigfiveFacet: "adventurousness",
						score: 12,
						confidence: 0.5,
						domain: "leisure",
						rawDomain: "travel",
						quote: "test2",
						highlightStart: 0,
						highlightEnd: 5,
						createdAt: new Date(),
					} as FinalizationEvidenceRecord,
				]);

				yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				const results = getStoredResults();
				const record = results.get("session_123");
				const facets = record?.facets as Record<
					string,
					{ score: number; confidence: number; signalPower: number }
				>;

				// intellect should have real evidence
				expect(facets.intellect.confidence).toBeGreaterThan(0);
				// adventurousness should have real evidence
				expect(facets.adventurousness.confidence).toBeGreaterThan(0);
				// Other facets at defaults
				expect(facets.imagination.score).toBe(FORMULA_DEFAULTS.SCORE_MIDPOINT);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
