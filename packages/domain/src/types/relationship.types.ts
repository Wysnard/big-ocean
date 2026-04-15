/**
 * Relationship Types (Story 34-1 — QR Token Infrastructure)
 *
 * QR token model replaces invitation model per ADR-10.
 */

// ─── QR Token Types ────────────────────────────────────────────────────────

export type QrTokenStatus = "active" | "accepted" | "expired";

export interface QrToken {
	readonly id: string;
	readonly userId: string;
	readonly token: string;
	readonly expiresAt: Date;
	readonly status: QrTokenStatus;
	readonly acceptedByUserId: string | null;
	readonly createdAt: Date;
}

/** QR tokens expire after 6 hours */
export const QR_TOKEN_TTL_HOURS = 6;

// ─── Relationship Analysis Types ───────────────────────────────────────────

/**
 * Relationship Analysis Record (Story 14.4, updated Story 34-1)
 *
 * Updated: invitationId removed, userAResultId/userBResultId added.
 */
export interface RelationshipAnalysis {
	readonly id: string;
	readonly userAId: string;
	readonly userBId: string;
	readonly userAResultId: string;
	readonly userBResultId: string;
	readonly content: string | null;
	readonly contentCompletedAt: Date | null;
	readonly modelUsed: string | null;
	readonly retryCount: number;
	readonly createdAt: Date;
}
