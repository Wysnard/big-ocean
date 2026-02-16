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
import { AppConfig, LoggerRepository } from "@workspace/domain";
import { Effect, Layer, Schedule } from "effect";
import { CheckpointerRepository } from "./checkpointer.repository";

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
		}).pipe(
			// Retry on race condition: concurrent setup() calls can hit
			// "duplicate key violates unique constraint pg_type_typname_nsp_index"
			// when checkpoint tables are being created simultaneously.
			Effect.retry({ times: 3, schedule: Schedule.spaced("1 seconds") }),
		);

		logger.info("PostgresSaver checkpointer initialized successfully");

		return CheckpointerRepository.of({ checkpointer });
	}),
);
