/**
 * Process Purchase Use Case (Story 13.2, extended Story 13.3)
 *
 * Effect-based use-case that maps a Polar webhook order to a purchase event.
 * The actual webhook handler (createOnOrderPaidHandler) uses plain Drizzle
 * in Better Auth's async context; this use-case exists for unit-testable
 * business logic with Effect's DI.
 *
 * Story 13.3 adds:
 * - Two-phase idempotency for duplicate webhooks
 * - Portrait placeholder insertion in transaction
 * - forkDaemon for async portrait generation
 *
 * Dependencies: PurchaseEventRepository, AssessmentSessionRepository,
 *               AssessmentResultRepository, PortraitRepository, AppConfig
 */

import type { PurchaseEventType } from "@workspace/domain";
import {
	AppConfig,
	AssessmentResultRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	PortraitRepository,
	PurchaseEventRepository,
	UnknownProductError,
} from "@workspace/domain";
import { Effect } from "effect";
import { generateFullPortrait } from "./generate-full-portrait.use-case";

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
 * Check if event type should trigger portrait generation
 */
const shouldTriggerPortrait = (eventType: PurchaseEventType): boolean =>
	eventType === "portrait_unlocked" || eventType === "extended_conversation_unlocked";

/**
 * Process Purchase Use Case
 *
 * Two-phase idempotency pattern (Story 13.3):
 *
 * Phase 1: Idempotency check
 * - Check if checkout already processed via getByCheckoutId
 * - If duplicate webhook: check portrait state for re-trigger
 * - Re-trigger generation if portrait exists but not complete
 *
 * Phase 2: First-time insertion
 * - Find user's completed assessment
 * - Insert purchase event + portrait placeholder in transaction
 * - forkDaemon for async portrait generation
 */
export const processPurchase = (input: ProcessPurchaseInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const purchaseRepo = yield* PurchaseEventRepository;
		const sessionRepo = yield* AssessmentSessionRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const portraitRepo = yield* PortraitRepository;
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
			logger.info("Duplicate webhook detected, checking portrait state", {
				checkoutId: input.checkoutId,
				existingEventId: existingEvent.id,
			});

			// For portrait-triggering events, check if we should re-trigger generation
			if (shouldTriggerPortrait(eventType)) {
				// Find user's completed session to get portrait context
				const session = yield* sessionRepo.findSessionByUserId(input.userId);
				if (session && session.status === "completed") {
					const portrait = yield* portraitRepo.getFullPortraitBySessionId(session.id);
					// Re-trigger if portrait exists but not complete and retries remain
					if (portrait && portrait.content === null && portrait.retryCount < 3) {
						logger.info("Re-triggering portrait generation from duplicate webhook", {
							portraitId: portrait.id,
							sessionId: session.id,
							retryCount: portrait.retryCount,
						});
						yield* Effect.forkDaemon(
							generateFullPortrait({ portraitId: portrait.id, sessionId: session.id }),
						);
					}
				}
			}

			// Return existing event (idempotent success)
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

		// Check if we need to create a portrait placeholder
		let portraitPlaceholder = null;
		let sessionId: string | null = null;

		if (shouldTriggerPortrait(eventType)) {
			// Find user's completed assessment
			const session = yield* sessionRepo.findSessionByUserId(input.userId);

			if (session && session.status === "completed") {
				sessionId = session.id;
				const result = yield* resultsRepo.getBySessionId(session.id);

				if (result) {
					portraitPlaceholder = {
						assessmentResultId: result.id,
						tier: "full" as const,
						modelUsed: "claude-sonnet-4-6",
					};
				}
			}

			if (!portraitPlaceholder) {
				logger.info("No completed assessment found, skipping portrait generation", {
					userId: input.userId,
					eventType,
				});
			}
		}

		// Insert purchase event with portrait placeholder (transactional)
		const insertResult = yield* purchaseRepo.insertEventWithPortraitPlaceholder(
			eventInput,
			portraitPlaceholder,
		);

		// Spawn portrait generation daemon AFTER transaction commits
		if (insertResult.portrait && sessionId) {
			logger.info("Spawning portrait generation daemon", {
				portraitId: insertResult.portrait.id,
				sessionId,
			});
			yield* Effect.forkDaemon(
				generateFullPortrait({
					portraitId: insertResult.portrait.id,
					sessionId,
				}),
			);
		}

		return insertResult.purchaseEvent;
	});
