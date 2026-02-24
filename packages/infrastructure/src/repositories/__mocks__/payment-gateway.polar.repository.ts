/**
 * Mock: payment-gateway.polar.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/payment-gateway.polar.repository')
 */

import { WebhookVerificationError } from "@workspace/domain/errors/http.errors";
import { PaymentGatewayRepository } from "@workspace/domain/repositories/payment-gateway.repository";
import type { PolarWebhookEvent } from "@workspace/domain/types/purchase.types";
import { Effect, Layer } from "effect";

let nextVerifyResult: PolarWebhookEvent | WebhookVerificationError | null = null;

/** Override the next verifyWebhook result for test control. */
export const _setNextVerifyResult = (result: PolarWebhookEvent | WebhookVerificationError) => {
	nextVerifyResult = result;
};

/** Clear mock state between tests. */
export const _resetMockState = () => {
	nextVerifyResult = null;
};

const defaultEvent: PolarWebhookEvent = {
	type: "order.created",
	data: {
		id: "order_mock_001",
		productId: "polar_product_portrait",
		checkoutId: "checkout_mock_001",
		amount: 999,
		currency: "usd",
		customerId: "cust_mock_001",
		metadata: { userId: "user_123" },
	},
};

export const PaymentGatewayPolarRepositoryLive = Layer.succeed(
	PaymentGatewayRepository,
	PaymentGatewayRepository.of({
		verifyWebhook: (_rawBody, _headers) => {
			if (nextVerifyResult instanceof WebhookVerificationError) {
				const error = nextVerifyResult;
				nextVerifyResult = null;
				return Effect.fail(error);
			}
			const event = nextVerifyResult ?? defaultEvent;
			nextVerifyResult = null;
			return Effect.succeed(event);
		},
	}),
);
