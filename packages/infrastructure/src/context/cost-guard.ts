/**
 * Cost Guard FiberRef Bridge
 *
 * Provides request-scoped cost tracking and rate limiting.
 * This is a placeholder for Story 1.3 - real implementation in Epic 2.
 */

import { FiberRef, Effect } from "effect";

/**
 * Cost Guard interface for tracking LLM costs and rate limits
 */
export interface CostGuard {
  checkDailyLimit(userId: string): Promise<boolean>;
  trackCost(userId: string, cost: number): Promise<void>;
  getDailySpend(userId: string): Promise<number>;
}

/**
 * FiberRef for request-scoped cost guard
 */
export const CostGuardRef = FiberRef.unsafeMake<CostGuard>(null as any);

/**
 * Get the cost guard from the current fiber context
 */
export const getCostGuard = Effect.gen(function* () {
  return yield* FiberRef.get(CostGuardRef);
});

/**
 * Execute an effect with a cost guard in scope
 */
export const withCostGuard = <A, E, R>(
  costGuard: CostGuard,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> => {
  return Effect.gen(function* () {
    yield* FiberRef.set(CostGuardRef, costGuard);
    return yield* effect;
  });
};
