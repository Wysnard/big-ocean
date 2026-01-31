/**
 * Health Check Handler
 *
 * Simple health check endpoint implementation.
 * Pattern from: effect-worker-mono/apps/effect-worker-api/src/handlers/health.ts
 */

import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { BigOceanApi } from "@workspace/contracts"

export const HealthGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "health",
  (handlers) =>
    Effect.gen(function* () {
      return handlers.handle("check", () =>
        Effect.succeed({
          status: "ok" as const,
        })
      )
    })
)
