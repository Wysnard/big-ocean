/**
 * Create Invitation Use-Case (Story 14.2)
 *
 * Validates credit balance, then atomically consumes 1 credit and creates
 * a relationship invitation with a UUID v4 token and 30-day expiry.
 */

import {
	AppConfig,
	INVITATION_EXPIRY_DAYS,
	InsufficientCreditsError,
	PurchaseEventRepository,
	RelationshipInvitationRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export const createInvitation = (input: { userId: string; personalMessage?: string }) =>
	Effect.gen(function* () {
		// 1. Check credit balance
		const purchaseRepo = yield* PurchaseEventRepository;
		const capabilities = yield* purchaseRepo.getCapabilities(input.userId);
		if (capabilities.availableCredits < 1) {
			return yield* Effect.fail(
				new InsufficientCreditsError({ message: "No relationship credits available" }),
			);
		}

		// 2. Generate token + expiry
		const invitationToken = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

		// 3. Atomic: credit_consumed + invitation creation
		const invitationRepo = yield* RelationshipInvitationRepository;
		const invitation = yield* invitationRepo.createWithCreditConsumption({
			inviterUserId: input.userId,
			invitationToken,
			personalMessage: input.personalMessage ?? null,
			expiresAt,
		});

		// 4. Build share URL
		const config = yield* AppConfig;
		const shareUrl = `${config.frontendUrl}/invite/${invitationToken}`;

		return { invitation, shareUrl };
	});
