/**
 * Test Layer Utilities
 *
 * Centralizes test Layer composition for Effect-based testing.
 * Uses @effect/vitest patterns for clean, maintainable tests.
 *
 * @see https://github.com/Effect-TS/effect/tree/main/packages/vitest
 * @see https://www.effect.solutions/testing
 */

import {
	AnalyzerRepository,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	type FacetEvidence,
	FacetEvidenceRepository,
	type FacetName,
	type FacetScoresMap,
	LoggerRepository,
	NerinAgentRepository,
	RedisRepository,
	type SavedFacetEvidence,
	ScorerRepository,
	TRAIT_TO_FACETS,
	type TraitName,
	type TraitScoresMap,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * Creates a test Layer for AssessmentSessionRepository.
 *
 * Provides an in-memory implementation for testing without database.
 *
 * @example
 * ```typescript
 * it.effect('should create session', () =>
 *   Effect.gen(function* () {
 *     const sessionRepo = yield* AssessmentSessionRepository
 *     const session = yield* sessionRepo.createSession("user123")
 *     expect(session.sessionId).toBeDefined()
 *   }).pipe(Effect.provide(createTestAssessmentSessionLayer()))
 * )
 * ```
 */
export const createTestAssessmentSessionLayer = () => {
	const sessions = new Map<string, any>();

	return Layer.succeed(AssessmentSessionRepository, {
		createSession: (userId?: string) =>
			Effect.sync(() => {
				const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
				const session = {
					sessionId,
					userId,
					createdAt: new Date(),
					precision: {
						openness: 50,
						conscientiousness: 50,
						extraversion: 50,
						agreeableness: 50,
						neuroticism: 50,
					},
				};
				sessions.set(sessionId, session);
				return session;
			}),

		getSession: (sessionId: string) =>
			Effect.sync(() => {
				const session = sessions.get(sessionId);
				if (!session) {
					throw new Error(`SessionNotFound: ${sessionId}`);
				}
				return session;
			}),

		updateSession: (sessionId: string, updates: any) =>
			Effect.sync(() => {
				const session = sessions.get(sessionId);
				if (!session) {
					throw new Error(`SessionNotFound: ${sessionId}`);
				}
				const updated = { ...session, ...updates };
				sessions.set(sessionId, updated);
				return updated;
			}),
	});
};

/**
 * Creates a test Layer for AssessmentMessageRepository.
 *
 * Provides an in-memory message store for testing.
 */
export const createTestAssessmentMessageLayer = () => {
	const messages = new Map<string, any[]>();

	return Layer.succeed(AssessmentMessageRepository, {
		saveMessage: (sessionId: string, role: "user" | "assistant", content: string, userId?: string) =>
			Effect.sync(() => {
				const message = {
					id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
					sessionId,
					role,
					content,
					userId: userId ?? null, // Convert undefined to null to match entity schema
					createdAt: new Date(),
				};
				const sessionMessages = messages.get(sessionId) || [];
				sessionMessages.push(message);
				messages.set(sessionId, sessionMessages);
				return message as any; // Type assertion to bypass union type complexity
			}),

		getMessages: (sessionId: string) => Effect.sync(() => messages.get(sessionId) || []),

		getMessageCount: (sessionId: string) => Effect.sync(() => (messages.get(sessionId) || []).length),
	});
};

/**
 * Creates a test Layer for LoggerRepository.
 *
 * Provides a no-op logger for testing (logs are suppressed).
 */
export const createTestLoggerLayer = () =>
	Layer.succeed(LoggerRepository, {
		info: () => {},
		error: () => {},
		warn: () => {},
		debug: () => {},
	});

/**
 * Creates a test Layer for CostGuardRepository.
 *
 * Provides an in-memory cost tracking implementation.
 */
export const createTestCostGuardLayer = () => {
	const costs = new Map<string, number>();
	const assessments = new Map<string, number>();

	return Layer.succeed(CostGuardRepository, {
		incrementDailyCost: (userId: string, costCents: number) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${new Date().toISOString().split("T")[0]}`;
				const current = costs.get(key) || 0;
				const updated = current + costCents;
				costs.set(key, updated);
				return updated;
			}),

		getDailyCost: (userId: string) =>
			Effect.sync(() => {
				const key = `cost:${userId}:${new Date().toISOString().split("T")[0]}`;
				return costs.get(key) || 0;
			}),

		incrementAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${new Date().toISOString().split("T")[0]}`;
				const current = assessments.get(key) || 0;
				const updated = current + 1;
				assessments.set(key, updated);
				return updated;
			}),

		getAssessmentCount: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${new Date().toISOString().split("T")[0]}`;
				return assessments.get(key) || 0;
			}),
	});
};

/**
 * Creates a test Layer for RedisRepository.
 *
 * Provides an in-memory Redis implementation for testing.
 */
export const createTestRedisLayer = () => {
	const store = new Map<string, string>();
	const ttls = new Map<string, number>();

	return Layer.succeed(RedisRepository, {
		get: (key: string) => Effect.sync(() => store.get(key) || null),

		incrby: (key: string, increment: number) =>
			Effect.sync(() => {
				const current = Number.parseInt(store.get(key) || "0", 10);
				const updated = current + increment;
				store.set(key, updated.toString());
				return updated;
			}),

		incr: (key: string) =>
			Effect.sync(() => {
				const current = Number.parseInt(store.get(key) || "0", 10);
				const updated = current + 1;
				store.set(key, updated.toString());
				return updated;
			}),

		expire: (key: string, seconds: number) =>
			Effect.sync(() => {
				ttls.set(key, seconds);
				return 1;
			}),

		ttl: (key: string) => Effect.sync(() => ttls.get(key) || -1),

		ping: () => Effect.succeed(true),

		disconnect: () => Effect.void,
	});
};

/**
 * Creates a test Layer for NerinAgentRepository.
 *
 * Provides a mock Nerin agent for testing without Claude API calls.
 */
export const createTestNerinAgentLayer = () =>
	Layer.succeed(NerinAgentRepository, {
		invoke: (input) =>
			Effect.succeed({
				response: `Mock response for session ${input.sessionId}`,
				tokenCount: {
					input: 100,
					output: 50,
					total: 150,
				},
			}),
	});

/**
 * Creates a test Layer for AnalyzerRepository.
 *
 * Provides a mock analyzer for testing without Claude API calls.
 * Returns deterministic facet evidence for predictable testing.
 */
export const createTestAnalyzerLayer = () =>
	Layer.succeed(AnalyzerRepository, {
		analyzeFacets: (assessmentMessageId: string, content: string) =>
			Effect.sync(() => {
				// Return deterministic evidence based on message content
				const evidence: FacetEvidence[] = [];

				// Check for openness signals
				if (
					content.toLowerCase().includes("creative") ||
					content.toLowerCase().includes("imaginat") ||
					content.toLowerCase().includes("ideas")
				) {
					evidence.push({
						assessmentMessageId,
						facetName: "imagination",
						score: 16,
						confidence: 0.85,
						quote: content.substring(0, Math.min(30, content.length)),
						highlightRange: { start: 0, end: Math.min(30, content.length) },
					});
				}

				// Check for agreeableness signals
				if (
					content.toLowerCase().includes("help") ||
					content.toLowerCase().includes("care") ||
					content.toLowerCase().includes("kind")
				) {
					evidence.push({
						assessmentMessageId,
						facetName: "altruism",
						score: 18,
						confidence: 0.9,
						quote: content.substring(0, Math.min(25, content.length)),
						highlightRange: { start: 0, end: Math.min(25, content.length) },
					});
				}

				// Check for conscientiousness signals
				if (
					content.toLowerCase().includes("organized") ||
					content.toLowerCase().includes("plan") ||
					content.toLowerCase().includes("schedule")
				) {
					evidence.push({
						assessmentMessageId,
						facetName: "orderliness",
						score: 17,
						confidence: 0.8,
						quote: content.substring(0, Math.min(20, content.length)),
						highlightRange: { start: 0, end: Math.min(20, content.length) },
					});
				}

				// Always return at least one piece of evidence for testing
				if (evidence.length === 0) {
					evidence.push({
						assessmentMessageId,
						facetName: "intellect",
						score: 12,
						confidence: 0.6,
						quote: content.substring(0, Math.min(20, content.length)),
						highlightRange: { start: 0, end: Math.min(20, content.length) },
					});
				}

				return evidence;
			}),
	});

/**
 * Creates a test Layer for ScorerRepository.
 *
 * Provides a mock scorer for testing without database queries.
 * Returns deterministic aggregated scores and derived traits.
 */
export const createTestScorerLayer = () =>
	Layer.succeed(ScorerRepository, {
		aggregateFacetScores: (_sessionId: string) =>
			Effect.sync(() => {
				// Return mock aggregated facet scores
				const facetScores: FacetScoresMap = {
					imagination: { score: 16.5, confidence: 0.85 },
					artistic_interests: { score: 15.2, confidence: 0.8 },
					emotionality: { score: 14.8, confidence: 0.78 },
					adventurousness: { score: 17.1, confidence: 0.88 },
					intellect: { score: 16.9, confidence: 0.87 },
					liberalism: { score: 15.5, confidence: 0.82 },
					// Add a few more for other traits
					altruism: { score: 18.2, confidence: 0.9 },
					cooperation: { score: 17.5, confidence: 0.85 },
				};
				return facetScores;
			}),

		deriveTraitScores: (facetScores: FacetScoresMap) =>
			Effect.sync(() => {
				// Calculate trait scores from facet scores (same algorithm as production)
				const traitScores: TraitScoresMap = {};

				for (const [traitName, facetNames] of Object.entries(TRAIT_TO_FACETS)) {
					const facetsForTrait = facetNames.map((fn) => facetScores[fn]).filter((f) => f !== undefined);

					if (facetsForTrait.length === 0) continue;

					// Mean of facet scores
					const scores = facetsForTrait.map((f) => f?.score);
					const traitScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

					// Minimum confidence
					const confidences = facetsForTrait.map((f) => f?.confidence);
					const traitConfidence = Math.min(...confidences);

					traitScores[traitName as TraitName] = {
						score: Math.round(traitScore * 10) / 10,
						confidence: Math.round(traitConfidence * 100) / 100,
					};
				}

				return traitScores;
			}),
	});

/**
 * Creates a test Layer for FacetEvidenceRepository.
 *
 * Provides an in-memory evidence store for testing.
 * Stores evidence by assessment message ID with generated UUIDs.
 */
export const createTestFacetEvidenceLayer = () => {
	// In-memory evidence store: assessmentMessageId -> SavedFacetEvidence[]
	const evidenceByMessage = new Map<string, SavedFacetEvidence[]>();
	// Track all evidence for session-level queries (sessionId -> assessmentMessageId[])
	const messagesBySession = new Map<string, string[]>();

	return Layer.succeed(FacetEvidenceRepository, {
		saveEvidence: (assessmentMessageId: string, evidence: FacetEvidence[]) =>
			Effect.sync(() => {
				const saved: SavedFacetEvidence[] = evidence.map((e) => ({
					...e,
					id: `evidence_${Date.now()}_${Math.random().toString(36).substring(7)}`,
					createdAt: new Date(),
				}));

				const existing = evidenceByMessage.get(assessmentMessageId) || [];
				evidenceByMessage.set(assessmentMessageId, [...existing, ...saved]);

				return saved;
			}),

		getEvidenceByMessage: (assessmentMessageId: string) =>
			Effect.sync(() => evidenceByMessage.get(assessmentMessageId) || []),

		getEvidenceByFacet: (sessionId: string, facetName: FacetName) =>
			Effect.sync(() => {
				const assessmentMessageIds = messagesBySession.get(sessionId) || [];
				const allEvidence: SavedFacetEvidence[] = [];

				for (const msgId of assessmentMessageIds) {
					const evidence = evidenceByMessage.get(msgId) || [];
					allEvidence.push(...evidence.filter((e) => e.facetName === facetName));
				}

				return allEvidence;
			}),

		getEvidenceBySession: (sessionId: string) =>
			Effect.sync(() => {
				const assessmentMessageIds = messagesBySession.get(sessionId) || [];
				const allEvidence: SavedFacetEvidence[] = [];

				for (const msgId of assessmentMessageIds) {
					const evidence = evidenceByMessage.get(msgId) || [];
					allEvidence.push(...evidence);
				}

				return allEvidence;
			}),
	});
};

/**
 * Complete test Layer merging all repository mocks.
 *
 * Provides all dependencies needed for use-case testing.
 *
 * @example
 * ```typescript
 * it.effect('should process message', () =>
 *   Effect.gen(function* () {
 *     const result = yield* sendMessage({ sessionId: "test", message: "Hello" })
 *     expect(result.response).toBeDefined()
 *   }).pipe(Effect.provide(TestRepositoriesLayer))
 * )
 * ```
 */
export const TestRepositoriesLayer = Layer.mergeAll(
	createTestAssessmentSessionLayer(),
	createTestAssessmentMessageLayer(),
	createTestLoggerLayer(),
	createTestCostGuardLayer(),
	createTestRedisLayer(),
	createTestNerinAgentLayer(),
	createTestAnalyzerLayer(),
	createTestScorerLayer(),
	createTestFacetEvidenceLayer(),
);

/**
 * Helper to provide test Layer to Effect programs.
 *
 * Simplifies test setup by automatically providing TestRepositoriesLayer.
 *
 * @deprecated Use Effect.provide directly with TestRepositoriesLayer for better type safety
 * @example
 * ```typescript
 * // Preferred approach (direct):
 * const result = await Effect.runPromise(
 *   myUseCase({ ... }).pipe(Effect.provide(TestRepositoriesLayer))
 * )
 *
 * // Alternative (helper):
 * const result = await Effect.runPromise(
 *   provideTestLayer(myUseCase({ ... }))
 * )
 * ```
 */
export const provideTestLayer = <A, E>(effect: Effect.Effect<A, E, any>) =>
	Effect.provide(effect, TestRepositoriesLayer);
