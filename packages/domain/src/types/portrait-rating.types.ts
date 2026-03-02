/**
 * Portrait Rating Types (Story 19-2)
 *
 * Types for portrait quality telemetry placeholder.
 * Follows as-const -> type pattern established in the codebase.
 */

// ─── Constants ────────────────────────────────────────────────────────────

export const PORTRAIT_TYPES = ["teaser", "full"] as const;
export type PortraitType = (typeof PORTRAIT_TYPES)[number];

export const PORTRAIT_RATINGS = ["up", "down"] as const;
export type PortraitRating = (typeof PORTRAIT_RATINGS)[number];

export const DEPTH_SIGNAL_LEVELS = ["rich", "moderate", "thin"] as const;
export type DepthSignalLevel = (typeof DEPTH_SIGNAL_LEVELS)[number];

// ─── Entity Type ──────────────────────────────────────────────────────────

export interface PortraitRatingRecord {
	readonly id: string;
	readonly userId: string;
	readonly assessmentSessionId: string;
	readonly portraitType: PortraitType;
	readonly rating: PortraitRating;
	readonly depthSignal: DepthSignalLevel;
	readonly evidenceCount: number;
	readonly createdAt: Date;
}
