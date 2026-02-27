/**
 * Shared Contracts Package
 *
 * Type-safe schemas for frontend-backend communication.
 * Exports schemas, TypeScript types, and shared data structures.
 *
 * Note: Migrated from @effect/rpc to plain HTTP endpoints.
 * Better Auth handles authentication via HTTP, other services follow same pattern.
 */

// Error Definitions
export * from "./errors";
// HTTP API Composition
export { BigOceanApi } from "./http/api";
// HTTP Schemas and Types
export * from "./http/groups/assessment";
export { AssessmentGroup } from "./http/groups/assessment";
// Evidence HTTP Schemas and Types
export * from "./http/groups/evidence";
export { EvidenceGroup } from "./http/groups/evidence";
export * from "./http/groups/health";
// HTTP API Groups
export { HealthGroup } from "./http/groups/health";
// Portrait HTTP Schemas and Types (Story 13.3)
export * from "./http/groups/portrait";
export { PortraitGroup } from "./http/groups/portrait";
// Profile HTTP Schemas and Types
export * from "./http/groups/profile";
export { ProfileGroup } from "./http/groups/profile";
// Purchase HTTP Schemas and Types (Story 14.1)
export * from "./http/groups/purchase";
export { PurchaseGroup, PurchaseWebhookGroup } from "./http/groups/purchase";
// Relationship HTTP Schemas and Types (Story 14.2)
export * from "./http/groups/relationship";
export { RelationshipGroup, RelationshipPublicGroup } from "./http/groups/relationship";
// Auth Middleware (Story 1.4)
export { AuthMiddleware, OptionalAuthMiddleware } from "./middleware/auth";
// Shared Schemas & Types
export * from "./schemas/evidence";
export * from "./schemas/ocean-code";
// Assessment Token Security (Story 9.1)
export { AssessmentTokenSecurity } from "./security/assessment-token";
// Invite Token Security (Story 14.3)
export { InviteTokenSecurity } from "./security/invite-token";
