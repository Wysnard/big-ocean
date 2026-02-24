import type { CardGenerationInput } from "@workspace/domain";
import { CardGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * Mock Card Generator — returns a 1x1 transparent PNG stub
 */
const MOCK_PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
	"base64",
);

export const CardGeneratorSatoriRepositoryLive = Layer.succeed(
	CardGeneratorRepository,
	CardGeneratorRepository.of({
		generateArchetypeCard: (_input: CardGenerationInput) => Effect.succeed(MOCK_PNG),
	}),
);
