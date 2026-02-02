/**
 * Cost Calculator Service
 *
 * Pure function for calculating LLM API costs based on token usage.
 * Uses Anthropic Claude Sonnet 4.5 pricing (as of 2026-02-01).
 *
 * @module cost-calculator
 */

/**
 * Anthropic Claude pricing constants
 * These are the per-million-token rates for Claude Sonnet 4.5
 */
export const PRICING = {
  /** $0.003 per 1 million input tokens */
  INPUT_PER_MILLION: 0.003,
  /** $0.015 per 1 million output tokens */
  OUTPUT_PER_MILLION: 0.015,
} as const;

/**
 * Result of a cost calculation
 */
export interface CostResult {
  /** Cost in dollars for input tokens */
  readonly inputCost: number;
  /** Cost in dollars for output tokens */
  readonly outputCost: number;
  /** Total cost in dollars (inputCost + outputCost) */
  readonly totalCost: number;
  /** Total cost in cents, rounded up (for Redis storage as integer) */
  readonly totalCents: number;
}

/**
 * Calculate the cost of an LLM API call based on token usage.
 *
 * Formula:
 * - Input cost: (inputTokens / 1,000,000) * $0.003
 * - Output cost: (outputTokens / 1,000,000) * $0.015
 * - Total: inputCost + outputCost
 * - Cents: Math.ceil(totalCost * 100)
 *
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @returns Cost breakdown including dollars and cents
 *
 * @example
 * ```typescript
 * const result = calculateCost(12000, 3000);
 * // result.inputCost ≈ 0.000036
 * // result.outputCost ≈ 0.000045
 * // result.totalCost ≈ 0.000081
 * // result.totalCents = 1 (rounded up)
 * ```
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
): CostResult {
  const inputCost = (inputTokens / 1_000_000) * PRICING.INPUT_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * PRICING.OUTPUT_PER_MILLION;
  const totalCost = inputCost + outputCost;

  // Round up to nearest cent for Redis storage
  // Use 0 if total is 0 to avoid unnecessary 1 cent charges
  const totalCents = totalCost === 0 ? 0 : Math.ceil(totalCost * 100);

  return {
    inputCost,
    outputCost,
    totalCost,
    totalCents,
  };
}
