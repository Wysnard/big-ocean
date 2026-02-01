/**
 * Session Domain Types
 *
 * Core types for session management and personality assessment tracking
 */

/**
 * Precision scores for Big Five personality traits
 * Values range from 0.0 (low confidence/low trait) to 1.0 (high confidence/high trait)
 */
export interface PrecisionScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

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
  precision: PrecisionScores;
  messageCount: number;
}
