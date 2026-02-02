import { Context, Effect } from "effect";
import { describe, expect, it } from "vitest";
import type { FacetScoresMap, TraitScoresMap } from "../../types/facet-evidence";
import { InsufficientEvidenceError, ScorerError, ScorerRepository } from "../scorer.repository";

/**
 * Test implementation of ScorerRepository for interface contract validation
 *
 * This creates a minimal mock that satisfies the interface contract.
 * Real test implementations will be created in infrastructure layer.
 */
const createMockScorerRepository = (): Context.Tag.Service<typeof ScorerRepository> => ({
	aggregateFacetScores: (_sessionId: string) =>
		Effect.succeed({
			imagination: {
				score: 16,
				confidence: 0.85,
			},
			altruism: {
				score: 18,
				confidence: 0.9,
			},
		} as FacetScoresMap),

	deriveTraitScores: (_facetScores: FacetScoresMap) =>
		Effect.succeed({
			openness: {
				score: 15.5,
				confidence: 0.8,
			},
			agreeableness: {
				score: 17.2,
				confidence: 0.85,
			},
		} as TraitScoresMap),
});

describe("ScorerRepository Interface", () => {
	it("should be a Context.Tag", () => {
		expect(ScorerRepository).toBeDefined();
		expect(ScorerRepository.key).toBe("ScorerRepository");
	});

	it("should have aggregateFacetScores method in service interface", () => {
		const mockService = createMockScorerRepository();
		expect(mockService.aggregateFacetScores).toBeDefined();
		expect(typeof mockService.aggregateFacetScores).toBe("function");
	});

	it("should have deriveTraitScores method in service interface", () => {
		const mockService = createMockScorerRepository();
		expect(mockService.deriveTraitScores).toBeDefined();
		expect(typeof mockService.deriveTraitScores).toBe("function");
	});

	it("should return Effect with FacetScoresMap from aggregateFacetScores", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const result = yield* scorer.aggregateFacetScores("session_123");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		expect(typeof result).toBe("object");
		expect(result).toBeDefined();
	});

	it("should return facet scores with correct structure", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const result = yield* scorer.aggregateFacetScores("session_123");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		// Check first facet score structure
		const firstFacet = Object.values(result)[0];
		expect(firstFacet).toHaveProperty("score");
		expect(firstFacet).toHaveProperty("confidence");

		// Verify types
		expect(typeof firstFacet.score).toBe("number");
		expect(typeof firstFacet.confidence).toBe("number");
	});

	it("should return facet scores with score in 0-20 range", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const result = yield* scorer.aggregateFacetScores("session_123");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		Object.values(result).forEach((facetScore) => {
			expect(facetScore.score).toBeGreaterThanOrEqual(0);
			expect(facetScore.score).toBeLessThanOrEqual(20);
		});
	});

	it("should return facet scores with confidence in 0-1 range", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const result = yield* scorer.aggregateFacetScores("session_123");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		Object.values(result).forEach((facetScore) => {
			expect(facetScore.confidence).toBeGreaterThanOrEqual(0);
			expect(facetScore.confidence).toBeLessThanOrEqual(1);
		});
	});

	it("should return Effect with TraitScoresMap from deriveTraitScores", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const facetScores = yield* scorer.aggregateFacetScores("session_123");
			const result = yield* scorer.deriveTraitScores(facetScores);
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		expect(typeof result).toBe("object");
		expect(result).toBeDefined();
	});

	it("should return trait scores with correct structure", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const facetScores = yield* scorer.aggregateFacetScores("session_123");
			const result = yield* scorer.deriveTraitScores(facetScores);
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		// Check first trait score structure
		const firstTrait = Object.values(result)[0];
		expect(firstTrait).toHaveProperty("score");
		expect(firstTrait).toHaveProperty("confidence");

		// Verify types
		expect(typeof firstTrait.score).toBe("number");
		expect(typeof firstTrait.confidence).toBe("number");
	});

	it("should return trait scores with score in 0-20 range", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const facetScores = yield* scorer.aggregateFacetScores("session_123");
			const result = yield* scorer.deriveTraitScores(facetScores);
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		Object.values(result).forEach((traitScore) => {
			expect(traitScore.score).toBeGreaterThanOrEqual(0);
			expect(traitScore.score).toBeLessThanOrEqual(20);
		});
	});

	it("should return trait scores with confidence in 0-1 range", async () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const facetScores = yield* scorer.aggregateFacetScores("session_123");
			const result = yield* scorer.deriveTraitScores(facetScores);
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		Object.values(result).forEach((traitScore) => {
			expect(traitScore.confidence).toBeGreaterThanOrEqual(0);
			expect(traitScore.confidence).toBeLessThanOrEqual(1);
		});
	});

	it("should have error types in aggregateFacetScores signature", () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const result = yield* scorer.aggregateFacetScores("session_123");
			return result;
		});

		// Verify we can catch specific error types
		const withErrorHandling = program.pipe(
			Effect.catchAll((_error) => Effect.succeed({} as FacetScoresMap)),
			Effect.provide(mockLayer),
		);

		expect(withErrorHandling).toBeDefined();
	});

	it("should have error types in deriveTraitScores signature", () => {
		const mockService = createMockScorerRepository();
		const mockLayer = Context.make(ScorerRepository, mockService);

		const program = Effect.gen(function* () {
			const scorer = yield* ScorerRepository;
			const facetScores = yield* scorer.aggregateFacetScores("session_123");
			const result = yield* scorer.deriveTraitScores(facetScores);
			return result;
		});

		// Verify we can catch specific error types
		const withErrorHandling = program.pipe(
			Effect.catchAll((_error) => Effect.succeed({} as TraitScoresMap)),
			Effect.provide(mockLayer),
		);

		expect(withErrorHandling).toBeDefined();
	});
});

describe("InsufficientEvidenceError", () => {
	it("should be instantiable with required fields", () => {
		const error = new InsufficientEvidenceError(
			"session_123",
			"imagination",
			1,
			"Not enough evidence to compute score",
		);

		expect(error._tag).toBe("InsufficientEvidenceError");
		expect(error.sessionId).toBe("session_123");
		expect(error.facetName).toBe("imagination");
		expect(error.sampleSize).toBe(1);
		expect(error.message).toBe("Not enough evidence to compute score");
	});

	it("should be an Error instance", () => {
		const error = new InsufficientEvidenceError("session_123", "imagination", 0, "No evidence");

		expect(error instanceof Error).toBe(true);
		expect(error.name).toBe("InsufficientEvidenceError");
	});
});

describe("ScorerError", () => {
	it("should be instantiable with required fields", () => {
		const error = new ScorerError("session_123", "Failed to aggregate scores");

		expect(error._tag).toBe("ScorerError");
		expect(error.sessionId).toBe("session_123");
		expect(error.message).toBe("Failed to aggregate scores");
	});

	it("should accept optional cause field", () => {
		const error = new ScorerError(
			"session_123",
			"Failed to aggregate scores",
			"Database query timeout",
		);

		expect(error.cause).toBe("Database query timeout");
	});

	it("should be an Error instance", () => {
		const error = new ScorerError("session_123", "Scorer failed");

		expect(error instanceof Error).toBe(true);
		expect(error.name).toBe("ScorerError");
	});
});
