/**
 * Purchase Event Types & Domain Models (Story 13.1)
 *
 * Append-only purchase event log types for capability derivation.
 * Follows as-const → type → Schema → pgEnum pattern.
 */

import { Schema as S } from "effect";

// ─── Event Type Constants ────────────────────────────────────────────────

export const PURCHASE_EVENT_TYPES = [
	"free_credit_granted",
	"portrait_unlocked",
	"credit_purchased",
	"credit_consumed",
	"extended_conversation_unlocked",
	"portrait_refunded",
	"credit_refunded",
	"extended_conversation_refunded",
] as const;

export type PurchaseEventType = (typeof PURCHASE_EVENT_TYPES)[number];

// ─── Entity & Capability Types ───────────────────────────────────────────

export interface PurchaseEvent {
	readonly id: string;
	readonly userId: string;
	readonly eventType: PurchaseEventType;
	readonly polarCheckoutId: string | null;
	readonly polarProductId: string | null;
	readonly amountCents: number | null;
	readonly currency: string | null;
	readonly metadata: unknown;
	readonly createdAt: Date;
}

export interface UserCapabilities {
	readonly availableCredits: number;
	readonly hasFullPortrait: boolean;
	readonly hasExtendedConversation: boolean;
}

// ─── Metadata Schema (safe jsonb parsing) ────────────────────────────────

export const PurchaseEventMetadata = S.Struct({
	units: S.optionalWith(S.Number.pipe(S.int(), S.positive()), { default: () => 1 }),
	invitationId: S.optional(S.String),
});

// ─── Polar Webhook Event (Story 13.2) ───────────────────────────────────

export interface PolarWebhookEvent {
	readonly type: string;
	readonly data: {
		readonly id: string;
		readonly productId: string | null;
		readonly checkoutId: string;
		readonly amount: number;
		readonly currency: string;
		readonly customerId?: string;
		readonly metadata?: Record<string, unknown>;
	};
}

// ─── Metadata Schema (safe jsonb parsing) ────────────────────────────────

/**
 * Safely parse jsonb metadata with fallback to { units: 1 } on any failure.
 */
export const parseMetadata = (raw: unknown): { units: number; invitationId?: string } => {
	try {
		const parsed = S.decodeUnknownSync(PurchaseEventMetadata)(raw);
		return {
			units: parsed.units,
			...(parsed.invitationId != null ? { invitationId: parsed.invitationId } : {}),
		};
	} catch {
		return { units: 1 };
	}
};
