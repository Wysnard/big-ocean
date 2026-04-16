/**
 * Health-only HTTP contract schemas — isolated so Vitest can resolve this file
 * without loading conversation groups (which depend on @workspace/domain).
 */

import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";
import { CostGuardHealthResponseSchema } from "../http/groups/health";

describe("GET /health/cost-guard contract (Story 11-1)", () => {
	it("validates success response shape", () => {
		const valid = {
			freeTierLlmPaused: false,
			weeklyLetterExpectedCostCents: 10,
			costCeilingActiveUsersEstimate: 700,
			costCircuitBreakerMultiplier: 3,
		};
		const result = S.decodeUnknownSync(CostGuardHealthResponseSchema)(valid);
		expect(result.freeTierLlmPaused).toBe(false);
		expect(result.costCircuitBreakerMultiplier).toBe(3);
	});

	it("rejects wrong field types", () => {
		const invalid = {
			freeTierLlmPaused: "no",
			weeklyLetterExpectedCostCents: 10,
			costCeilingActiveUsersEstimate: 700,
			costCircuitBreakerMultiplier: 3,
		};
		expect(() => S.decodeUnknownSync(CostGuardHealthResponseSchema)(invalid)).toThrow();
	});
});
