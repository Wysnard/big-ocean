import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import type { FacetScoresMap, LoggerRepository } from "@workspace/domain";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { Effect, Layer } from "effect";
import { calculateConfidenceFromFacets } from "../calculate-confidence.use-case";

const TestLayer = Layer.mergeAll(LoggerPinoRepositoryLive) as Layer.Layer<LoggerRepository>;

describe("calculateConfidenceFromFacets", () => {
	it.effect("returns zero confidence for empty facets", () =>
		Effect.gen(function* () {
			const result = yield* calculateConfidenceFromFacets({
				facetScores: {} as FacetScoresMap,
			});

			expect(result.confidence).toBe(0);
			expect(result.facetCount).toBe(0);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns confidence equal to input for single facet", () =>
		Effect.gen(function* () {
			const result = yield* calculateConfidenceFromFacets({
				facetScores: {
					imagination: { score: 16, confidence: 85 },
				} as unknown as FacetScoresMap,
			});

			expect(result.confidence).toBe(85);
			expect(result.facetCount).toBe(1);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("calculates correct mean rounded to 2 decimals", () =>
		Effect.gen(function* () {
			const result = yield* calculateConfidenceFromFacets({
				facetScores: {
					imagination: { score: 16, confidence: 85 },
					altruism: { score: 18, confidence: 90 },
					self_discipline: { score: 14, confidence: 70 },
				} as unknown as FacetScoresMap,
			});

			// (85 + 90 + 70) / 3 = 81.666... → 81.67
			expect(result.confidence).toBe(81.67);
			expect(result.facetCount).toBe(3);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("handles boundary values 0 and 100", () =>
		Effect.gen(function* () {
			const result = yield* calculateConfidenceFromFacets({
				facetScores: {
					imagination: { score: 0, confidence: 0 },
					altruism: { score: 20, confidence: 100 },
				} as unknown as FacetScoresMap,
			});

			expect(result.confidence).toBe(50);
			expect(result.facetCount).toBe(2);
		}).pipe(Effect.provide(TestLayer)),
	);
});
