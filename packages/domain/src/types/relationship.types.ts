/**
 * Relationship Invitation Types (Story 14.2)
 */

export type InvitationStatus = "pending" | "accepted" | "refused" | "expired";

export interface RelationshipInvitation {
	readonly id: string;
	readonly inviterUserId: string;
	readonly inviteeUserId: string | null;
	readonly invitationToken: string;
	readonly personalMessage: string | null;
	readonly status: InvitationStatus;
	readonly expiresAt: Date;
	readonly updatedAt: Date;
	readonly createdAt: Date;
}

export interface CreateInvitationInput {
	readonly inviterUserId: string;
	readonly personalMessage?: string;
}

export const INVITATION_EXPIRY_DAYS = 30;

/**
 * Relationship Analysis Record (Story 14.4)
 */
export interface RelationshipAnalysis {
	readonly id: string;
	readonly invitationId: string;
	readonly userAId: string;
	readonly userBId: string;
	readonly content: string | null;
	readonly modelUsed: string | null;
	readonly retryCount: number;
	readonly createdAt: Date;
}
