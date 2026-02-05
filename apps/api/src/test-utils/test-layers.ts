/**
 * Test Layer Utilities
 *
 * Centralizes test Layer composition for Effect-based testing.
 * Uses @effect/vitest patterns for clean, maintainable tests.
 *
 * @see https://github.com/Effect-TS/effect/tree/main/packages/vitest
 * @see https://www.effect.solutions/testing
 */

import { RateLimitExceeded } from "@workspace/contracts";
import {
	AnalyzerRepository,
	AppConfig,
	type AppConfigService,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	BudgetPausedError,
	CostGuardRepository,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	type FacetEvidence,
	FacetEvidenceRepository,
	type FacetName,
	type FacetScore,
	type FacetScoresMap,
	initializeFacetConfidence,
	LoggerRepository,
	NerinAgentRepository,
	OrchestratorRepository,
	type ProcessMessageInput,
	RedisRepository,
	type SavedFacetEvidence,
	ScorerRepository,
	TRAIT_TO_FACETS,
	type TraitName,
	type TraitScoresMap,
} from "@workspace/domain";
import { DateTime, Effect, Layer, Redacted } from "effect";

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
	// biome-ignore lint/suspicious/noExplicitAny: test layer stores dynamic session objects
	const sessions = new Map<string, any>();

	return Layer.succeed(AssessmentSessionRepository, {
		createSession: (userId?: string) =>
			Effect.sync(() => {
				const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
				const session = {
					sessionId,
					userId,
					createdAt: new Date(),
					confidence: initializeFacetConfidence(50),
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

		// biome-ignore lint/suspicious/noExplicitAny: test layer accepts flexible update objects
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
	// biome-ignore lint/suspicious/noExplicitAny: test layer stores dynamic message objects
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
				// biome-ignore lint/suspicious/noExplicitAny: bypass union type complexity in test layer
				return message as any;
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
 * Creates a test Layer for AppConfig.
 *
 * Provides a test configuration with sensible defaults for testing.
 */
export const createTestAppConfigLayer = () =>
	Layer.succeed(AppConfig, {
		databaseUrl: "postgresql://test:test@localhost:5432/test",
		redisUrl: "redis://localhost:6379",
		anthropicApiKey: Redacted.make("test-api-key"),
		betterAuthSecret: Redacted.make("test-secret"),
		betterAuthUrl: "http://localhost:4000",
		frontendUrl: "http://localhost:3000",
		port: 4000,
		nodeEnv: "test",
		analyzerModelId: "claude-sonnet-4-20250514",
		analyzerMaxTokens: 2048,
		analyzerTemperature: 0.3,
		dailyCostLimit: 75,
	} satisfies AppConfigService);

/**
 * Creates a test Layer for CostGuardRepository.
 *
 * Provides an in-memory cost tracking and rate limiting implementation.
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

		canStartAssessment: (userId: string) =>
			Effect.sync(() => {
				const key = `assessments:${userId}:${new Date().toISOString().split("T")[0]}`;
				const count = assessments.get(key) || 0;
				return count < 1;
			}),

		recordAssessmentStart: (userId: string) =>
			Effect.gen(function* () {
				const key = `assessments:${userId}:${new Date().toISOString().split("T")[0]}`;
				const current = assessments.get(key) || 0;
				const newCount = current + 1;
				assessments.set(key, newCount);
				if (newCount > 1) {
					const tomorrow = new Date();
					tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
					tomorrow.setUTCHours(0, 0, 0, 0);
					return yield* Effect.fail(
						new RateLimitExceeded({
							userId,
							message: "You can start a new assessment tomorrow",
							resetAt: DateTime.unsafeMake(tomorrow.getTime()),
						}),
					);
				}
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
						confidence: 85,
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
						confidence: 90,
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
						confidence: 80,
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
						confidence: 60,
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
				// Return mock aggregated facet scores (initialize all 30, then override some)
				return createInitialFacetScoresMap({
					imagination: { score: 16.5, confidence: 85 },
					artistic_interests: { score: 15.2, confidence: 80 },
					emotionality: { score: 14.8, confidence: 78 },
					adventurousness: { score: 17.1, confidence: 88 },
					intellect: { score: 16.9, confidence: 87 },
					liberalism: { score: 15.5, confidence: 82 },
					// Add a few more for other traits
					altruism: { score: 18.2, confidence: 90 },
					cooperation: { score: 17.5, confidence: 85 },
				});
			}),

		deriveTraitScores: (facetScores: FacetScoresMap) =>
			Effect.sync(() => {
				// Calculate trait scores from facet scores (same algorithm as production)
				const traitScores: TraitScoresMap = createInitialTraitScoresMap();

				for (const [traitName, facetNames] of Object.entries(TRAIT_TO_FACETS)) {
					const facetsForTrait = facetNames.map((fn) => facetScores[fn]);

					// Mean of facet scores
					const scores = facetsForTrait.map((f) => f.score);
					const traitScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

					// Minimum confidence
					const confidences = facetsForTrait.map((f) => f.confidence);
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
 * Creates a test Layer for OrchestratorRepository.
 *
 * Provides a mock orchestrator for testing without LangGraph or LLM calls.
 * Implements deterministic routing logic matching production behavior:
 * - Routes to Nerin on every message
 * - Triggers Analyzer + Scorer on batch messages (every 3rd)
 * - Calculates steering target via outlier detection
 * - Throws BudgetPausedError when daily limit exceeded
 */
export const createTestOrchestratorLayer = () => {
	const DAILY_COST_LIMIT = 75; // dollars
	const MESSAGE_COST_ESTIMATE = 0.0043; // per message

	/**
	 * Calculate steering target using outlier detection.
	 * Returns the facet with lowest confidence that is more than 1 stddev below mean.
	 * Returns null if no outliers exist (tightly clustered or no data).
	 *
	 * Note: This matches production logic in orchestrator.nodes.ts exactly.
	 */
	const getSteeringTarget = (
		facetScores: Record<string, FacetScore> | undefined,
	): FacetName | null => {
		if (!facetScores) return null;

		// Filter to facets with confidence > 0 (actually assessed) - matches production logic
		const assessed = Object.entries(facetScores).filter(
			([_, score]) => score !== undefined && score.confidence > 0,
		);

		if (assessed.length === 0) return null;

		const confidences = assessed.map(([_, s]) => s.confidence);
		const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
		const variance = confidences.reduce((acc, c) => acc + (c - mean) ** 2, 0) / confidences.length;
		const stddev = Math.sqrt(variance);

		// If stddev is very small (tightly clustered), there are no outliers
		// Threshold is 0.1 for 0-100 integer scale
		if (stddev < 0.1) return null;

		const threshold = mean - stddev;

		// Find outliers (confidence below threshold)
		const outliers = assessed
			.filter(([_, s]) => s.confidence < threshold)
			.sort((a, b) => a[1].confidence - b[1].confidence);

		const weakestOutlier = outliers[0];
		return weakestOutlier ? (weakestOutlier[0] as FacetName) : null;
	};

	/**
	 * Facet steering hints mapping (subset for testing).
	 */
	const FACET_STEERING_HINTS: Partial<Record<FacetName, string>> = {
		imagination: "Ask about daydreaming, creative scenarios, or 'what if' thinking",
		artistic_interests: "Explore appreciation for art, music, literature, or beauty",
		orderliness: "Explore how they organize their space, time, or belongings",
		altruism: "Discuss helping others, volunteering, or selfless acts",
		trust: "Ask about trusting others or giving people benefit of the doubt",
		intellect: "Explore curiosity about ideas, philosophy, or abstract concepts",
	};

	/**
	 * Get next day midnight UTC for resume timestamp.
	 */
	const getNextDayMidnightUTC = (): Date => {
		const tomorrow = new Date();
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
		tomorrow.setUTCHours(0, 0, 0, 0);
		return tomorrow;
	};

	return Layer.succeed(OrchestratorRepository, {
		processMessage: (input: ProcessMessageInput) =>
			Effect.gen(function* () {
				const { sessionId, messageCount, dailyCostUsed, facetScores } = input;

				// 1. BUDGET CHECK - throw BudgetPausedError if limit would be exceeded
				// Use > (not >=) so messages are allowed up to exactly $75.00
				if (dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
					const overallConfidence = facetScores ? calculateConfidenceFromFacetScores(facetScores) : 50;
					yield* Effect.fail(
						new BudgetPausedError(
							sessionId,
							"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
							getNextDayMidnightUTC(),
							overallConfidence,
						),
					);
					// This won't be reached due to Effect.fail, but TypeScript needs it
					throw new Error("Unreachable");
				}

				// 2. STEERING CALCULATION
				const steeringTarget = getSteeringTarget(facetScores);
				const steeringHint = steeringTarget ? FACET_STEERING_HINTS[steeringTarget] : undefined;

				// 3. ALWAYS route to Nerin
				const nerinResponse = `Mock Nerin response for session ${sessionId}`;
				const tokenUsage = { input: 100, output: 50, total: 150 };
				const costIncurred = MESSAGE_COST_ESTIMATE;

				// 4. BATCH PROCESSING (every 3rd message)
				const isBatchMessage = messageCount % 3 === 0;

				if (isBatchMessage) {
					// Return with scoring data
					const mockFacetScores: FacetScoresMap = createInitialFacetScoresMap({
						imagination: { score: 16.5, confidence: 85 },
						orderliness: { score: 15.2, confidence: 80 },
						altruism: { score: 17.0, confidence: 87 },
					});

					const mockTraitScores: TraitScoresMap = createInitialTraitScoresMap({
						openness: { score: 15.8, confidence: 82 },
						conscientiousness: { score: 14.5, confidence: 78 },
						agreeableness: { score: 16.2, confidence: 85 },
					});

					const mockFacetEvidence: FacetEvidence[] = [
						{
							assessmentMessageId: "mock-msg-id",
							facetName: "imagination",
							score: 16,
							confidence: 85,
							quote: "mock quote",
							highlightRange: { start: 0, end: 10 },
						},
					];

					return {
						nerinResponse,
						tokenUsage,
						costIncurred,
						facetEvidence: mockFacetEvidence,
						facetScores: mockFacetScores,
						traitScores: mockTraitScores,
						steeringTarget: steeringTarget ?? undefined,
						steeringHint: steeringHint ?? undefined,
					};
				}

				// Non-batch message - no scoring data
				return {
					nerinResponse,
					tokenUsage,
					costIncurred,
					steeringTarget: steeringTarget ?? undefined,
					steeringHint: steeringHint ?? undefined,
				};
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
	createTestAppConfigLayer(),
	createTestCostGuardLayer(),
	createTestRedisLayer(),
	createTestNerinAgentLayer(),
	createTestAnalyzerLayer(),
	createTestScorerLayer(),
	createTestFacetEvidenceLayer(),
	createTestOrchestratorLayer(),
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
// biome-ignore lint/suspicious/noExplicitAny: generic R parameter accepts any requirements
export const provideTestLayer = <A, E>(effect: Effect.Effect<A, E, any>) =>
	Effect.provide(effect, TestRepositoriesLayer);
