/**
 * Process Purchase Use Case (Story 13.2, extended Story 3.4)
 *
 * Effect-based use-case that maps a Polar webhook order to a purchase event.
 * The actual webhook handler (createOnOrderPaidHandler) uses plain Drizzle
 * in Better Auth's async context; this use-case exists for unit-testable
 * business logic with Effect's DI.
 *
 * Portrait generation is owned by Assessment Finalization (queue + worker), not purchase flows.
 * `portrait_unlocked` events may still be recorded for historical capability derivation.
 *
 * Story 3.4 adds:
 * - Free credit grant on first portrait purchase (FR33)
 *
 * Dependencies: PurchaseEventRepository, AppConfig
 */

import type { PurchaseEventType } from "@workspace/domain";
import {
	AppConfig,
	LoggerRepository,
	PurchaseEventRepository,
	UnknownProductError,
} from "@workspace/domain";
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
	config: Pick<
		import("@workspace/domain").AppConfigService,
		| "polarProductPortraitUnlock"
		| "polarProductRelationshipSingle"
		| "polarProductRelationship5Pack"
		| "polarProductExtendedConversation"
	>,
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
 * Two-phase idempotency pattern (Story 13.3):
 *
 * Phase 1: Idempotency check — return existing event if checkout already processed
 * Phase 2: First-time insertion — insert purchase event (+ optional free credit side-effect)
 */
export const processPurchase = (input: ProcessPurchaseInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const purchaseRepo = yield* PurchaseEventRepository;
		const logger = yield* LoggerRepository;

		const eventType = mapProductToEventType(input.productId, config);
		if (!eventType) {
			return yield* Effect.fail(
				new UnknownProductError({
					productId: input.productId,
					message: `Unknown Polar product: ${input.productId}`,
				}),
			);
		}

		// ───────────────────────────────────────────────────────────────
		// Phase 1: Idempotency check
		// ───────────────────────────────────────────────────────────────
		const existingEvent = yield* purchaseRepo.getByCheckoutId(input.checkoutId);
		if (existingEvent) {
			logger.info("Duplicate webhook detected, returning existing purchase event", {
				checkoutId: input.checkoutId,
				existingEventId: existingEvent.id,
			});

			return existingEvent;
		}

		// ───────────────────────────────────────────────────────────────
		// Phase 2: First-time insertion
		// ───────────────────────────────────────────────────────────────
		const is5Pack = input.productId === config.polarProductRelationship5Pack;
		const eventInput = {
			userId: input.userId,
			eventType,
			polarCheckoutId: input.checkoutId,
			polarProductId: input.productId,
			amountCents: input.amountCents,
			currency: input.currency,
			metadata: is5Pack ? { units: 5 } : null,
		};

		// Insert purchase event
		const insertResult = yield* purchaseRepo.insertEvent(eventInput);

		// ───────────────────────────────────────────────────────────────
		// Phase 3: Free credit grant on first portrait purchase (Story 3.4, FR33)
		// ───────────────────────────────────────────────────────────────
		if (eventType === "portrait_unlocked") {
			const existingEvents = yield* purchaseRepo.getEventsByUserId(input.userId);
			const hasFreeCredit = existingEvents.some((e) => e.eventType === "free_credit_granted");
			if (!hasFreeCredit) {
				yield* purchaseRepo.insertEvent({
					userId: input.userId,
					eventType: "free_credit_granted",
					polarCheckoutId: null,
					polarProductId: null,
					amountCents: 0,
					currency: input.currency,
					metadata: null,
				});
				logger.info("Granted free relationship credit on first portrait purchase", {
					userId: input.userId,
				});
			}
		}

		if (eventType === "extended_conversation_unlocked") {
			logger.info("Recorded extension purchase while extension remains disabled in MVP", {
				userId: input.userId,
				checkoutId: input.checkoutId,
			});
		}

		return insertResult;
	});
