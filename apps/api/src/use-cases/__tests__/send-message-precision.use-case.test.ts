/**
 * Send Message Use Case - Precision Calculation Tests
 *
 * Tests for facet-based precision scoring in message handling.
 * Validates:
 * - Facet precision updates based on message content
 * - Trait precision aggregation from facets
 * - Precision score refinement over conversation
 */

import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	calculateTraitPrecision,
	type FacetPrecisionScores,
	initializeFacetPrecision,
	LoggerRepository,
	mergePrecisionScores,
	NerinAgentRepository,
	updateFacetPrecision,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
// @biome-ignore lint/style/useImportType: vitest imports needed at runtime
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "../send-message.use-case";

describe("Send Message Use Case - Precision Scoring", () => {
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockSessionRepo: any;
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockMessageRepo: any;
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockLogger: any;
	// @biome-ignore lint/suspicious/noExplicitAny: vitest mocks require flexible types
	let mockNerinAgent: any;

	beforeEach(() => {
		const basePrecision = {
			openness: 0.5,
			conscientiousness: 0.5,
			extraversion: 0.5,
			agreeableness: 0.5,
			neuroticism: 0.5,
		};

		const mockSession = {
			sessionId: "session_test_precision",
			userId: "user_456",
			createdAt: new Date("2026-02-01"),
			precision: basePrecision,
		};

		const mockMessages = [
			{
				id: "msg_1",
				sessionId: "session_test_precision",
				role: "user",
				content: "Tell me about yourself",
				createdAt: new Date(),
			},
			{
				id: "msg_2",
				sessionId: "session_test_precision",
				role: "assistant",
				content: "Hi! I'm Nerin, nice to meet you.",
				createdAt: new Date(),
			},
		];

		const mockNerinResponse = {
			response: "I help you explore your personality through conversation.",
			tokenCount: {
				input: 150,
				output: 80,
				total: 230,
			},
		};

		mockSessionRepo = {
			getSession: vi.fn().mockReturnValue(Effect.succeed(mockSession)),
			updateSession: vi.fn().mockReturnValue(Effect.succeed(mockSession)),
			createSession: vi.fn(),
			resumeSession: vi.fn(),
		};

		mockMessageRepo = {
			saveMessage: vi.fn().mockReturnValue(Effect.succeed(undefined)),
			getMessages: vi.fn().mockReturnValue(Effect.succeed(mockMessages)),
		};

		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		};

		mockNerinAgent = {
			invoke: vi.fn().mockReturnValue(Effect.succeed(mockNerinResponse)),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Facet precision calculation", () => {
		it("should initialize facet precision with baseline", () => {
			const facetPrecision = initializeFacetPrecision(0.5);

			// Should have 30 facets (6 per trait)
			expect(Object.keys(facetPrecision).length).toBe(30);

			// All should be 0.5
			Object.values(facetPrecision).forEach((value) => {
				expect(value).toBe(0.5);
			});
		});

		it("should update individual facet precision", () => {
			const facetPrecision = initializeFacetPrecision(0.5);

			// Update imagination facet (under Openness)
			const updated = updateFacetPrecision(facetPrecision, "imagination", 0.8);

			expect(updated.imagination).toBe(0.8);
			// Other facets unchanged
			expect(updated.artistic_interests).toBe(0.5);
			expect(updated.anxiety).toBe(0.5);
		});

		it("should calculate trait precision from facet precision", () => {
			const facetPrecision: FacetPrecisionScores = {
				// Openness facets high
				imagination: 0.8,
				artistic_interests: 0.8,
				emotionality: 0.8,
				adventurousness: 0.8,
				intellect: 0.8,
				liberalism: 0.8,
				// Conscientiousness facets low
				self_efficacy: 0.2,
				orderliness: 0.2,
				dutifulness: 0.2,
				achievement_striving: 0.2,
				self_discipline: 0.2,
				cautiousness: 0.2,
				// Extraversion facets neutral
				friendliness: 0.5,
				gregariousness: 0.5,
				assertiveness: 0.5,
				activity_level: 0.5,
				excitement_seeking: 0.5,
				cheerfulness: 0.5,
				// Agreeableness facets neutral
				trust: 0.5,
				morality: 0.5,
				altruism: 0.5,
				cooperation: 0.5,
				modesty: 0.5,
				sympathy: 0.5,
				// Neuroticism facets neutral
				anxiety: 0.5,
				anger: 0.5,
				depressiveness: 0.5,
				self_consciousness: 0.5,
				immoderation: 0.5,
				vulnerability: 0.5,
			};

			const traitPrecision = calculateTraitPrecision(facetPrecision);

			expect(traitPrecision.openness).toBeCloseTo(0.8, 5);
			expect(traitPrecision.conscientiousness).toBeCloseTo(0.2, 5);
			expect(traitPrecision.extraversion).toBeCloseTo(0.5, 5);
			expect(traitPrecision.agreeableness).toBeCloseTo(0.5, 5);
			expect(traitPrecision.neuroticism).toBeCloseTo(0.5, 5);
		});

		it("should handle partial facet updates when merging scores", () => {
			const current = initializeFacetPrecision(0.4);
			const update: Partial<FacetPrecisionScores> = {
				imagination: 0.8,
				artistic_interests: 0.7,
				friendliness: 0.6,
			};

			// Merge with 50/50 weight
			const merged = mergePrecisionScores(current, update, 0.5);

			// (0.4 * 0.5) + (0.8 * 0.5) = 0.6
			expect(merged.imagination).toBeCloseTo(0.6, 5);
			// (0.4 * 0.5) + (0.7 * 0.5) = 0.55
			expect(merged.artistic_interests).toBeCloseTo(0.55, 5);
			// (0.4 * 0.5) + (0.6 * 0.5) = 0.5
			expect(merged.friendliness).toBeCloseTo(0.5, 5);
			// Other facets unchanged
			expect(merged.anxiety).toBe(0.4);
		});
	});

	describe("Integration with message flow", () => {
		it("should update session precision after message processing", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_precision",
				message: "Tell me something interesting",
			};

			await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Verify session was updated with precision scores
			expect(mockSessionRepo.updateSession).toHaveBeenCalledWith(
				"session_test_precision",
				expect.objectContaining({
					precision: expect.any(Object),
				}),
			);
		});

		it("should include precision scores in response", async () => {
			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_precision",
				message: "What defines your approach?",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// Should return precision scores
			expect(result.precision).toBeDefined();
			expect(result.precision).toHaveProperty("openness");
			expect(result.precision).toHaveProperty("conscientiousness");
			expect(result.precision).toHaveProperty("extraversion");
			expect(result.precision).toHaveProperty("agreeableness");
			expect(result.precision).toHaveProperty("neuroticism");

			// All should be valid numbers between 0 and 1
			Object.values(result.precision as Record<string, number>).forEach((value) => {
				expect(typeof value).toBe("number");
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(1);
			});
		});

		it("should maintain precision bounds [0, 1]", async () => {
			// Create session with initial precision
			const sessionWithPrecision = {
				sessionId: "session_test_precision",
				userId: "user_456",
				createdAt: new Date("2026-02-01"),
				precision: {
					openness: 0.95,
					conscientiousness: 0.05,
					extraversion: 0.5,
					agreeableness: 1.0,
					neuroticism: 0.0,
				},
			};

			mockSessionRepo.getSession.mockReturnValue(Effect.succeed(sessionWithPrecision));

			const testLayer = Layer.mergeAll(
				Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
				Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
				Layer.succeed(LoggerRepository, mockLogger),
				Layer.succeed(NerinAgentRepository, mockNerinAgent),
			);

			const input = {
				sessionId: "session_test_precision",
				message: "Test message",
			};

			const result = await Effect.runPromise(sendMessage(input).pipe(Effect.provide(testLayer)));

			// All precision scores should remain in valid bounds
			Object.values(result.precision as Record<string, number>).forEach((value) => {
				expect(value).toBeGreaterThanOrEqual(0);
				expect(value).toBeLessThanOrEqual(1);
			});
		});
	});

	describe("Precision aggregation workflow", () => {
		it("should aggregate facet updates to trait level", () => {
			// Scenario: User messages reveal patterns
			let facetPrecision = initializeFacetPrecision(0.5);

			// First round of updates - user shows creativity
			facetPrecision = updateFacetPrecision(facetPrecision, "imagination", 0.8);
			facetPrecision = updateFacetPrecision(facetPrecision, "artistic_interests", 0.75);

			let traitPrecision = calculateTraitPrecision(facetPrecision);
			// Openness should be higher than other traits
			expect(traitPrecision.openness).toBeGreaterThan(0.5);

			// Second round - user shows more facets of openness
			facetPrecision = updateFacetPrecision(facetPrecision, "emotionality", 0.7);
			facetPrecision = updateFacetPrecision(facetPrecision, "adventurousness", 0.75);

			traitPrecision = calculateTraitPrecision(facetPrecision);
			// Openness confidence should increase (more facets updated)
			expect(traitPrecision.openness).toBeGreaterThan(0.65);
		});

		it("should refine precision through conversation iterations", () => {
			// Initial state: neutral on all traits
			const initialFacets = initializeFacetPrecision(0.5);
			const initialTraits = calculateTraitPrecision(initialFacets);

			// After first message: user is thoughtful (high conscientiousness facets)
			let updatedFacets = initializeFacetPrecision(0.5);
			updatedFacets = updateFacetPrecision(updatedFacets, "self_discipline", 0.75);
			updatedFacets = updateFacetPrecision(updatedFacets, "orderliness", 0.7);

			let traits = calculateTraitPrecision(updatedFacets);
			expect(traits.conscientiousness).toBeGreaterThan(initialTraits.conscientiousness);

			// After second message: also shows high agreeableness
			updatedFacets = updateFacetPrecision(updatedFacets, "sympathy", 0.8);
			updatedFacets = updateFacetPrecision(updatedFacets, "altruism", 0.75);

			traits = calculateTraitPrecision(updatedFacets);
			expect(traits.agreeableness).toBeGreaterThan(initialTraits.agreeableness);
		});

		it("should handle conflicting signals across facets", () => {
			// Some extraversion facets high, others low
			const facetPrecision = initializeFacetPrecision(0.5);

			// High gregariousness but low assertiveness
			const updated = updateFacetPrecision(facetPrecision, "gregariousness", 0.8);
			const final = updateFacetPrecision(updated, "assertiveness", 0.3);

			const traitPrecision = calculateTraitPrecision(final);
			// Extraversion should be moderate (averaging 0.8 and 0.3)
			expect(traitPrecision.extraversion).toBeGreaterThan(0.4);
			expect(traitPrecision.extraversion).toBeLessThan(0.7);
		});
	});
});
