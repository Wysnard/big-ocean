/**
 * Pino Logger Service
 *
 * Effect service for structured logging using Pino.
 * Pattern from: Effect official service documentation
 */

import { Context, Effect, Layer } from "effect"
import pino from "pino"

/**
 * Logger Service Interface
 */
export interface Logger {
  info(message: string, context?: Record<string, any>): void
  error(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
}

/**
 * Logger Service Tag
 */
export class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  Logger
>() {}

/**
 * Pino Logger Implementation
 */
const createPinoLogger = (): Logger => {
  const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  })

  return {
    info: (message: string, context?: Record<string, any>) => {
      logger.info(context || {}, message)
    },
    error: (message: string, context?: Record<string, any>) => {
      logger.error(context || {}, message)
    },
    warn: (message: string, context?: Record<string, any>) => {
      logger.warn(context || {}, message)
    },
    debug: (message: string, context?: Record<string, any>) => {
      logger.debug(context || {}, message)
    },
  }
}

/**
 * Logger Service Live Layer
 */
export const LoggerServiceLive = Layer.sync(LoggerService, () =>
  createPinoLogger()
)

/**
 * Helper to access logger in Effect.gen()
 */
export const getLogger = LoggerService
