/**
 * Big Ocean HTTP API Composition
 *
 * Combines all API groups into unified BigOceanApi class.
 * Pattern from: effect-worker-mono/packages/contracts/src/http/api.ts
 */

import { HttpApi } from "@effect/platform";
import { AssessmentGroup } from "./groups/assessment";
import { EvidenceGroup } from "./groups/evidence";
import { HealthGroup } from "./groups/health";
import { ProfileGroup } from "./groups/profile";

/**
 * Big Ocean API
 *
 * Unified API composition with all route groups.
 * All routes are prefixed with /api except /health.
 */
export class BigOceanApi extends HttpApi.make("BigOceanApi")
	.add(HealthGroup) // /health (no prefix)
	.add(AssessmentGroup.prefix("/api")) // /api/assessment/*
	.add(ProfileGroup.prefix("/api")) // /api/profile/*
	.add(EvidenceGroup.prefix("/api")) {} // /api/evidence/*
