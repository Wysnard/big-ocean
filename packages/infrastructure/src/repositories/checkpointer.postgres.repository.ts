/**
 * PostgreSQL Checkpointer Repository Implementation
 *
 * Provides LangGraph state persistence via PostgresSaver.
 * Used in production for durable conversation state across restarts.
 *
 * Requires AppConfig and LoggerRepository to be provided.
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { AppConfig, CheckpointerRepository, LoggerRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * PostgreSQL Checkpointer Repository Live Layer
 *
 * Creates a PostgresSaver checkpointer using the database URL from AppConfig.
 * Automatically sets up checkpoint tables on initialization.
 *
 * Dependencies:
 * - AppConfig: For DATABASE_URL
 * - LoggerRepository: For structured logging
 */
export const CheckpointerPostgresRepositoryLive = Layer.effect(
	CheckpointerRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		logger.info("Initializing PostgresSaver checkpointer");

		const checkpointer = yield* Effect.tryPromise({
			try: async () => {
				const saver = PostgresSaver.fromConnString(config.databaseUrl);
				await saver.setup();
				return saver;
			},
			catch: (error) => {
				const message = error instanceof Error ? error.message : String(error);
				logger.error("Failed to initialize PostgresSaver", { error: message });
				return new Error(`Failed to initialize PostgresSaver: ${message}`);
			},
		});

		logger.info("PostgresSaver checkpointer initialized successfully");

		return CheckpointerRepository.of({ checkpointer });
	}),
);
