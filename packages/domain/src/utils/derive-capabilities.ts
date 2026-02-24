/**
 * Capability Derivation (Story 13.1)
 *
 * Pure function that computes user capabilities from an append-only event log.
 * No mutable counters — all state derived from events.
 */

import type { PurchaseEvent, UserCapabilities } from "../types/purchase.types";
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
 * Portrait access (per-type refund matching):
 *   hasFullPortrait = (portrait_unlocked AND NOT portrait_refunded)
 *                     OR (extended_conversation_unlocked AND NOT extended_conversation_refunded)
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
		}
	}

	return {
		availableCredits: Math.max(0, credits),
		hasFullPortrait:
			(hasPortraitUnlock && !hasPortraitRefund) || (hasExtendedUnlock && !hasExtendedRefund),
		hasExtendedConversation: hasExtendedUnlock && !hasExtendedRefund,
	};
};
