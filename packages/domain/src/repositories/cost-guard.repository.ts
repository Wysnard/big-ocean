/**
 * CostGuard Repository Interface
 *
 * Provides cost tracking and rate limiting operations for LLM usage.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */

import { Context, Effect } from "effect";
import type { RedisOperationError } from "./redis.repository.js";

/**
 * CostGuard Repository Methods Interface
 */
export interface CostGuardMethods {
  /**
   * Increment daily cost for a user
   * @param userId - User identifier
   * @param costCents - Cost in cents to add
   * @returns New total daily cost in cents
   */
  readonly incrementDailyCost: (
    userId: string,
    costCents: number,
  ) => Effect.Effect<number, RedisOperationError>;

  /**
   * Get current daily cost for a user
   * @param userId - User identifier
   * @returns Current daily cost in cents (0 if no usage)
   */
  readonly getDailyCost: (
    userId: string,
  ) => Effect.Effect<number, RedisOperationError>;

  /**
   * Increment daily assessment count for a user
   * @param userId - User identifier
   * @returns New total assessment count for today
   */
  readonly incrementAssessmentCount: (
    userId: string,
  ) => Effect.Effect<number, RedisOperationError>;

  /**
   * Get current daily assessment count for a user
   * @param userId - User identifier
   * @returns Current assessment count for today (0 if none)
   */
  readonly getAssessmentCount: (
    userId: string,
  ) => Effect.Effect<number, RedisOperationError>;
}

/**
 * CostGuard Repository Tag
 *
 * Service interface for cost tracking and rate limiting.
 */
export class CostGuardRepository extends Context.Tag("CostGuardRepository")<
  CostGuardRepository,
  CostGuardMethods
>() {}
