import { AnalyzerError, InvalidFacetNameError, MalformedEvidenceError } from "@workspace/contracts";
import { Context, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ALL_FACETS } from "../../constants/big-five";
import type { FacetEvidence } from "../../types/facet-evidence";
import { AnalyzerRepository } from "../analyzer.repository";

/**
 * Test implementation of AnalyzerRepository for interface contract validation
 *
 * This creates a minimal mock that satisfies the interface contract.
 * Real test implementations will be created in infrastructure layer.
 */
const createMockAnalyzerRepository = (): Context.Tag.Service<typeof AnalyzerRepository> => ({
	analyzeFacets: (assessmentMessageId: string, content: string) =>
		Effect.succeed([
			{
				assessmentMessageId,
				facetName: "imagination",
				score: 15,
				confidence: 0.8,
				quote: content.substring(0, 20),
				highlightRange: { start: 0, end: 20 },
			},
		] as FacetEvidence[]),
});

describe("AnalyzerRepository Interface", () => {
	it("should be a Context.Tag", () => {
		expect(AnalyzerRepository).toBeDefined();
		expect(AnalyzerRepository.key).toBe("AnalyzerRepository");
	});

	it("should have analyzeFacets method in service interface", () => {
		const mockService = createMockAnalyzerRepository();
		expect(mockService.analyzeFacets).toBeDefined();
		expect(typeof mockService.analyzeFacets).toBe("function");
	});

	it("should return Effect with FacetEvidence array", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});

	it("should return FacetEvidence with correct structure", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));
		const evidence = result[0];

		// Verify structure
		expect(evidence).toHaveProperty("messageId");
		expect(evidence).toHaveProperty("facetName");
		expect(evidence).toHaveProperty("score");
		expect(evidence).toHaveProperty("confidence");
		expect(evidence).toHaveProperty("quote");
		expect(evidence).toHaveProperty("highlightRange");

		// Verify types
		expect(typeof evidence?.assessmentMessageId).toBe("string");
		expect(typeof evidence?.facetName).toBe("string");
		expect(typeof evidence?.score).toBe("number");
		expect(typeof evidence?.confidence).toBe("number");
		expect(typeof evidence?.quote).toBe("string");
		expect(typeof evidence?.highlightRange).toBe("object");
	});

	it("should return evidence with assessmentMessageId matching input", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_test_123", "I enjoy helping others");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		result.forEach((evidence) => {
			expect(evidence?.assessmentMessageId).toBe("msg_test_123");
		});
	});

	it("should return evidence with valid facet names", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		result.forEach((evidence) => {
			expect(ALL_FACETS).toContain(evidence.facetName);
		});
	});

	it("should return evidence with score in 0-20 range", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		result.forEach((evidence) => {
			expect(evidence.score).toBeGreaterThanOrEqual(0);
			expect(evidence.score).toBeLessThanOrEqual(20);
		});
	});

	it("should return evidence with confidence in 0-1 range", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		result.forEach((evidence) => {
			expect(evidence.confidence).toBeGreaterThanOrEqual(0);
			expect(evidence.confidence).toBeLessThanOrEqual(1);
		});
	});

	it("should return evidence with valid highlightRange", async () => {
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			const result = yield* analyzer.analyzeFacets("msg_123", "I love exploring new ideas");
			return result;
		});

		const result = await Effect.runPromise(program.pipe(Effect.provide(mockLayer)));

		result.forEach((evidence) => {
			expect(evidence.highlightRange).toHaveProperty("start");
			expect(evidence.highlightRange).toHaveProperty("end");
			expect(typeof evidence.highlightRange.start).toBe("number");
			expect(typeof evidence.highlightRange.end).toBe("number");
			expect(evidence.highlightRange.start).toBeGreaterThanOrEqual(0);
			expect(evidence.highlightRange.end).toBeGreaterThan(evidence.highlightRange.start);
		});
	});

	it("should have error types in return signature", () => {
		// This test verifies the type signature includes proper error types
		// TypeScript will catch if error types are missing from Effect signature
		const mockService = createMockAnalyzerRepository();
		const mockLayer = Context.make(AnalyzerRepository, mockService);

		const program = Effect.gen(function* () {
			const analyzer = yield* AnalyzerRepository;
			// This should type-check correctly with proper error types
			const result = yield* analyzer.analyzeFacets("msg_123", "test");
			return result;
		});

		// Verify we can catch specific error types
		const withErrorHandling = program.pipe(
			Effect.catchTags({
				AnalyzerError: (_e: AnalyzerError) => Effect.succeed([]),
				MalformedEvidenceError: (_e: MalformedEvidenceError) => Effect.succeed([]),
			}),
			Effect.provide(mockLayer),
		);

		expect(withErrorHandling).toBeDefined();
	});
});

describe("AnalyzerError", () => {
	it("should be instantiable with required fields", () => {
		const error = new AnalyzerError({
			assessmentMessageId: "msg_123",
			message: "Failed to analyze message",
		});

		expect(error._tag).toBe("AnalyzerError");
		expect(error.assessmentMessageId).toBe("msg_123");
		expect(error.message).toBe("Failed to analyze message");
	});

	it("should accept optional cause field", () => {
		const error = new AnalyzerError({
			assessmentMessageId: "msg_123",
			message: "Failed to analyze message",
			cause: "API timeout",
		});

		expect(error.cause).toBe("API timeout");
	});
});

describe("InvalidFacetNameError", () => {
	it("should be instantiable with required fields", () => {
		const error = new InvalidFacetNameError({
			facetName: "invalid_facet",
			validFacets: ALL_FACETS,
			message: "Invalid facet name",
		});

		expect(error._tag).toBe("InvalidFacetNameError");
		expect(error.facetName).toBe("invalid_facet");
		expect(error.validFacets).toEqual(ALL_FACETS);
		expect(error.message).toBe("Invalid facet name");
	});
});

describe("MalformedEvidenceError", () => {
	it("should be instantiable with required fields", () => {
		const error = new MalformedEvidenceError({
			assessmentMessageId: "msg_123",
			rawOutput: '{"invalid": json}',
			parseError: "Unexpected token",
			message: "Failed to parse evidence",
		});

		expect(error._tag).toBe("MalformedEvidenceError");
		expect(error.assessmentMessageId).toBe("msg_123");
		expect(error.rawOutput).toBe('{"invalid": json}');
		expect(error.parseError).toBe("Unexpected token");
		expect(error.message).toBe("Failed to parse evidence");
	});
});
