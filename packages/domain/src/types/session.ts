/**
 * Session Domain Types
 *
 * Core types for session management and personality assessment tracking
 */

import type { FacetConfidenceScores } from "./facet";

/**
 * Session status states
 */
export type SessionStatus = "active" | "paused" | "completed";

/**
 * Message role in conversation
 */
export type MessageRole = "user" | "assistant";

/**
 * Session metadata and state
 *
 * NOTE: Confidence is stored at facet level (30 facets, 0-100 integers).
 * Trait confidence is ALWAYS computed from facet confidence, never stored.
 */
export interface Session {
	id: string;
	userId: string | null;
	createdAt: Date;
	updatedAt: Date;
	status: SessionStatus;
	confidence: FacetConfidenceScores;
	messageCount: number;
}
