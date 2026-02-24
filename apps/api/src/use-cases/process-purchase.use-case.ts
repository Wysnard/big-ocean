/**
 * Process Purchase Use Case (Story 13.2)
 *
 * Effect-based use-case that maps a Polar webhook order to a purchase event.
 * The actual webhook handler (createOnOrderPaidHandler) uses plain Drizzle
 * in Better Auth's async context; this use-case exists for unit-testable
 * business logic with Effect's DI.
 *
 * Dependencies: PurchaseEventRepository, AppConfig
 */

import type { PurchaseEventType } from "@workspace/domain";
import { AppConfig, PurchaseEventRepository, UnknownProductError } from "@workspace/domain";
import { Effect } from "effect";

export interface ProcessPurchaseInput {
	readonly userId: string;
	readonly productId: string;
	readonly checkoutId: string;
	readonly amountCents: number;
	readonly currency: string;
}

/**
 * Maps a Polar product ID to our internal event type using AppConfig.
 * Returns null for unknown products.
 */
const mapProductToEventType = (
	productId: string,
	config: { readonly [K in `polarProduct${string}`]: string },
): PurchaseEventType | null => {
	if (productId === config.polarProductPortraitUnlock) return "portrait_unlocked";
	if (productId === config.polarProductRelationshipSingle) return "credit_purchased";
	if (productId === config.polarProductRelationship5Pack) return "credit_purchased";
	if (productId === config.polarProductExtendedConversation) return "extended_conversation_unlocked";
	return null;
};

/**
 * Process Purchase Use Case
 *
 * 1. Reads AppConfig to map product ID → event type
 * 2. Fails with UnknownProductError if product not recognized
 * 3. Inserts purchase event via PurchaseEventRepository
 * 4. DuplicateCheckoutError propagates unchanged (caller handles)
 */
export const processPurchase = (input: ProcessPurchaseInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const purchaseRepo = yield* PurchaseEventRepository;

		const eventType = mapProductToEventType(input.productId, config);
		if (!eventType) {
			return yield* Effect.fail(
				new UnknownProductError({
					productId: input.productId,
					message: `Unknown Polar product: ${input.productId}`,
				}),
			);
		}

		const is5Pack = input.productId === config.polarProductRelationship5Pack;

		return yield* purchaseRepo.insertEvent({
			userId: input.userId,
			eventType,
			polarCheckoutId: input.checkoutId,
			polarProductId: input.productId,
			amountCents: input.amountCents,
			currency: input.currency,
			metadata: is5Pack ? { units: 5 } : null,
		});
	});
