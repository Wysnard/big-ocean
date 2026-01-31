/**
 * Assessment Handlers (Placeholder - HTTP Endpoints)
 *
 * These are placeholder implementations for Story 1.3.
 * Real business logic will be implemented in Epic 2 with LangGraph integration.
 *
 * NOTE: Migrated from RPC to HTTP endpoints.
 * Actual HTTP route handlers should be implemented in apps/api/src/routes/assessment.ts
 */

/**
 * TODO: Implement HTTP route handlers for assessment endpoints:
 *
 * POST /api/assessment/start
 * - Input: { userId?: string }
 * - Output: { sessionId: string, createdAt: string }
 *
 * POST /api/assessment/message
 * - Input: { sessionId: string, message: string }
 * - Output: { response: string, precision: { openness, conscientiousness, extraversion, agreeableness, neuroticism } }
 *
 * GET /api/assessment/:sessionId/results
 * - Output: { oceanCode4Letter, precision, archetypeName, traitScores }
 *
 * GET /api/assessment/:sessionId/resume
 * - Output: { messages[], precision, oceanCode4Letter? }
 */

// Export placeholder - remove when actual HTTP handlers are implemented
export const AssessmentHandlersPlaceholder = {
  message: "Assessment handlers deferred to Story 1.3 - use HTTP endpoints, not RPC",
};
