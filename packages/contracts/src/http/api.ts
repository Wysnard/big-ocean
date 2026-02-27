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
import { PortraitGroup } from "./groups/portrait";
import { ProfileGroup } from "./groups/profile";
import { PurchaseGroup, PurchaseWebhookGroup } from "./groups/purchase";
import { RelationshipGroup, RelationshipPublicGroup } from "./groups/relationship";
import { WaitlistGroup } from "./groups/waitlist";

/**
 * Big Ocean API
 *
 * Unified API composition with all route groups.
 * All routes are prefixed with /api except /health.
 */
export class BigOceanApi extends HttpApi.make("BigOceanApi")
	.add(HealthGroup) // /health (no prefix)
	.add(AssessmentGroup.prefix("/api")) // /api/assessment/*
	.add(ProfileGroup.prefix("/api")) // /api/public-profile/*
	.add(EvidenceGroup.prefix("/api")) // /api/evidence/*
	.add(PortraitGroup.prefix("/api")) // /api/portrait/:sessionId/status
	.add(PurchaseWebhookGroup.prefix("/api")) // /api/purchase/polar-webhook (public)
	.add(PurchaseGroup.prefix("/api")) // /api/purchase/verify (authenticated)
	.add(RelationshipGroup.prefix("/api")) // /api/relationship/* (authenticated)
	.add(RelationshipPublicGroup.prefix("/api")) // /api/relationship/public/* (public)
	.add(WaitlistGroup.prefix("/api")) {} // /api/waitlist/signup (public)
