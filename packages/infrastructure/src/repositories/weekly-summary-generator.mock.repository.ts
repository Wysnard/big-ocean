import {
	type WeeklySummaryGenerationInput,
	WeeklySummaryGeneratorRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

export const WeeklySummaryGeneratorMockRepositoryLive = Layer.succeed(
	WeeklySummaryGeneratorRepository,
	WeeklySummaryGeneratorRepository.of({
		generateLetter: (input: WeeklySummaryGenerationInput) =>
			Effect.succeed({
				content: `# Your week\n\n(Mock weekly letter for ${input.weekId})`,
				modelUsed: "mock-weekly-summary",
			}),
	}),
);
