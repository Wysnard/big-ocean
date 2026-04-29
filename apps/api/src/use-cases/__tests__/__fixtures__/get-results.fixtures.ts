/**
 * Shared fixtures for get-results use-case tests.
 *
 * Extracted from get-results.use-case.test.ts — no logic changes.
 */

import {
	ALL_FACETS,
	AppConfig,
	AssessmentResultRepository,
	type BigFiveTrait,
	ConversationRepository,
	FacetEvidenceRepository,
	type FacetName,
	LoggerRepository,
	MessageRepository,
	PublicProfileRepository,
	type SavedFacetEvidence,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { vi } from "vitest";

// ============================================
// Mock Data
// ============================================

export const TEST_SESSION_ID = "session_test_results_123";

/**
 * Trait-to-facets mapping for helper functions
 */
export const TRAIT_FACETS: Record<BigFiveTrait, FacetName[]> = {
	openness: [
		"imagination",
		"artistic_interests",
		"emotionality",
		"adventurousness",
		"intellect",
		"liberalism",
	],
	conscientiousness: [
		"self_efficacy",
		"orderliness",
		"dutifulness",
		"achievement_striving",
		"self_discipline",
		"cautiousness",
	],
	extraversion: [
		"friendliness",
		"gregariousness",
		"assertiveness",
		"activity_level",
		"excitement_seeking",
		"cheerfulness",
	],
	agreeableness: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
	neuroticism: [
		"anxiety",
		"anger",
		"depression",
		"self_consciousness",
		"immoderation",
		"vulnerability",
	],
};

/**
 * Create a SavedFacetEvidence record for a single facet.
 */
export function createEvidenceRecord(
	facetName: FacetName,
	score: number,
	confidence: number,
	messageIndex = 0,
): SavedFacetEvidence {
	return {
		id: `evidence_${facetName}_${messageIndex}`,
		assessmentMessageId: `msg_${messageIndex}`,
		facetName,
		score,
		confidence,
		quote: `Test quote for ${facetName}`,
		highlightRange: { start: 0, end: 20 },
		domain: "other",
		deviation: 0,
		createdAt: new Date(Date.now() + messageIndex * 1000),
	};
}

/**
 * Create evidence records that will produce uniform facet scores per trait.
 */
export function createEvidenceForUniformScores(
	traitScores: Record<BigFiveTrait, { facetScore: number; confidence: number }>,
): SavedFacetEvidence[] {
	const evidence: SavedFacetEvidence[] = [];
	let messageIndex = 0;

	for (const [trait, config] of Object.entries(traitScores)) {
		const facets = TRAIT_FACETS[trait as BigFiveTrait];
		for (const facet of facets) {
			evidence.push(createEvidenceRecord(facet, config.facetScore, config.confidence, messageIndex));
			messageIndex++;
		}
	}

	return evidence;
}

/**
 * Create evidence for all 30 facets with the same score and confidence.
 */
export function createUniformEvidence(score: number, confidence: number): SavedFacetEvidence[] {
	return ALL_FACETS.map((facet, idx) => createEvidenceRecord(facet, score, confidence, idx));
}

// ============================================
// Mock Repositories
// ============================================

export const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	incrementMessageCount: vi.fn(),
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
};

export const mockEvidenceRepo = {
	saveEvidence: vi.fn(),
	getEvidenceByMessage: vi.fn(),
	getEvidenceByFacet: vi.fn(),
	getEvidenceBySession: vi.fn(),
};

export const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

export const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

export const mockProfileRepo = {
	createProfile: vi.fn(),
	getProfile: vi.fn(),
	getProfileBySessionId: vi.fn(),
	toggleVisibility: vi.fn(),
	incrementViewCount: vi.fn(),
};

export const mockResultRepo = {
	create: vi.fn(),
	getBySessionId: vi.fn(),
	update: vi.fn(),
	upsert: vi.fn(),
	updateStage: vi.fn(),
	getLatestByUserId: vi.fn(),
};

