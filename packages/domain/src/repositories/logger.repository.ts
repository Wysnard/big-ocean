import { Context, Effect } from "effect";

/**
 * Logger Repository Interface
 *
 * Provides structured logging capabilities across the application.
 * Methods return Effect.void for proper composability in Effect programs.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */

export interface LoggerMethods {
  /**
   * Log an informational message
   */
  readonly info: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>;

  /**
   * Log a warning message
   */
  readonly warn: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>;

  /**
   * Log an error message
   */
  readonly error: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>;

  /**
   * Log a debug message
   */
  readonly debug: (message: string, meta?: Record<string, unknown>) => Effect.Effect<void>;
}

/**
 * Logger Repository Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 */
export class LoggerRepository extends Context.Tag("LoggerRepository")<
  LoggerRepository,
  LoggerMethods
>() {}
