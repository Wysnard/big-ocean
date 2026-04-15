/**
 * Mock UserSummary generator for tests / E2E (Story 7.1).
 */

import { type UserSummaryGenerationInput, UserSummaryGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const UserSummaryGeneratorMockRepositoryLive = Layer.succeed(
	UserSummaryGeneratorRepository,
	UserSummaryGeneratorRepository.of({
		generate: (_input: UserSummaryGenerationInput) =>
			Effect.succeed({
				themes: [
					{
						theme: "Mock theme",
						description: "Deterministic mock summary for tests.",
					},
				],
				quoteBank: [{ quote: "mock quote", themeTag: "mock", context: "test" }],
				summaryText: "Mock user summary narrative for automated tests.",
				modelUsed: "mock-haiku",
			}),
	}),
);
