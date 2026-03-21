/**
 * Reconcile Portrait Purchase Use Case (Story 32-6, ADR-13)
 *
 * Ensures users who paid for a portrait always receive one, even if their
 * browser closed during payment or the webhook placeholder INSERT failed.
 *
 * Called from get-portrait-status when status is "none":
 * 1. Check if portrait_unlocked event exists for the user
 * 2. Check if portrait row already exists
 * 3. If paid but no portrait: insert placeholder + fork daemon
 *
 * This is idempotent — DuplicatePortraitError from concurrent reconciliation
 * attempts is caught silently.
 */

import {
	AssessmentResultRepository,
	LoggerRepository,
	PortraitRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import { Effect } from "effect";
import { generateFullPortrait } from "./generate-full-portrait.use-case";

export interface ReconcilePortraitPurchaseInput {
	readonly sessionId: string;
	readonly userId: string;
}

export interface ReconcilePortraitPurchaseOutput {
	/** Whether reconciliation created a new placeholder */
	readonly reconciled: boolean;
}

export const reconcilePortraitPurchase = (input: ReconcilePortraitPurchaseInput) =>
	Effect.gen(function* () {
		const purchaseRepo = yield* PurchaseEventRepository;
		const portraitRepo = yield* PortraitRepository;
		const resultsRepo = yield* AssessmentResultRepository;
		const logger = yield* LoggerRepository;

		// 1. Check if user has purchased a portrait
		const capabilities = yield* purchaseRepo.getCapabilities(input.userId);
		if (!capabilities.hasFullPortrait) {
			return { reconciled: false } satisfies ReconcilePortraitPurchaseOutput;
		}

		// 2. Check if portrait row already exists
		const existingPortrait = yield* portraitRepo.getFullPortraitBySessionId(input.sessionId);
		if (existingPortrait !== null) {
			// Portrait exists (generating, ready, or failed) — no reconciliation needed
			return { reconciled: false } satisfies ReconcilePortraitPurchaseOutput;
		}

		// 3. Look up assessment result for placeholder insertion
		const result = yield* resultsRepo.getBySessionId(input.sessionId).pipe(
			Effect.catchAll(() => Effect.succeed(null)),
		);
		if (!result) {
			logger.warn("Portrait reconciliation: no assessment result found, skipping", {
				sessionId: input.sessionId,
				userId: input.userId,
			});
			return { reconciled: false } satisfies ReconcilePortraitPurchaseOutput;
		}

		// 4. Insert placeholder and fork daemon
		logger.info("Portrait reconciliation: inserting placeholder and spawning generation", {
			sessionId: input.sessionId,
			userId: input.userId,
			assessmentResultId: result.id,
		});

		const portrait = yield* portraitRepo
			.insertPlaceholder({
				assessmentResultId: result.id,
				tier: "full",
				modelUsed: "claude-sonnet-4-6",
			})
			.pipe(
				Effect.catchTag("DuplicatePortraitError", () => {
					// Concurrent reconciliation — another request already created the placeholder
					logger.info(
						"Portrait reconciliation: placeholder already exists (concurrent reconciliation)",
						{
							sessionId: input.sessionId,
							assessmentResultId: result.id,
						},
					);
					return Effect.succeed(null);
				}),
			);

		if (portrait === null) {
			return { reconciled: false } satisfies ReconcilePortraitPurchaseOutput;
		}

		// Fork daemon for async generation
		yield* Effect.forkDaemon(
			generateFullPortrait({
				portraitId: portrait.id,
				sessionId: input.sessionId,
			}),
		);

		return { reconciled: true } satisfies ReconcilePortraitPurchaseOutput;
	});
