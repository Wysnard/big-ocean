/**
 * Session Domain Types
 *
 * Core types for session management and personality assessment tracking
 */

import type { TraitPrecisionScores } from "./trait";

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
 */
export interface Session {
	id: string;
	userId: string | null;
	createdAt: Date;
	updatedAt: Date;
	status: SessionStatus;
	precision: TraitPrecisionScores;
	messageCount: number;
}
