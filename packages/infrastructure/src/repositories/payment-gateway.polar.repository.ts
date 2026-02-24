/**
 * Payment Gateway Polar Implementation (Story 13.2)
 *
 * Uses @polar-sh/sdk validateEvent for HMAC webhook verification.
 * Maps Polar SDK Order type to our domain PolarWebhookEvent.
 */

import {
	WebhookVerificationError as PolarWebhookVerificationError,
	validateEvent,
} from "@polar-sh/sdk/webhooks.js";
import { AppConfig } from "@workspace/domain/config/app-config";
import { WebhookVerificationError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { PaymentGatewayRepository } from "@workspace/domain/repositories/payment-gateway.repository";
import type { PolarWebhookEvent } from "@workspace/domain/types/purchase.types";
import { Effect, Layer, Redacted } from "effect";

export const PaymentGatewayPolarRepositoryLive = Layer.effect(
	PaymentGatewayRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		return PaymentGatewayRepository.of({
			verifyWebhook: (rawBody, headers) =>
				Effect.try({
					try: () => {
						const event = validateEvent(rawBody, headers, Redacted.value(config.polarWebhookSecret));

						// We only process order events — extract common fields
						const data = event.data as Record<string, unknown>;
						return {
							type: event.type as string,
							data: {
								id: data.id as string,
								productId: data.productId as string | null,
								checkoutId: (data.checkoutId as string | null) ?? (data.id as string),
								amount: (data.totalAmount as number) ?? 0,
								currency: (data.currency as string) ?? "usd",
								customerId: data.customerId as string | undefined,
								metadata: data.metadata as Record<string, unknown> | undefined,
							},
						} satisfies PolarWebhookEvent;
					},
					catch: (error) => {
						logger.error("Webhook verification failed", { error: String(error) });
						return new WebhookVerificationError({
							message:
								error instanceof PolarWebhookVerificationError
									? error.message
									: "Webhook verification failed",
						});
					},
				}),
		});
	}),
);
