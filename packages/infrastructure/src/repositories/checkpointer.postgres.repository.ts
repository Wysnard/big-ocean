/**
 * PostgreSQL Checkpointer Repository Implementation
 *
 * Provides LangGraph state persistence via PostgresSaver.
 * Used in production for durable conversation state across restarts.
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { CheckpointerRepository, LoggerRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * Creates a PostgresSaver checkpointer layer from a connection string.
 *
 * @param connectionString - PostgreSQL connection string
 * @returns Layer providing CheckpointerRepository
 *
 * @example
 * ```typescript
 * const checkpointerLayer = createPostgresCheckpointerLayer(
 *   process.env.DATABASE_URL ?? "postgresql://localhost:5432/bigocean"
 * );
 * ```
 */
export function createPostgresCheckpointerLayer(
	connectionString: string,
): Layer.Layer<CheckpointerRepository, Error, LoggerRepository> {
	return Layer.effect(
		CheckpointerRepository,
		Effect.gen(function* () {
			const logger = yield* LoggerRepository;

			logger.info("Initializing PostgresSaver checkpointer");

			const checkpointer = yield* Effect.tryPromise({
				try: async () => {
					const saver = PostgresSaver.fromConnString(connectionString);
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
}
