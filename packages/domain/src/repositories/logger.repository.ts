import { Context } from "effect";

/**
 * Logger Repository Interface
 *
 * Provides structured logging capabilities across the application.
 * Methods are synchronous side-effects that return void.
 */

export interface LoggerMethods {
	/**
	 * Log an informational message
	 */
	readonly info: (message: string, meta?: Record<string, unknown>) => void;

	/**
	 * Log a warning message
	 */
	readonly warn: (message: string, meta?: Record<string, unknown>) => void;

	/**
	 * Log an error message
	 */
	readonly error: (message: string, meta?: Record<string, unknown>) => void;

	/**
	 * Log a debug message
	 */
	readonly debug: (message: string, meta?: Record<string, unknown>) => void;
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
