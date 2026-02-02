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

/**
 * Health API Group
 *
 * Routes:
 * - GET /health - Health check endpoint
 */
export const HealthGroup = HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/health").addSuccess(HealthCheckResponseSchema),
);

export type HealthCheckResponse = typeof HealthCheckResponseSchema.Type;
