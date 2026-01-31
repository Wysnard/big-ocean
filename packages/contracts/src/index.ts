/**
 * Shared Contracts Package
 *
 * Type-safe schemas for frontend-backend communication.
 * Exports schemas, TypeScript types, and shared data structures.
 *
 * Note: Migrated from @effect/rpc to plain HTTP endpoints.
 * Better Auth handles authentication via HTTP, other services follow same pattern.
 */

// HTTP API Groups
export * from "./groups/assessment.js";
export * from "./groups/health.js";
export * from "./api.js";

// Error Definitions
export * from "./errors.js";

// Shared Schemas & Types
export * from "./schemas.js";
