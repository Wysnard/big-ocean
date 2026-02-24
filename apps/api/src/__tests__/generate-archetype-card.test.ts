/**
 * Generate Archetype Card Handler Tests
 *
 * Tests the handleArchetypeCard node:http handler.
 * Since the handler fetches profile data via internal API,
 * we test the card generation logic via the mock repository.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/card-generator.satori.repository");

import { describe, expect, it } from "@effect/vitest";
import { type CardGenerationInput, CardGeneratorRepository } from "@workspace/domain";
import { CardGeneratorSatoriRepositoryLive } from "@workspace/infrastructure/repositories/card-generator.satori.repository";
import { Effect, Layer } from "effect";

const TestLayer = Layer.mergeAll(CardGeneratorSatoriRepositoryLive);

describe("CardGeneratorRepository (mock)", () => {
	it.effect("should generate a PNG buffer for 1:1 format", () =>
		Effect.gen(function* () {
			const repo = yield* CardGeneratorRepository;

			const input: CardGenerationInput = {
				archetypeName: "The Idealist",
				oceanCode: "ODEWT",
				archetypeColor: "#6B5CE7",
				traitScores: {
					openness: 100,
					conscientiousness: 90,
					extraversion: 80,
					agreeableness: 95,
					neuroticism: 50,
				},
				displayName: "Test User",
				format: "1:1",
			};

			const result = yield* repo.generateArchetypeCard(input);
			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);

			// Verify PNG magic bytes
			expect(result[0]).toBe(0x89);
			expect(result[1]).toBe(0x50); // P
			expect(result[2]).toBe(0x4e); // N
			expect(result[3]).toBe(0x47); // G
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should generate a PNG buffer for 9:16 format", () =>
		Effect.gen(function* () {
			const repo = yield* CardGeneratorRepository;

			const input: CardGenerationInput = {
				archetypeName: "The Explorer",
				oceanCode: "OFIWR",
				archetypeColor: "#FF8C42",
				traitScores: {
					openness: 110,
					conscientiousness: 40,
					extraversion: 60,
					agreeableness: 85,
					neuroticism: 30,
				},
				displayName: null,
				format: "9:16",
			};

			const result = yield* repo.generateArchetypeCard(input);
			expect(result).toBeInstanceOf(Buffer);
			expect(result.length).toBeGreaterThan(0);
		}).pipe(Effect.provide(TestLayer)),
	);
});
