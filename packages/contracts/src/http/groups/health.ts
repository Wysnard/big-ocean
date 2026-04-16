/**
 * Health Check HTTP API Group
 *
 * Defines health check endpoint for service monitoring.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/groups/health.ts
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";

/**
 * Health Check Response Schema
 */
export const HealthCheckResponseSchema = S.Struct({
	status: S.Literal("ok"),
	timestamp: S.DateTimeUtc,
});

/** Story 11-1 — ops visibility for free-tier LLM pause + ceiling tuning knobs */
export const CostGuardHealthResponseSchema = S.Struct({
	freeTierLlmPaused: S.Boolean,
	weeklyLetterExpectedCostCents: S.Number,
	costCeilingActiveUsersEstimate: S.Number,
	costCircuitBreakerMultiplier: S.Number,
});

/**
 * Health API Group
 *
 * Routes:
 * - GET /health - Health check endpoint
 * - GET /health/cost-guard - Cost ceiling / pause flag (Story 11-1)
 */
export const HealthGroup = HttpApiGroup.make("health")
	.add(HttpApiEndpoint.get("check", "/health").addSuccess(HealthCheckResponseSchema))
	.add(
		HttpApiEndpoint.get("costGuard", "/health/cost-guard").addSuccess(CostGuardHealthResponseSchema),
	);

export type HealthCheckResponse = typeof HealthCheckResponseSchema.Type;
export type CostGuardHealthResponse = typeof CostGuardHealthResponseSchema.Type;
