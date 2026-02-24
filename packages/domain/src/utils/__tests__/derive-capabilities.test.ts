import { describe, expect, it } from "vitest";
import type { PurchaseEvent } from "../../types/purchase.types";
import { parseMetadata } from "../../types/purchase.types";
import { deriveCapabilities } from "../derive-capabilities";

const makeEvent = (
	overrides: Partial<PurchaseEvent> & Pick<PurchaseEvent, "eventType">,
): PurchaseEvent => ({
	id: crypto.randomUUID(),
	userId: "user-1",
	polarCheckoutId: null,
	polarProductId: null,
	amountCents: null,
	currency: null,
	metadata: null,
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

	it("grants portrait access via extended_conversation_unlocked (bundle)", () => {
		const result = deriveCapabilities([makeEvent({ eventType: "extended_conversation_unlocked" })]);
		expect(result.hasFullPortrait).toBe(true);
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
		// standalone portrait_unlocked survives bundle refund (per Task 7 test case)
		expect(result.hasFullPortrait).toBe(true);
		expect(result.hasExtendedConversation).toBe(false);
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
