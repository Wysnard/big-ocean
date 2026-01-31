/**
 * Profile Handlers (Placeholder - HTTP Endpoints)
 *
 * These are placeholder implementations for future profile features.
 * Real business logic will be implemented in Epic 4 (Sharing & Comparison).
 *
 * NOTE: Migrated from RPC to HTTP endpoints.
 * Actual HTTP route handlers should be implemented in apps/api/src/routes/profile.ts
 */

/**
 * TODO: Implement HTTP route handlers for profile endpoints:
 *
 * GET /api/profile/:publicProfileId
 * - Output: { archetypeName, oceanCode4Letter, traitSummary, description, archetypeColor }
 *
 * POST /api/profile/share
 * - Input: { sessionId: string }
 * - Output: { publicProfileId, shareableUrl }
 */

// Export placeholder - remove when actual HTTP handlers are implemented
export const ProfileHandlersPlaceholder = {
  message: "Profile handlers deferred to Epic 4 - use HTTP endpoints, not RPC",
};
