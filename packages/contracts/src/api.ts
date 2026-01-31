/**
 * Big Ocean HTTP API Composition
 *
 * Composes all HTTP API groups into a single API.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/api.ts
 */

import { HttpApi } from "@effect/platform"
import { AssessmentGroup } from "./groups/assessment.js"
import { HealthGroup } from "./groups/health.js"

/**
 * Big Ocean API - Composed from all route groups
 */
export class BigOceanApi extends HttpApi.make("BigOceanApi")
  .add(HealthGroup)
  .add(AssessmentGroup)
  .prefix("/api") {}
