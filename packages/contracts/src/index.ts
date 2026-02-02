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
export * from "./http/groups/health";
// HTTP API Groups
export { HealthGroup } from "./http/groups/health";

// Shared Schemas & Types
export * from "./schemas";
