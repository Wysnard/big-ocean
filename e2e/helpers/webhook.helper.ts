/**
 * Polar Webhook Simulation Helper
 *
 * Signs payloads with the canonical webhook secret and POSTs to the
 * Better Auth Polar webhook endpoint (/api/auth/polar/webhooks).
 *
 * The Better Auth webhooks() plugin calls validateEvent() from
 * @polar-sh/sdk/webhooks, which:
 *   1. base64-encodes the raw secret → passes to standardwebhooks Webhook constructor
 *   2. Verifies HMAC signature via standardwebhooks
 *   3. Parses payload against strict Zod schema (all Polar fields required)
 *
 * This helper replicates the same encoding and provides a complete
 * order.paid payload that passes schema validation.
 */

import type { APIRequestContext } from "@playwright/test";
import { Webhook } from "standardwebhooks";
import { POLAR_CONFIG } from "../e2e-env.js";

export interface SendPolarWebhookInput {
	productId: string;
	externalUserId: string;
	totalAmount?: number;
	currency?: string;
}

/**
 * Build a complete order.paid payload that satisfies the Polar SDK's
 * strict Zod schema validation (WebhookOrderPaidPayload$inboundSchema).
 */
function buildOrderPaidPayload(input: SendPolarWebhookInput) {
	const now = new Date().toISOString();
	const orderId = crypto.randomUUID();
	const checkoutId = crypto.randomUUID();
	const customerId = crypto.randomUUID();
	const orgId = "00000000-0000-0000-0000-000000000066";
	const priceId = crypto.randomUUID();
	const amount = input.totalAmount ?? 500;
	const currency = input.currency ?? "usd";

	return {
		type: "order.paid" as const,
		timestamp: now,
		data: {
			id: orderId,
			created_at: now,
			modified_at: now,
			status: "paid",
			paid: true,
			subtotal_amount: amount,
			discount_amount: 0,
			net_amount: amount,
			tax_amount: 0,
			total_amount: amount,
			applied_balance_amount: 0,
			due_amount: amount,
			refunded_amount: 0,
			refunded_tax_amount: 0,
			currency,
			billing_reason: "purchase",
			billing_name: "E2E Test User",
			billing_address: { country: "US" },
			invoice_number: `INV-E2E-${Date.now()}`,
			is_invoice_generated: false,
			customer_id: customerId,
			product_id: input.productId,
			discount_id: null,
			subscription_id: null,
			checkout_id: checkoutId,
			metadata: {},
			platform_fee_amount: 0,
			platform_fee_currency: currency,
			description: "E2E test order",
			customer: {
				id: customerId,
				platform: "polar",
				created_at: now,
				modified_at: now,
				email: "e2e-webhook@test.com",
				email_verified: true,
				name: "E2E Test User",
				billing_address: { country: "US" },
				tax_id: null,
				organization_id: orgId,
				avatar_url: "https://example.com/avatar.png",
				external_id: input.externalUserId,
				metadata: {},
				deleted: false,
				deleted_at: null,
			},
			product: {
				id: input.productId,
				created_at: now,
				modified_at: now,
				name: "E2E Product",
				description: "E2E test product",
				is_recurring: false,
				is_archived: false,
				organization_id: orgId,
				visibility: "public",
				recurring_interval: "month",
				recurring_interval_count: 0,
				trial_interval: "month",
				trial_interval_count: 0,
				prices: [
					{
						id: priceId,
						created_at: now,
						modified_at: now,
						is_archived: false,
						product_id: input.productId,
						type: "one_time",
						amount_type: "fixed",
						price_currency: currency,
						price_amount: amount,
					},
				],
				benefits: [],
				medias: [],
				metadata: {},
			},
			discount: null,
			subscription: null,
			items: [
				{
					id: crypto.randomUUID(),
					created_at: now,
					modified_at: now,
					amount,
					tax_amount: 0,
					currency,
					label: "E2E Product",
					proration: false,
					is_prorated: false,
					product_price_id: priceId,
				},
			],
		},
	};
}

/**
 * Simulate a Polar order.paid webhook by signing a complete payload
 * and POSTing to the Better Auth Polar webhook endpoint.
 */
export async function sendPolarWebhook(
	apiContext: APIRequestContext,
	input: SendPolarWebhookInput,
) {
	const event = buildOrderPaidPayload(input);
	const payload = JSON.stringify(event);

	// IMPORTANT: @polar-sh/sdk's validateEvent() does:
	//   Buffer.from(secret, "utf-8").toString("base64") → new Webhook(base64Secret)
	// We must replicate this encoding to produce matching signatures.
	const base64Secret = Buffer.from(POLAR_CONFIG.webhookSecret, "utf-8").toString("base64");
	const wh = new Webhook(base64Secret);
	const msgId = `msg_e2e_${crypto.randomUUID()}`;
	const timestamp = new Date();
	const signature = wh.sign(msgId, timestamp, payload);

	const response = await apiContext.post("/api/auth/polar/webhooks", {
		data: payload,
		headers: {
			"content-type": "application/json",
			"webhook-id": msgId,
			"webhook-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
			"webhook-signature": signature,
		},
	});

	if (!response.ok()) {
		throw new Error(`Polar webhook simulation failed: ${response.status()} ${await response.text()}`);
	}

	return { response, checkoutId: event.data.checkout_id };
}
