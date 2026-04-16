/**
 * Capability Derivation (Story 13.1)
 *
 * Pure function that computes user capabilities from an append-only event log.
 * No mutable counters — all state derived from events.
 */

import type {
	EntitlementFeature,
	PurchaseEvent,
	PurchaseEventType,
	SubscriptionStatus,
	UserCapabilities,
} from "../types/purchase.types";
import { parseMetadata } from "../types/purchase.types";

/**
 * Derive user capabilities from purchase events.
 *
 * Credit formula:
 *   +1 per free_credit_granted
 *   +units per credit_purchased (from metadata.units, default 1)
 *   −1 per credit_consumed
 *   −units per credit_refunded (from metadata.units, default 1)
 *   Floor at 0
 *
 * Portrait access:
 *   hasFullPortrait = portrait_unlocked AND NOT portrait_refunded
 *
 * Extended conversation:
 *   hasExtendedConversation = extended_conversation_unlocked AND NOT extended_conversation_refunded
 */
export const deriveCapabilities = (events: PurchaseEvent[]): UserCapabilities => {
	let credits = 0;
	let hasPortraitUnlock = false;
	let hasExtendedUnlock = false;
	let hasPortraitRefund = false;
	let hasExtendedRefund = false;

	for (const event of events) {
		switch (event.eventType) {
			case "free_credit_granted":
				credits += 1;
				break;
			case "credit_purchased":
				credits += parseMetadata(event.metadata).units;
				break;
			case "credit_consumed":
				credits -= 1;
				break;
			case "credit_refunded":
				credits -= parseMetadata(event.metadata).units;
				break;
			case "portrait_unlocked":
				hasPortraitUnlock = true;
				break;
			case "extended_conversation_unlocked":
				hasExtendedUnlock = true;
				break;
			case "portrait_refunded":
				hasPortraitRefund = true;
				break;
			case "extended_conversation_refunded":
				hasExtendedRefund = true;
				break;
			case "subscription_started":
			case "subscription_renewed":
			case "subscription_cancelled":
			case "subscription_expired":
				break;
		}
	}

	return {
		availableCredits: Math.max(0, credits),
		hasFullPortrait: hasPortraitUnlock && !hasPortraitRefund,
		hasExtendedConversation: hasExtendedUnlock && !hasExtendedRefund,
	};
};

/**
 * Check if a portrait purchase exists for a specific assessment result.
 * Result-scoped — one purchase covers one portrait for one result.
 *
 * Returns true if a portrait_unlocked event exists for this result, with no
 * matching portrait_refunded event.
 */
export const hasPortraitForResult = (
	events: PurchaseEvent[],
	assessmentResultId: string,
): boolean => {
	const hasUnlock = events.some(
		(e) => e.eventType === "portrait_unlocked" && e.assessmentResultId === assessmentResultId,
	);
	const hasRefund = events.some(
		(e) => e.eventType === "portrait_refunded" && e.assessmentResultId === assessmentResultId,
	);
	return hasUnlock && !hasRefund;
};

/**
 * Sort purchase events by `createdAt` ascending (append-only log order).
 * Callers should pass pre-sorted lists from the repository; this defends against mistakes.
 */
const sortEventsChronologically = (events: PurchaseEvent[]): PurchaseEvent[] =>
	[...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

const SUBSCRIPTION_LIFECYCLE_EVENT_TYPES = new Set<PurchaseEventType>([
	"subscription_started",
	"subscription_renewed",
	"subscription_cancelled",
	"subscription_expired",
]);

const isSubscriptionLifecycleEvent = (eventType: PurchaseEventType): boolean =>
	SUBSCRIPTION_LIFECYCLE_EVENT_TYPES.has(eventType);

/**
 * Pick the subscription lifecycle we should honor for current entitlements.
 *
 * We intentionally do NOT reduce across every historical `polarSubscriptionId`, because a user can
 * resubscribe and old terminal events for a previous subscription must not override a newer one.
 *
 * Selection rule:
 * - Prefer the most recent non-terminal lifecycle anchor (`started`, `renewed`, `cancelled`).
 * - If none exist, fall back to the most recent subscription lifecycle event.
 */
const getCurrentSubscriptionId = (events: PurchaseEvent[]): string | null => {
	const sorted = sortEventsChronologically(events);
	const lifecycleEvents = sorted.filter(
		(event) => isSubscriptionLifecycleEvent(event.eventType) && event.polarSubscriptionId !== null,
	);

	for (let index = lifecycleEvents.length - 1; index >= 0; index -= 1) {
		const event = lifecycleEvents[index];
		if (
			event?.eventType === "subscription_started" ||
			event?.eventType === "subscription_renewed" ||
			event?.eventType === "subscription_cancelled"
		) {
			return event.polarSubscriptionId;
		}
	}

	return lifecycleEvents.at(-1)?.polarSubscriptionId ?? null;
};

/**
 * Derive subscription access phase from subscription_* purchase events only.
 *
 * Rules (apply in chronological `createdAt` order for the currently selected `polarSubscriptionId`):
 * - `subscription_started` → `active` (new paid subscription lifecycle anchor).
 * - `subscription_renewed` → `active`.
 * - `subscription_cancelled` → `cancelled_active` when coming from `active` or `cancelled_active`
 *   (user scheduled cancel; access continues until period end — Polar `subscription.canceled`).
 * - `subscription_expired` → `expired` (access ended — mapped from Polar `subscription.revoked` or
 *   equivalent end-of-access signals in the webhook layer).
 */
export const getSubscriptionStatus = (events: PurchaseEvent[]): SubscriptionStatus => {
	const sorted = sortEventsChronologically(events);
	const currentSubscriptionId = getCurrentSubscriptionId(sorted);
	if (currentSubscriptionId === null) return "none";

	const relevantEvents = sorted.filter(
		(event) =>
			isSubscriptionLifecycleEvent(event.eventType) &&
			event.polarSubscriptionId === currentSubscriptionId,
	);
	let status: SubscriptionStatus = "none";
	for (const e of relevantEvents) {
		switch (e.eventType) {
			case "subscription_started":
				status = "active";
				break;
			case "subscription_renewed":
				status = "active";
				break;
			case "subscription_cancelled":
				if (status === "active" || status === "cancelled_active") status = "cancelled_active";
				break;
			case "subscription_expired":
				status = "expired";
				break;
			default:
				break;
		}
	}
	return status;
};

/**
 * Feature entitlements from purchase events (Story 8.1).
 *
 * `conversation_extension`: true when subscription phase is `active` or `cancelled_active`,
 * **or** legacy `extended_conversation_unlocked` (minus refund) still grants access until Story 8.3
 * migrates callers fully off one-time unlocks.
 */
export const isEntitledTo = (events: PurchaseEvent[], feature: EntitlementFeature): boolean => {
	if (feature === "conversation_extension") {
		const phase = getSubscriptionStatus(events);
		if (phase === "active" || phase === "cancelled_active") return true;
		return deriveCapabilities(events).hasExtendedConversation;
	}
	return false;
};

/**
 * First `subscription_started` timestamp for the user's current subscription lineage (Story 8.2).
 * Returns null when there is no current subscription anchor.
 */
export const getSubscribedSinceForCurrentSubscription = (events: PurchaseEvent[]): Date | null => {
	const sorted = sortEventsChronologically(events);
	const currentSubscriptionId = getCurrentSubscriptionId(sorted);
	if (currentSubscriptionId === null) return null;
	const started = sorted.find(
		(e) => e.eventType === "subscription_started" && e.polarSubscriptionId === currentSubscriptionId,
	);
	return started?.createdAt ?? null;
};
