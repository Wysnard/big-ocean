import { describe, expect, it } from "vitest";
import type { PurchaseEvent } from "../../types/purchase.types";
import { parseMetadata } from "../../types/purchase.types";
import {
	deriveCapabilities,
	getSubscribedSinceForCurrentSubscription,
	getSubscriptionStatus,
	hasPortraitForResult,
	isEntitledTo,
} from "../derive-capabilities";

const makeEvent = (
	overrides: Partial<PurchaseEvent> & Pick<PurchaseEvent, "eventType">,
): PurchaseEvent => ({
	id: crypto.randomUUID(),
	userId: "user-1",
	polarCheckoutId: null,
	polarSubscriptionId: null,
	polarProductId: null,
	amountCents: null,
	currency: null,
	metadata: null,
	assessmentResultId: null,
	createdAt: new Date(),
	...overrides,
});

describe("deriveCapabilities", () => {
	it("returns zero capabilities for fresh user (no events)", () => {
		const result = deriveCapabilities([]);
		expect(result).toEqual({
			availableCredits: 0,
			hasFullPortrait: false,
			hasExtendedConversation: false,
		});
	});

	// ─── Credit calculations ──────────────────────────────────────────

	it("grants 1 credit for free_credit_granted", () => {
		const result = deriveCapabilities([makeEvent({ eventType: "free_credit_granted" })]);
		expect(result.availableCredits).toBe(1);
	});

	it("grants units from credit_purchased metadata", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "credit_purchased", metadata: { units: 5 } }),
		]);
		expect(result.availableCredits).toBe(5);
	});

	it("defaults to 1 credit when credit_purchased has no metadata", () => {
		const result = deriveCapabilities([makeEvent({ eventType: "credit_purchased" })]);
		expect(result.availableCredits).toBe(1);
	});

	it("subtracts credits for credit_consumed events", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "free_credit_granted" }),
			makeEvent({ eventType: "free_credit_granted" }),
			makeEvent({ eventType: "credit_consumed" }),
		]);
		expect(result.availableCredits).toBe(1);
	});

	it("floors credits at 0 (more consumed than purchased)", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "free_credit_granted" }),
			makeEvent({ eventType: "credit_consumed" }),
			makeEvent({ eventType: "credit_consumed" }),
		]);
		expect(result.availableCredits).toBe(0);
	});

	it("reduces credits by units for credit_refunded", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "credit_purchased", metadata: { units: 5 } }),
			makeEvent({ eventType: "credit_refunded", metadata: { units: 3 } }),
		]);
		expect(result.availableCredits).toBe(2);
	});

	// ─── Portrait access ──────────────────────────────────────────────

	it("grants portrait access for portrait_unlocked", () => {
		const result = deriveCapabilities([makeEvent({ eventType: "portrait_unlocked" })]);
		expect(result.hasFullPortrait).toBe(true);
	});

	it("revokes portrait access after portrait_refunded", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "portrait_unlocked" }),
			makeEvent({ eventType: "portrait_refunded" }),
		]);
		expect(result.hasFullPortrait).toBe(false);
	});

	it("keeps portrait access separate from extended_conversation_unlocked", () => {
		const result = deriveCapabilities([makeEvent({ eventType: "extended_conversation_unlocked" })]);
		expect(result.hasFullPortrait).toBe(false);
		expect(result.hasExtendedConversation).toBe(true);
	});

	it("revokes both capabilities when extended_conversation_refunded (bundle revocation)", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "extended_conversation_unlocked" }),
			makeEvent({ eventType: "extended_conversation_refunded" }),
		]);
		expect(result.hasFullPortrait).toBe(false);
		expect(result.hasExtendedConversation).toBe(false);
	});

	it("preserves standalone portrait when bundle is refunded", () => {
		const result = deriveCapabilities([
			makeEvent({ eventType: "portrait_unlocked" }),
			makeEvent({ eventType: "extended_conversation_unlocked" }),
			makeEvent({ eventType: "extended_conversation_refunded" }),
		]);
		expect(result.hasFullPortrait).toBe(true);
		expect(result.hasExtendedConversation).toBe(false);
	});
});

