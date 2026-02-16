/**
 * Checkpointer Repository Interface
 *
 * Defines the contract for LangGraph state persistence.
 * Enables conversation state to persist across server restarts
 * and multiple instances via shared storage (PostgreSQL, memory, etc.)
 *
 * This lives in infrastructure (not domain) because it wraps a
 * LangGraph-specific type (BaseCheckpointSaver) — an implementation detail.
 *
 * @see packages/infrastructure/src/repositories/checkpointer.*.repository.ts
 */

import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { Context } from "effect";

/**
 * Checkpointer Repository Service Tag
 *
 * Wraps a LangGraph BaseCheckpointSaver for dependency injection.
 * The checkpointer is optional - when not provided, graph runs without persistence.
 */
export class CheckpointerRepository extends Context.Tag("CheckpointerRepository")<
	CheckpointerRepository,
	{
		/**
		 * The underlying LangGraph checkpointer instance.
		 * Used by OrchestratorGraphRepository during graph compilation.
		 */
		readonly checkpointer: BaseCheckpointSaver;
	}
>() {}
