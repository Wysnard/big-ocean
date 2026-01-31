/**
 * Cost Guard Service
 *
 * Provides cost tracking and rate limiting for LLM operations.
 * Uses Context.Tag pattern for Effect-based dependency injection.
 * This is a placeholder implementation - full implementation in Story 2.5.
 */

import { Context, Effect, Layer } from "effect";

/**
 * Cost Guard Service Interface
 */
export interface CostGuardShape {
  readonly checkDailyLimit: (userId: string) => Effect.Effect<boolean>;
  readonly trackCost: (userId: string, cost: number) => Effect.Effect<void>;
  readonly getDailySpend: (userId: string) => Effect.Effect<number>;
}

/**
 * Cost Guard Service Tag
 *
 * Using Context.Tag for proper Effect dependency injection.
 * Service interface has NO requirements - dependencies managed during layer construction.
 */
export class CostGuardService extends Context.Tag("CostGuardService")<
  CostGuardService,
  CostGuardShape
>() {}

/**
 * Cost Guard Service Layer (Placeholder Implementation)
 *
 * Returns a no-op implementation for now.
 * Full implementation with Redis/PostgreSQL in Story 2.5.
 */
export const CostGuardServiceLive = Layer.succeed(CostGuardService, {
  checkDailyLimit: (_userId: string) => Effect.succeed(true),
  trackCost: (_userId: string, _cost: number) => Effect.void,
  getDailySpend: (_userId: string) => Effect.succeed(0),
});
