/**
 * Cost Calculator Service
 *
 * Pure function for calculating LLM API costs based on token usage.
 * Supports per-model pricing for Anthropic Claude models.
 *
 * @module cost-calculator
 */

/** Per-model pricing: $ per 1 million tokens */
interface ModelPricing {
	readonly inputPerMillion: number;
	readonly outputPerMillion: number;
}

/**
 * Pricing table keyed by model ID prefix.
 * Longest-prefix match is used so "claude-sonnet-4" matches before "claude-".
 */
const MODEL_PRICING: ReadonlyArray<{ readonly prefix: string; readonly pricing: ModelPricing }> = [
	// Haiku
	{ prefix: "claude-haiku-4-5", pricing: { inputPerMillion: 1.0, outputPerMillion: 5.0 } },
	{ prefix: "claude-haiku-3-5", pricing: { inputPerMillion: 0.8, outputPerMillion: 4.0 } },
	// Sonnet
	{ prefix: "claude-sonnet-4", pricing: { inputPerMillion: 3.0, outputPerMillion: 15.0 } },
	// Opus 4.5+ ($5/$25)
	{ prefix: "claude-opus-4-5", pricing: { inputPerMillion: 5.0, outputPerMillion: 25.0 } },
	{ prefix: "claude-opus-4-6", pricing: { inputPerMillion: 5.0, outputPerMillion: 25.0 } },
	// Opus 4.0/4.1 ($15/$75)
	{ prefix: "claude-opus-4-1", pricing: { inputPerMillion: 15.0, outputPerMillion: 75.0 } },
	{ prefix: "claude-opus-4-2", pricing: { inputPerMillion: 15.0, outputPerMillion: 75.0 } },
];

/** Defaults to Opus 4.6 (most expensive) so omitting modelId always overestimates. */
const DEFAULT_PRICING: ModelPricing = { inputPerMillion: 5.0, outputPerMillion: 25.0 };

/**
 * @deprecated Use calculateCost with a modelId instead.
 * Defaults to Opus 4.6 pricing (worst-case).
 */
export const PRICING = {
	INPUT_PER_MILLION: 5.0,
	OUTPUT_PER_MILLION: 25.0,
} as const;

/** Resolve pricing for a model ID using longest-prefix match. */
export function getPricingForModel(modelId: string): ModelPricing {
	let best: ModelPricing = DEFAULT_PRICING;
	let bestLen = 0;
	for (const entry of MODEL_PRICING) {
		if (modelId.startsWith(entry.prefix) && entry.prefix.length > bestLen) {
			best = entry.pricing;
			bestLen = entry.prefix.length;
		}
	}
	return best;
}

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
 * When `modelId` is provided, pricing is looked up from the model pricing table.
 * Without `modelId`, defaults to Haiku 4.5 pricing for backward compatibility.
 *
 * @param inputTokens - Number of input tokens used
 * @param outputTokens - Number of output tokens generated
 * @param modelId - Optional model ID (e.g. "claude-sonnet-4-20250514") for per-model pricing
 * @returns Cost breakdown including dollars and cents
 *
 * @example
 * ```typescript
 * const result = calculateCost(12000, 3000, "claude-sonnet-4-20250514");
 * // result.inputCost = 0.036
 * // result.outputCost = 0.045
 * // result.totalCost = 0.081
 * // result.totalCents = 9 (rounded up)
 * ```
 */
export function calculateCost(
	inputTokens: number,
	outputTokens: number,
	modelId?: string,
): CostResult {
	const pricing = modelId ? getPricingForModel(modelId) : DEFAULT_PRICING;
	const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
	const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
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