describe("hasPortraitForResult", () => {
	it("returns true for portrait_unlocked on the matching result", () => {
		const result = hasPortraitForResult(
			[makeEvent({ eventType: "portrait_unlocked", assessmentResultId: "result-1" })],
			"result-1",
		);
		expect(result).toBe(true);
	});

	it("returns false for extended_conversation_unlocked on the matching result", () => {
		const result = hasPortraitForResult(
			[
				makeEvent({
					eventType: "extended_conversation_unlocked",
					assessmentResultId: "result-1",
				}),
			],
			"result-1",
		);
		expect(result).toBe(false);
	});

	it("returns false when a portrait purchase was refunded for the matching result", () => {
		const result = hasPortraitForResult(
			[
				makeEvent({ eventType: "portrait_unlocked", assessmentResultId: "result-1" }),
				makeEvent({ eventType: "portrait_refunded", assessmentResultId: "result-1" }),
			],
			"result-1",
		);
		expect(result).toBe(false);
	});
});

describe("getSubscriptionStatus", () => {
	it("returns none when there are no subscription events", () => {
		expect(getSubscriptionStatus([makeEvent({ eventType: "free_credit_granted" })])).toBe("none");
	});

	it("returns active after subscription_started", () => {
		expect(
			getSubscriptionStatus([
				makeEvent({ eventType: "subscription_started", polarSubscriptionId: "sub-1" }),
			]),
		).toBe("active");
	});

	it("returns cancelled_active after started then cancelled", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-01-02T00:00:00Z");
		expect(
			getSubscriptionStatus([
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-1",
					createdAt: t0,
				}),
				makeEvent({
					eventType: "subscription_cancelled",
					polarSubscriptionId: "sub-1",
					createdAt: t1,
				}),
			]),
		).toBe("cancelled_active");
	});

	it("returns expired after subscription_expired", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-01-02T00:00:00Z");
		const t2 = new Date("2026-01-03T00:00:00Z");
		expect(
			getSubscriptionStatus([
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-1",
					createdAt: t0,
				}),
				makeEvent({
					eventType: "subscription_cancelled",
					polarSubscriptionId: "sub-1",
					createdAt: t1,
				}),
				makeEvent({
					eventType: "subscription_expired",
					polarSubscriptionId: "sub-1",
					createdAt: t2,
				}),
			]),
		).toBe("expired");
	});

	it("sorts out-of-order rows by createdAt", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-01-02T00:00:00Z");
		expect(
			getSubscriptionStatus([
				makeEvent({
					eventType: "subscription_cancelled",
					polarSubscriptionId: "sub-1",
					createdAt: t1,
				}),
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-1",
					createdAt: t0,
				}),
			]),
		).toBe("cancelled_active");
	});

	it("returns active after renewal following started", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-02-01T00:00:00Z");
		expect(
			getSubscriptionStatus([
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-1",
					createdAt: t0,
				}),
				makeEvent({
					eventType: "subscription_renewed",
					polarSubscriptionId: "sub-1",
					createdAt: t1,
				}),
			]),
		).toBe("active");
	});

	it("handles the full started-renewed-cancelled-expired lifecycle", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-02-01T00:00:00Z");
		const t2 = new Date("2026-02-10T00:00:00Z");
		const t3 = new Date("2026-03-01T00:00:00Z");
		expect(
			getSubscriptionStatus([
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-1",
					createdAt: t0,
				}),
				makeEvent({
					eventType: "subscription_renewed",
					polarSubscriptionId: "sub-1",
					createdAt: t1,
				}),
				makeEvent({
					eventType: "subscription_cancelled",
					polarSubscriptionId: "sub-1",
					createdAt: t2,
				}),
				makeEvent({
					eventType: "subscription_expired",
					polarSubscriptionId: "sub-1",
					createdAt: t3,
				}),
			]),
		).toBe("expired");
	});

	it("ignores expired events for an older subscription after a newer subscription starts", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-02-01T00:00:00Z");
		const t2 = new Date("2026-02-02T00:00:00Z");
		expect(
			getSubscriptionStatus([
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-old",
					createdAt: t0,
				}),
				makeEvent({
					eventType: "subscription_started",
					polarSubscriptionId: "sub-new",
					createdAt: t1,
				}),
				makeEvent({
					eventType: "subscription_expired",
					polarSubscriptionId: "sub-old",
					createdAt: t2,
				}),
			]),
		).toBe("active");
	});
});

