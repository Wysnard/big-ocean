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
// Account HTTP Schemas and Types (Story 30-2)
export * from "./http/groups/account";
export { AccountGroup } from "./http/groups/account";
// HTTP Schemas and Types
export * from "./http/groups/conversation";
export { ConversationGroup } from "./http/groups/conversation";
// Email HTTP Schemas and Types (Story 31-7)
export { EmailGroup } from "./http/groups/email";
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
// QR Token HTTP Schemas and Types (Story 34-1)
export * from "./http/groups/qr-token";
export { QrTokenGroup } from "./http/groups/qr-token";
// Relationship HTTP Schemas and Types (Story 14.2, updated Story 34-1)
export * from "./http/groups/relationship";
export { RelationshipGroup } from "./http/groups/relationship";
// Auth Middleware (Story 1.4)
export { AuthMiddleware, OptionalAuthMiddleware } from "./middleware/auth";
// Shared Schemas & Types
export * from "./schemas/evidence";
export * from "./schemas/ocean-code";
// Conversation Token Security (Story 9.1)
export { ConversationTokenSecurity } from "./security/conversation-token";
