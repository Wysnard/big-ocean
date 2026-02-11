/**
 * Session Domain Types
 *
 * Core types for session management and personality assessment tracking
 */

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
 * NOTE: Confidence is computed on-demand from facet_evidence.
 * No confidence data is stored on the session itself.
 */
export interface Session {
	id: string;
	userId: string | null;
	createdAt: Date;
	updatedAt: Date;
	status: SessionStatus;
	messageCount: number;
}