describe("getSubscribedSinceForCurrentSubscription", () => {
	it("returns started-at for the current subscription id", () => {
		const startedAt = new Date("2026-03-01T12:00:00Z");
		const result = getSubscribedSinceForCurrentSubscription([
			makeEvent({
				eventType: "subscription_started",
				polarSubscriptionId: "sub-1",
				createdAt: startedAt,
			}),
		]);
		expect(result?.toISOString()).toBe(startedAt.toISOString());
	});

	it("returns null when there is no subscription lifecycle", () => {
		expect(getSubscribedSinceForCurrentSubscription([])).toBeNull();
	});
});

describe("isEntitledTo", () => {
	it("grants conversation_extension for active subscription", () => {
		expect(
			isEntitledTo(
				[makeEvent({ eventType: "subscription_started", polarSubscriptionId: "sub-1" })],
				"conversation_extension",
			),
		).toBe(true);
	});

	it("grants conversation_extension for cancelled_active", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-01-02T00:00:00Z");
		expect(
			isEntitledTo(
				[
					makeEvent({
						eventType: "subscription_started",
						polarSubscriptionId: "sub-1",
						createdAt: t0,
					}),
					makeEvent({
						eventType: "subscription_cancelled",
						polarSubscriptionId: "sub-1",
						createdAt: t1,
					}),
				],
				"conversation_extension",
			),
		).toBe(true);
	});

	it("denies conversation_extension when expired without legacy unlock", () => {
		const t0 = new Date("2026-01-01T00:00:00Z");
		const t1 = new Date("2026-01-02T00:00:00Z");
		expect(
			isEntitledTo(
				[
					makeEvent({
						eventType: "subscription_started",
						polarSubscriptionId: "sub-1",
						createdAt: t0,
					}),
					makeEvent({
						eventType: "subscription_expired",
						polarSubscriptionId: "sub-1",
						createdAt: t1,
					}),
				],
				"conversation_extension",
			),
		).toBe(false);
	});

	it("allows legacy extended_conversation_unlocked", () => {
		expect(
			isEntitledTo(
				[makeEvent({ eventType: "extended_conversation_unlocked" })],
				"conversation_extension",
			),
		).toBe(true);
	});
});

describe("parseMetadata", () => {
	it("parses valid metadata with units", () => {
		expect(parseMetadata({ units: 5 })).toEqual({ units: 5 });
	});

	it("defaults units to 1 when not provided", () => {
		expect(parseMetadata({})).toEqual({ units: 1 });
	});

	it("defaults to { units: 1 } for null metadata", () => {
		expect(parseMetadata(null)).toEqual({ units: 1 });
	});

	it("defaults to { units: 1 } for non-object metadata", () => {
		expect(parseMetadata("bad")).toEqual({ units: 1 });
	});

	it("defaults to { units: 1 } for non-numeric units", () => {
		expect(parseMetadata({ units: "not-a-number" })).toEqual({ units: 1 });
	});

	it("preserves invitationId when present", () => {
		expect(parseMetadata({ units: 2, invitationId: "inv-123" })).toEqual({
			units: 2,
			invitationId: "inv-123",
		});
	});
});
