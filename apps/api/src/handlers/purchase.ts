/**
 * Purchase Presenters (HTTP Handlers) — Story 13.2
 *
 * Two handler groups:
 * - PurchaseWebhookGroupLive: Public webhook (no auth) — verifies HMAC, delegates to use-case
 * - PurchaseGroupLive: Authenticated — verify purchase endpoint
 */

import { HttpApiBuilder, HttpServerRequest } from "@effect/platform";
import { BigOceanApi, DatabaseError, WebhookVerificationError } from "@workspace/contracts";
import {
	CurrentUser,
	PaymentGatewayRepository,
	PurchaseEventRepository,
	UnknownProductError,
} from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Effect } from "effect";
import { processPurchase } from "../use-cases/process-purchase.use-case";

/**
 * Webhook Handler Group (public, no auth)
 */
export const PurchaseWebhookGroupLive = HttpApiBuilder.group(
	BigOceanApi,
	"purchaseWebhook",
	(handlers) =>
		Effect.gen(function* () {
			const logger = yield* LoggerRepository;

			return handlers.handle("polarWebhook", () =>
				Effect.gen(function* () {
					const gateway = yield* PaymentGatewayRepository;
					const request = yield* HttpServerRequest.HttpServerRequest;

					// Read raw body for HMAC verification (must be exact bytes, not parsed JSON)
					const rawBody = yield* request.text.pipe(
						Effect.catchTag("RequestError", (err) =>
							Effect.fail(
								new WebhookVerificationError({ message: `Failed to read request body: ${err.message}` }),
							),
						),
					);

					const headers = Object.fromEntries(
						Object.entries(request.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
					) as Record<string, string>;

					// 1. Verify webhook HMAC
					const event = yield* gateway.verifyWebhook(rawBody, headers);

					// 2. Only handle order.created (payment confirmed)
					if (event.type !== "order.created") {
						return { received: true };
					}

					// 3. Resolve userId from checkout metadata
					const userId = event.data.metadata?.userId as string | undefined;
					if (!userId) {
						logger.warn("Webhook missing userId in metadata", {
							checkoutId: event.data.checkoutId,
						});
						return { received: true };
					}

					// 4. Process purchase — delegate to use-case
					yield* processPurchase({
						userId,
						productId: event.data.productId ?? "",
						checkoutId: event.data.checkoutId,
						amountCents: event.data.amount,
						currency: event.data.currency,
					}).pipe(
						Effect.catchTag("DuplicateCheckoutError", () => Effect.succeed(undefined)),
						Effect.catchTag("UnknownProductError", (err: UnknownProductError) =>
							Effect.sync(() => {
								logger.warn("Unknown product in webhook", {
									productId: err.productId,
								});
							}),
						),
					);

					return { received: true };
				}),
			);
		}),
);

/**
 * Purchase Handler Group (authenticated)
 */
export const PurchaseGroupLive = HttpApiBuilder.group(BigOceanApi, "purchase", (handlers) =>
	Effect.gen(function* () {
		return handlers.handle("verifyPurchase", ({ urlParams }) =>
			Effect.gen(function* () {
				const userId = yield* CurrentUser;
				if (!userId) {
					return { verified: false };
				}

				const purchaseRepo = yield* PurchaseEventRepository;
				const events = yield* purchaseRepo
					.getEventsByUserId(userId)
					.pipe(Effect.catchTag("DatabaseError", () => Effect.succeed([] as never[])));
				const matchingEvent = events.find(
					(e: { polarCheckoutId: string | null }) => e.polarCheckoutId === urlParams.checkoutId,
				);

				if (!matchingEvent) {
					return { verified: false };
				}

				const capabilities = yield* purchaseRepo
					.getCapabilities(userId)
					.pipe(
						Effect.catchTag("DatabaseError", () =>
							Effect.fail(new DatabaseError({ message: "Failed to get capabilities" })),
						),
					);

				return {
					verified: true,
					capabilities: {
						availableCredits: capabilities.availableCredits,
						hasFullPortrait: capabilities.hasFullPortrait,
						hasExtendedConversation: capabilities.hasExtendedConversation,
					},
				};
			}),
		);
	}),
);
