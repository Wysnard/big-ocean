/**
 * CostGuard Repository Interface
 *
 * Provides cost tracking and rate limiting operations for LLM usage.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */

import { Context, Effect } from "effect";
import type {
	CostLimitExceeded,
	MessageRateLimitError,
	RateLimitExceeded,
} from "../errors/http.errors";
import type { RedisOperationError } from "./redis.repository";

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
	readonly getDailyCost: (userId: string) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Increment daily assessment count for a user
	 * @param userId - User identifier
	 * @returns New total assessment count for today
	 */
	readonly incrementAssessmentCount: (userId: string) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Get current daily assessment count for a user
	 * @param userId - User identifier
	 * @returns Current assessment count for today (0 if none)
	 */
	readonly getAssessmentCount: (userId: string) => Effect.Effect<number, RedisOperationError>;

	/**
	 * Check if user can start a new assessment
	 * @param userId - User identifier
	 * @returns true if user can start assessment (count < 1), false otherwise
	 * @throws RedisOperationError if Redis operation fails
	 */
	readonly canStartAssessment: (userId: string) => Effect.Effect<boolean, RedisOperationError>;

	/**
	 * Record assessment start for rate limiting
	 * Atomically increments assessment counter and validates limit not exceeded
	 * @param userId - User identifier
	 * @throws RateLimitExceeded if user already started assessment today
	 * @throws RedisOperationError if Redis operation fails
	 */
	readonly recordAssessmentStart: (
		userId: string,
	) => Effect.Effect<void, RedisOperationError | RateLimitExceeded>;

	/**
	 * Check daily budget — fails with CostLimitExceeded if limit reached
	 * @param key - Cost key (userId or sessionId for anonymous)
	 * @param limitCents - Daily budget in cents
	 */
	readonly checkDailyBudget: (
		key: string,
		limitCents: number,
	) => Effect.Effect<void, RedisOperationError | CostLimitExceeded>;

	/**
	 * Check per-user message rate limit (2 messages/minute fixed-window)
	 * @param key - Cost key (userId or sessionId for anonymous)
	 * @throws MessageRateLimitError if rate limit exceeded
	 * @throws RedisOperationError if Redis operation fails
	 */
	readonly checkMessageRateLimit: (
		key: string,
	) => Effect.Effect<void, RedisOperationError | MessageRateLimitError>;
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
