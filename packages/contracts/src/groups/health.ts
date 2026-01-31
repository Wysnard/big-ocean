/**
 * Health Check HTTP Contract
 *
 * Simple health check endpoint for monitoring service availability.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/groups/health.ts
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema as S } from "effect"

/**
 * Health check response schema
 */
export const HealthResponseSchema = S.Struct({
  status: S.Literal("ok"),
  timestamp: S.optional(S.DateTimeUtc),
})

/**
 * Health check HTTP API group
 */
export const HealthGroup = HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/health").addSuccess(HealthResponseSchema)
)
