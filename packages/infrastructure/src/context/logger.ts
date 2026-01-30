/**
 * Logger FiberRef Bridge
 *
 * Provides request-scoped logger access via Effect FiberRef.
 * This enables dependency injection without prop drilling.
 */

import { FiberRef, Effect } from "effect";

/**
 * Simplified logger interface compatible with various logging libraries
 */
export interface Logger {
  info(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
  http?(msg: string, ...args: any[]): void;
}

/**
 * FiberRef for request-scoped logger
 */
export const LoggerRef = FiberRef.unsafeMake<Logger>(null as any);

/**
 * Get the logger from the current fiber context
 */
export const getLogger = Effect.gen(function* () {
  return yield* FiberRef.get(LoggerRef);
});

/**
 * Execute an effect with a logger in scope
 */
export const withLogger = <A, E, R>(
  logger: Logger,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> => {
  return Effect.gen(function* () {
    yield* FiberRef.set(LoggerRef, logger);
    return yield* effect;
  });
};
