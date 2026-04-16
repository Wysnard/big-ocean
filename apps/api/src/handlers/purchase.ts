/**
 * Purchase Presenters (HTTP Handlers) — Story 13.2
 *
 * Webhook handling moved to @polar-sh/better-auth plugin (in better-auth.ts).
 * This file only contains the authenticated purchase endpoints.
 */

import { HttpApiBuilder } from "@effect/platform";
import { BigOceanApi } from "@workspace/contracts";
import { CurrentUser, PurchaseEventRepository } from "@workspace/domain";
import { Effect } from "effect";
import { getCredits } from "../use-cases/get-credits.use-case";
import { getSubscriptionState } from "../use-cases/get-subscription-state.use-case";

/**
 * Purchase Handler Group (authenticated)
 */
export const PurchaseGroupLive = HttpApiBuilder.group(BigOceanApi, "purchase", (handlers) =>
	Effect.gen(function* () {
		return handlers
			.handle("getCredits", () =>
				Effect.gen(function* () {
					const userId = yield* CurrentUser;
					if (!userId) {
						return { availableCredits: 0, hasCompletedAssessment: false };
					}
					return yield* getCredits(userId);
				}),
			)
			.handle("verifyPurchase", ({ urlParams }) =>
				Effect.gen(function* () {
					const userId = yield* CurrentUser;
					if (!userId) {
						return { verified: false };
					}

					const purchaseRepo = yield* PurchaseEventRepository;
					const events = yield* purchaseRepo.getEventsByUserId(userId);
					const matchingEvent = events.find(
						(e: { polarCheckoutId: string | null }) => e.polarCheckoutId === urlParams.checkoutId,
					);

					if (!matchingEvent) {
						return { verified: false };
					}

					const capabilities = yield* purchaseRepo.getCapabilities(userId);

					return {
						verified: true,
						capabilities: {
							availableCredits: capabilities.availableCredits,
							hasFullPortrait: capabilities.hasFullPortrait,
							hasExtendedConversation: capabilities.hasExtendedConversation,
						},
					};
				}),
			)
			.handle("getSubscriptionState", () =>
				Effect.gen(function* () {
					const userId = yield* CurrentUser;
					if (!userId) {
						return {
							subscriptionStatus: "none" as const,
							isEntitledToConversationExtension: false,
							subscribedSince: null,
						};
					}
					return yield* getSubscriptionState(userId);
				}),
			);
	}),
);
