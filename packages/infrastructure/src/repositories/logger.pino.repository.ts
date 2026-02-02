/**
 * Pino Logger Repository Implementation
 *
 * Provides structured logging using Pino.
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.sync for implementation
 * - Uses LoggerRepository.of({...}) for proper service implementation
 */

import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Layer } from "effect";
import * as pinoModule from "pino";

/**
 * Logger Repository Layer - Creates Pino logger instance
 *
 * Layer type: Layer<LoggerRepository, never, never>
 * No dependencies required.
 */
export const LoggerPinoRepositoryLive = Layer.sync(LoggerRepository, () => {
	const pino = (pinoModule as any).default || pinoModule;
	// Only use pino-pretty in explicit development mode
	const isDevelopment = process.env.NODE_ENV === "development";

	const logger = pino({
		level: process.env.LOG_LEVEL || "info",
		transport: isDevelopment
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:MM:ss",
						ignore: "pid,hostname",
					},
				}
			: undefined,
	});

	// Return service implementation using .of() pattern
	return LoggerRepository.of({
		info: (message: string, meta?: Record<string, unknown>) => {
			logger.info(meta || {}, message);
		},
		error: (message: string, meta?: Record<string, unknown>) => {
			logger.error(meta || {}, message);
		},
		warn: (message: string, meta?: Record<string, unknown>) => {
			logger.warn(meta || {}, message);
		},
		debug: (message: string, meta?: Record<string, unknown>) => {
			logger.debug(meta || {}, message);
		},
	});
});
