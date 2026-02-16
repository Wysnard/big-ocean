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
// Profile HTTP Schemas and Types
export * from "./http/groups/profile";
export { ProfileGroup } from "./http/groups/profile";
// Auth Middleware (Story 1.4)
export { AuthMiddleware } from "./middleware/auth";

// Shared Schemas & Types
export * from "./schemas/evidence";
export * from "./schemas/ocean-code";