export const mockConfig = {
	databaseUrl: "postgres://test",
	redisUrl: "redis://test",
	anthropicApiKey: Redacted.make("test-key"),
	betterAuthSecret: Redacted.make("test-secret"),
	betterAuthUrl: "http://localhost:4000",
	frontendUrl: "http://localhost:3000",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "claude-sonnet-4-20250514",
	analyzerMaxTokens: 4096,
	analyzerTemperature: 0.2,
	nerinModelId: "claude-sonnet-4-20250514",
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	dailyCostLimit: 75,
	assessmentTurnCount: 12,
	shareMinConfidence: 30,
	portraitModelId: "claude-sonnet-4-20250514",
	portraitMaxTokens: 4096,
	portraitTemperature: 0.5,
	portraitWaitMinMs: 2000,
	conversanalyzerModelId: "claude-haiku-4-5-20251001",
	portraitGeneratorModelId: "claude-sonnet-4-20250514",
	messageRateLimit: 2,
	polarAccessToken: Redacted.make("test-polar-access-token"),
	polarWebhookSecret: Redacted.make("test-polar-webhook-secret"),
	polarProductPortraitUnlock: "polar_product_portrait",
	polarProductRelationshipSingle: "polar_product_single",
	polarProductRelationship5Pack: "polar_product_5pack",
	polarProductExtendedConversation: "polar_product_extended",
};

// ============================================
// Test Layer
// ============================================

export function createTestLayer() {
	return Layer.mergeAll(
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(FacetEvidenceRepository, mockEvidenceRepo),
		Layer.succeed(MessageRepository, mockMessageRepo),
		Layer.succeed(PublicProfileRepository, mockProfileRepo),
		Layer.succeed(AssessmentResultRepository, mockResultRepo),
		Layer.succeed(AppConfig, mockConfig),
		Layer.succeed(LoggerRepository, mockLogger),
	);
}

/**
 * Build an AssessmentResultRecord from uniform per-trait facet scores.
 * Each facet in a trait gets the same score and confidence.
 */
export function buildResultFromEvidence(
	traitScores: Record<BigFiveTrait, { facetScore: number; confidence: number }>,
) {
	const facets: Record<string, { score: number; confidence: number }> = {};
	const traits: Record<string, { score: number; confidence: number }> = {};

	for (const [trait, config] of Object.entries(traitScores)) {
		const traitFacets = TRAIT_FACETS[trait as BigFiveTrait];
		let traitTotal = 0;
		for (const facet of traitFacets) {
			facets[facet] = { score: config.facetScore, confidence: config.confidence };
			traitTotal += config.facetScore;
		}
		traits[trait] = { score: traitTotal, confidence: config.confidence };
	}

	return {
		id: `ar-${TEST_SESSION_ID}`,
		assessmentSessionId: TEST_SESSION_ID,
		facets,
		traits,
		domainCoverage: {},
		portrait: "",
		createdAt: new Date(),
	};
}

/** Default result with all facets at score 10, confidence 0 (matches "no evidence" default OCEAN code GBANT) */
const DEFAULT_RESULT = (() => {
	const defaultScores: Record<BigFiveTrait, { facetScore: number; confidence: number }> = {
		openness: { facetScore: 10, confidence: 0 },
		conscientiousness: { facetScore: 10, confidence: 0 },
		extraversion: { facetScore: 10, confidence: 0 },
		agreeableness: { facetScore: 10, confidence: 0 },
		neuroticism: { facetScore: 10, confidence: 0 },
	};
	return buildResultFromEvidence(defaultScores);
})();

/**
 * Set up default mock behaviors. Call in beforeEach().
 */
export function setupDefaultMocks() {
	vi.clearAllMocks();

	mockSessionRepo.getSession.mockImplementation((_sessionId: string) =>
		Effect.succeed({
			id: TEST_SESSION_ID,
			sessionId: TEST_SESSION_ID,
			userId: "owner_user",
			createdAt: new Date(),
			updatedAt: new Date(),
			status: "completed",
			messageCount: 10,
		}),
	);

	mockProfileRepo.getProfileBySessionId.mockImplementation(() =>
		Effect.succeed({
			id: `profile_${TEST_SESSION_ID}`,
			sessionId: TEST_SESSION_ID,
			userId: "owner_user",
			displayName: "Test User",
			isPublic: false,
			viewCount: 0,
			createdAt: new Date(),
		}),
	);
	mockProfileRepo.createProfile.mockImplementation((input: { sessionId: string; userId: string }) =>
		Effect.succeed({
			id: `profile_${input.sessionId}`,
			sessionId: input.sessionId,
			userId: input.userId,
			displayName: "Test User",
			isPublic: false,
			viewCount: 0,
			createdAt: new Date(),
		}),
	);

	mockMessageRepo.getMessages.mockImplementation(() => Effect.succeed([]));

	mockResultRepo.getBySessionId.mockImplementation(() => Effect.succeed(DEFAULT_RESULT));

	// Story 36-3: Default to returning the same result (latest version)
	mockResultRepo.getLatestByUserId.mockImplementation(() => Effect.succeed(DEFAULT_RESULT));

	mockSessionRepo.updateSession.mockImplementation((_id: string, partial: Record<string, unknown>) =>
		Effect.succeed({ id: _id, ...partial }),
	);
}
