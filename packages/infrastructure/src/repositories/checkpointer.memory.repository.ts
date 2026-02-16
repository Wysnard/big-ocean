/**
 * Memory Checkpointer Repository Implementation
 *
 * Provides LangGraph state persistence via MemorySaver.
 * Used in tests and development for ephemeral state.
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import { MemorySaver } from "@langchain/langgraph";
import { Layer } from "effect";
import { CheckpointerRepository } from "./checkpointer.repository";

/**
 * Memory Checkpointer Layer for tests and development.
 *
 * State is stored in-memory and lost when the process exits.
 * Useful for unit tests that don't need persistence.
 */
export const CheckpointerMemoryRepositoryLive = Layer.succeed(
	CheckpointerRepository,
	CheckpointerRepository.of({
		checkpointer: new MemorySaver(),
	}),
);
