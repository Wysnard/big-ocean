/**
 * FinAnalyzer Mock Repository Implementation
 *
 * Returns deterministic evidence for MOCK_LLM=true integration/e2e testing.
 * Evidence messageIds use "msg-{index}" pattern — the generate-results pipeline
 * gracefully skips evidence with invalid messageIds, so this is safe.
 *
 * Story 11.2
 */

import { FinanalyzerRepository, LoggerRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const FinanalyzerMockRepositoryLive = Layer.effect(
	FinanalyzerRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		logger.info("FinAnalyzer configured (mock)");

		return FinanalyzerRepository.of({
			analyze: (params) => {
				logger.info("Mock FinAnalyzer analysis", { messageCount: params.messages.length });

				// Build evidence referencing actual message IDs when available
				const messageIds = params.messages.filter((m) => m.role === "user").map((m) => m.id);

				const msgId = (i: number) => messageIds[i % messageIds.length] ?? `msg-${i}`;

				return Effect.succeed({
					evidence: [
						{
							messageId: msgId(0),
							bigfiveFacet: "imagination" as const,
							score: 16,
							confidence: 0.8,
							domain: "work" as const,
							rawDomain: "creative projects",
							quote: "new ideas",
						},
						{
							messageId: msgId(0),
							bigfiveFacet: "orderliness" as const,
							score: 8,
							confidence: 0.6,
							domain: "work" as const,
							rawDomain: "project management",
							quote: "flexible",
						},
						{
							messageId: msgId(0),
							bigfiveFacet: "friendliness" as const,
							score: 17,
							confidence: 0.9,
							domain: "relationships" as const,
							rawDomain: "close friendships",
							quote: "conversations",
						},
						{
							messageId: msgId(0),
							bigfiveFacet: "trust" as const,
							score: 13,
							confidence: 0.7,
							domain: "relationships" as const,
							rawDomain: "romantic partner",
							quote: "good",
						},
						{
							messageId: msgId(0),
							bigfiveFacet: "anxiety" as const,
							score: 11,
							confidence: 0.5,
							domain: "work" as const,
							rawDomain: "deadlines",
							quote: "worry",
						},
					],
					tokenUsage: { input: 0, output: 0 },
				});
			},
		});
	}),
);
