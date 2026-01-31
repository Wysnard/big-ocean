/**
 * Shared Contracts Package
 *
 * Type-safe schemas for frontend-backend communication.
 * Exports schemas, TypeScript types, and shared data structures.
 *
 * Note: Migrated from @effect/rpc to plain HTTP endpoints.
 * Better Auth handles authentication via HTTP, other services follow same pattern.
 */

// HTTP API Composition
export { BigOceanApi } from "./http/api.js";

// HTTP API Groups
export { HealthGroup } from "./http/groups/health.js";
export { AssessmentGroup } from "./http/groups/assessment.js";

// HTTP Schemas and Types
export * from "./http/groups/assessment.js";
export * from "./http/groups/health.js";

// Error Definitions
export * from "./errors.js";

// Shared Schemas & Types
export * from "./schemas.js";
