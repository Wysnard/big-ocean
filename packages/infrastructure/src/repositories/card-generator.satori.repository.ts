/**
 * Card Generator Repository Implementation (Satori + Resvg)
 *
 * Generates shareable archetype card images as PNG buffers.
 * Note: The primary card generation for HTTP is in apps/api/src/handlers/card.ts
 * (node:http layer). This repository exists for testability and future use.
 */

import { Resvg } from "@resvg/resvg-js";
import {
	CardGenerationError,
	type CardGenerationInput,
	CardGeneratorRepository,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

export const CardGeneratorSatoriRepositoryLive = Layer.effect(
	CardGeneratorRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		return CardGeneratorRepository.of({
			generateArchetypeCard: (input: CardGenerationInput) =>
				Effect.tryPromise({
					try: async () => {
						logger.info("Generating archetype card via repository", { format: input.format });
						// Minimal SVG for now — primary rendering is in the HTTP handler
						const width = 1080;
						const height = input.format === "9:16" ? 1920 : 1080;
						const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#0a0a0f"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-size="48">${input.archetypeName}</text></svg>`;
						const resvg = new Resvg(svg, { fitTo: { mode: "width" as const, value: width } });
						return Buffer.from(resvg.render().asPng());
					},
					catch: (error) =>
						new CardGenerationError({
							message: `Failed to generate ${input.format} archetype card`,
							cause: error instanceof Error ? error.message : String(error),
						}),
				}),
		});
	}),
);
