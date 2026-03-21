/**
 * Payment Gateway Mock Repository
 *
 * Mock implementation for E2E testing that returns deterministic
 * webhook events without calling the real Polar SDK.
 */

import { WebhookVerificationError } from "@workspace/domain/errors/http.errors";
import { PaymentGatewayRepository } from "@workspace/domain/repositories/payment-gateway.repository";
import type { PolarWebhookEvent } from "@workspace/domain/types/purchase.types";
import { Effect, Layer } from "effect";

/**
 * Payment Gateway Mock Repository Layer
 *
 * Skips HMAC verification and returns a deterministic webhook event
 * parsed from the raw body. For E2E tests, the test sends a JSON body
 * directly — this mock trusts it and returns the parsed event.
 */
export const PaymentGatewayMockRepositoryLive = Layer.succeed(
	PaymentGatewayRepository,
	PaymentGatewayRepository.of({
		verifyWebhook: (rawBody: string, _headers: Record<string, string>) =>
			Effect.try({
				try: () => {
					const parsed = JSON.parse(rawBody) as PolarWebhookEvent;
					console.log(`[E2E Mock] Polar webhook verified type=${parsed.type}`);
					return parsed;
				},
				catch: (error) =>
					new WebhookVerificationError({
						message: `Mock webhook parse failed: ${error instanceof Error ? error.message : String(error)}`,
					}),
			}),
	}),
);
