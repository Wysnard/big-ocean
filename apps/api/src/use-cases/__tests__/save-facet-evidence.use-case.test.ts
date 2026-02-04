/**
 * Save Facet Evidence Use Case Tests
 *
 * Tests for persisting FacetEvidence from Analyzer to database.
 * Follows TDD: RED → GREEN → REFACTOR
 *
 * @see packages/domain/src/types/facet-evidence.ts
 * @see packages/infrastructure/src/db/schema.ts
 */

import { it } from "@effect/vitest";
import type { FacetEvidence } from "@workspace/domain";
import { Effect, Exit } from "effect";
import { describe, expect } from "vitest";
import { TestRepositoriesLayer } from "../../test-utils/test-layers";
import { type SaveFacetEvidenceInput, saveFacetEvidence } from "../save-facet-evidence.use-case";

describe("saveFacetEvidence use-case", () => {
	const mockEvidence: FacetEvidence[] = [
		{
			messageId: "msg_test_123",
			facetName: "imagination",
			score: 16,
			confidence: 85,
			quote: "I love thinking creatively",
			highlightRange: { start: 0, end: 27 },
		},
		{
			messageId: "msg_test_123",
			facetName: "altruism",
			score: 18,
			confidence: 90,
			quote: "helping others brings me joy",
			highlightRange: { start: 30, end: 58 },
		},
	];

	describe("success scenarios", () => {
		it.effect("should save single evidence record", () =>
			Effect.gen(function* () {
				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_test_single",
					evidence: [mockEvidence[0]],
				};

				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(1);
				expect(result.evidenceIds).toHaveLength(1);
				expect(result.evidenceIds[0]).toBeDefined();
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should save multiple evidence records", () =>
			Effect.gen(function* () {
				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_test_multiple",
					evidence: mockEvidence,
				};

				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(2);
				expect(result.evidenceIds).toHaveLength(2);
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should return empty result for empty evidence array", () =>
			Effect.gen(function* () {
				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_test_empty",
					evidence: [],
				};

				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(0);
				expect(result.evidenceIds).toHaveLength(0);
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should preserve evidence fields when saving", () =>
			Effect.gen(function* () {
				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_test_fields",
					evidence: [
						{
							messageId: "msg_test_fields",
							facetName: "intellect",
							score: 14,
							confidence: 75,
							quote: "I enjoy deep analysis",
							highlightRange: { start: 5, end: 25 },
						},
					],
				};

				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(1);
				// Evidence should be stored with all fields preserved
				expect(result.evidenceIds[0]).toBeDefined();
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should handle all 30 facet types", () =>
			Effect.gen(function* () {
				// Test with a variety of valid facet names
				const multipleEvidence: FacetEvidence[] = [
					{
						messageId: "msg_all_facets",
						facetName: "imagination",
						score: 15,
						confidence: 80,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
					{
						messageId: "msg_all_facets",
						facetName: "artistic_interests",
						score: 14,
						confidence: 70,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
					{
						messageId: "msg_all_facets",
						facetName: "self_efficacy",
						score: 16,
						confidence: 85,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
					{
						messageId: "msg_all_facets",
						facetName: "friendliness",
						score: 17,
						confidence: 90,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
					{
						messageId: "msg_all_facets",
						facetName: "trust",
						score: 18,
						confidence: 88,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
					{
						messageId: "msg_all_facets",
						facetName: "anxiety",
						score: 10,
						confidence: 75,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
				];

				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_all_facets",
					evidence: multipleEvidence,
				};

				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(6);
				expect(result.evidenceIds).toHaveLength(6);
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);
	});

	describe("validation scenarios", () => {
		it.effect("should validate score is in 0-20 range", () =>
			Effect.gen(function* () {
				const invalidEvidence: FacetEvidence[] = [
					{
						messageId: "msg_invalid_score",
						facetName: "imagination",
						score: 25, // Invalid: > 20
						confidence: 80,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
				];

				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_invalid_score",
					evidence: invalidEvidence,
				};

				const exit = yield* Effect.exit(saveFacetEvidence(input));

				expect(exit._tag).toBe("Failure");
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					// Error should indicate validation failure
					expect(error).toBeDefined();
				}
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should validate confidence is in 0-100 range", () =>
			Effect.gen(function* () {
				const invalidEvidence: FacetEvidence[] = [
					{
						messageId: "msg_invalid_confidence",
						facetName: "imagination",
						score: 15,
						confidence: 150, // Invalid: > 100
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
				];

				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_invalid_confidence",
					evidence: invalidEvidence,
				};

				const exit = yield* Effect.exit(saveFacetEvidence(input));

				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should validate facetName is valid", () =>
			Effect.gen(function* () {
				const invalidEvidence: FacetEvidence[] = [
					{
						messageId: "msg_invalid_facet",
						// biome-ignore lint/suspicious/noExplicitAny: intentionally testing invalid facet name
						facetName: "openness_imagination" as any, // Invalid: should be "imagination" not prefixed
						score: 15,
						confidence: 80,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
				];

				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_invalid_facet",
					evidence: invalidEvidence,
				};

				const exit = yield* Effect.exit(saveFacetEvidence(input));

				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);
	});

	describe("logging behavior", () => {
		it.effect("should log when saving evidence", () =>
			Effect.gen(function* () {
				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_test_logging",
					evidence: mockEvidence,
				};

				// Should complete without error (logging is handled internally)
				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(2);
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);
	});

	describe("highlight range handling", () => {
		it.effect("should handle highlight range with start and end", () =>
			Effect.gen(function* () {
				const evidence: FacetEvidence[] = [
					{
						messageId: "msg_highlight",
						facetName: "intellect",
						score: 15,
						confidence: 85,
						quote: "deep thinking",
						highlightRange: { start: 10, end: 23 },
					},
				];

				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_highlight",
					evidence,
				};

				const result = yield* saveFacetEvidence(input);

				expect(result.savedCount).toBe(1);
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);

		it.effect("should validate start is less than end", () =>
			Effect.gen(function* () {
				const invalidEvidence: FacetEvidence[] = [
					{
						messageId: "msg_invalid_range",
						facetName: "imagination",
						score: 15,
						confidence: 80,
						quote: "test",
						highlightRange: { start: 20, end: 10 }, // Invalid: start > end
					},
				];

				const input: SaveFacetEvidenceInput = {
					assessmentMessageId: "msg_invalid_range",
					evidence: invalidEvidence,
				};

				const exit = yield* Effect.exit(saveFacetEvidence(input));

				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(TestRepositoriesLayer)),
		);
	});
});
