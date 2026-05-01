/**
 * Generate Results Use Case (Story 18-4: Staged Idempotency Rewrite)
 *
 * Triggers the finalization pipeline for a completed assessment.
 * Reads conversation_evidence (not finalization_evidence) as the authoritative source.
 *
 * Pipeline stages:
 *   1. Idempotency check: stage=completed → return immediately
 *   2. Idempotency check: stage=scored → skip scoring, proceed to completion
 *   3. Acquire lock → compute scores → upsert result with stage=scored
 *   4. Mark session completed, set stage=completed
 */

import type { EvidenceInput } from "@workspace/domain";
import {
	AssessmentCompletionRepository,
	AssessmentResultError,
	AssessmentResultRepository,
	ConversationRepository,
	CostGuardRepository,
	computeAllFacetResults,
	computeDomainCoverage,
	computeTraitResults,
	LoggerRepository,
	PortraitJobOfferRepository,
	PortraitJobQueue,
	SessionNotFinalizing,
} from "@workspace/domain";
import { Effect, Queue } from "effect";
import { requireAuthenticatedConversation } from "./authenticated-conversation/access";
import {
	loadScopedConversationEvidence,
	resolveAuthenticatedConversationScope,
} from "./authenticated-conversation/scope";
import { ensurePublicProfileForSession } from "./ensure-public-profile-for-session";
import { generateUserSummary } from "./generate-user-summary.use-case";

export interface GenerateResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
}

export type GenerateResultsStatus = "analyzing" | "completed";

export const generateResults = (input: GenerateResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* ConversationRepository;
		const logger = yield* LoggerRepository;
		const assessmentResultRepo = yield* AssessmentResultRepository;
		const completionRepo = yield* AssessmentCompletionRepository;
		const portraitJobOffers = yield* PortraitJobOfferRepository;

		const conversation = yield* requireAuthenticatedConversation({
			sessionId: input.sessionId,
			authenticatedUserId: input.authenticatedUserId,
			policy: "finalization",
		});
		const session = conversation.session;
		const userId = session.userId;

		// 2. Idempotency: already completed (session-level check)
		if (session.status === "completed") {
			yield* ensurePublicProfileForSession({ sessionId: input.sessionId, userId });
			logger.info("Generate results: session already completed (idempotency)", {
				sessionId: input.sessionId,
			});
			return { status: "completed" as GenerateResultsStatus };
		}

		// 3. Validate session is in finalizing status
		// The access policy already rejects non-finalizing sessions; this branch
		// keeps the invariant explicit for callers that inspect status locally.
		if (session.status !== "finalizing") {
			return yield* Effect.fail(
				new SessionNotFinalizing({
					sessionId: input.sessionId,
					currentStatus: session.status,
					message: `Session is '${session.status}', expected 'finalizing'`,
				}),
			);
		}

		// 4. Check staged idempotency on assessment_results
		const existingResult = yield* assessmentResultRepo.getBySessionId(input.sessionId);

		if (existingResult?.stage === "completed") {
			yield* ensurePublicProfileForSession({ sessionId: input.sessionId, userId });
			logger.info("Generate results: result already at stage=completed (idempotency)", {
				sessionId: input.sessionId,
			});
			return { status: "completed" as GenerateResultsStatus };
		}

		// 5. Acquire lock (concurrent duplicate → return progress)
		const lockAcquired = yield* sessionRepo.acquireSessionLock(input.sessionId).pipe(
			Effect.map(() => true),
			Effect.catchTag("ConcurrentMessageError", () => Effect.succeed(false)),
		);

		if (!lockAcquired) {
			logger.info("Generate results: concurrent request, returning current progress", {
				sessionId: input.sessionId,
			});
			const currentProgress = (session.finalizationProgress ?? "analyzing") as GenerateResultsStatus;
			return { status: currentProgress };
		}

		// Lock acquired — run the pipeline with guaranteed lock release
		let extensionUserSerializeKey: string | null = null;
		return yield* Effect.gen(function* () {
			const pipelineStart = Date.now();

			// ═══════════════════════════════════════════════════════
			// STAGE: SCORING (skip if already scored)
			// ═══════════════════════════════════════════════════════

			if (existingResult?.stage === "scored") {
				logger.info("Generate results: result at stage=scored, skipping to completion", {
					sessionId: input.sessionId,
				});
			} else {
				// Update progress
				yield* sessionRepo.updateSession(input.sessionId, { finalizationProgress: "analyzing" });

				// Fetch conversation evidence (authoritative source — Story 18-4).
				// Extension sessions use the Living Personality Model by default.
				const conversationEvidence = yield* loadScopedConversationEvidence(
					resolveAuthenticatedConversationScope(conversation),
				);

				// Map conversation evidence to EvidenceInput for scoring
				const scoringInputs: EvidenceInput[] = conversationEvidence.map((ev) => ({
					bigfiveFacet: ev.bigfiveFacet,
					deviation: ev.deviation as -3 | -2 | -1 | 0 | 1 | 2 | 3,
					strength: ev.strength,
					confidence: ev.confidence,
					domain: ev.domain,
				}));

				logger.info("Scoring from conversation evidence", {
					sessionId: input.sessionId,
					evidenceCount: conversationEvidence.length,
				});

				// Compute scores
				const facets = computeAllFacetResults(scoringInputs);
				const traits = computeTraitResults(facets);
				const domainCoverage = computeDomainCoverage(scoringInputs);

				logger.info("Finalization facet scores", {
					sessionId: input.sessionId,
					facets: Object.fromEntries(
						Object.entries(facets).map(([f, v]) => [
							f,
							{
								score: +v.score.toFixed(2),
								confidence: +v.confidence.toFixed(3),
							},
						]),
					),
				});

				logger.info("Finalization trait scores", {
					sessionId: input.sessionId,
					traits: Object.fromEntries(
						Object.entries(traits).map(([t, v]) => [
							t,
							{
								score: +v.score.toFixed(2),
								confidence: +v.confidence.toFixed(3),
							},
						]),
					),
					domainCoverage,
				});

				// Upsert assessment_results with scores (no portrait at finalization — Story 32-0)
				yield* assessmentResultRepo.upsert({
					assessmentSessionId: input.sessionId,
					facets,
					traits,
					domainCoverage,
					portrait: "",
					stage: "scored",
				});

				const scoringDuration = Date.now() - pipelineStart;
				const facetsWithEvidence = Object.values(facets).filter((f) => f.confidence > 0).length;
				logger.info("Scoring stage complete", {
					sessionId: input.sessionId,
					facetsWithEvidence,
					scoringDurationMs: scoringDuration,
					traitScores: Object.fromEntries(
						Object.entries(traits).map(([t, v]) => [t, v.score.toFixed(2)]),
					),
				});

				if (scoringDuration > 20000) {
					logger.warn("Finalization exceeded 20s target", {
						sessionId: input.sessionId,
						totalDurationMs: scoringDuration,
					});
				}
			}

			// ═══════════════════════════════════════════════════════
			// STAGE: USER SUMMARY (Story 7.1) — before completion
			// ═══════════════════════════════════════════════════════

			yield* generateUserSummary({
				conversation,
			});

			// ═══════════════════════════════════════════════════════
			// STAGE: COMPLETION
			// ═══════════════════════════════════════════════════════

			if (session.parentConversationId != null) {
				const k = `extension-finalize:${userId}`;
				yield* sessionRepo.acquireSessionLock(k);
				extensionUserSerializeKey = k;
			}

			const shouldQueueBundledPortrait =
				session.parentConversationId != null &&
				(yield* sessionRepo.countCompletedExtensionSessionsExcluding(userId, input.sessionId)) === 0;

			const shouldQueueFreePortraitOnCompletion = session.parentConversationId == null;

			const latestResult = yield* assessmentResultRepo.getBySessionId(input.sessionId);
			if (!latestResult?.id) {
				return yield* Effect.fail(
					new AssessmentResultError({
						message: `Assessment result missing before completion commit (sessionId=${input.sessionId})`,
					}),
				);
			}

			yield* completionRepo.commitCompletionWithPublicProfile({
				sessionId: input.sessionId,
				userId,
				assessmentResultId: latestResult.id,
			});

			const costGuard = yield* CostGuardRepository;
			const totalSessionCents = yield* costGuard
				.getSessionCost(input.sessionId)
				.pipe(Effect.catchTag("RedisOperationError", () => Effect.succeed(0)));
			logger.info("session_llm_cost_complete", {
				event: "session_llm_cost_complete",
				sessionId: input.sessionId,
				totalSessionCostCents: totalSessionCents,
				userId,
			});

			if (shouldQueueFreePortraitOnCompletion || shouldQueueBundledPortrait) {
				const jobKey = shouldQueueBundledPortrait ? "bundled_extension" : "initial_free";
				const claimed = yield* portraitJobOffers.claimOffer({
					sessionId: input.sessionId,
					userId,
					jobKey,
				});

				if (claimed) {
					const portraitQueue = yield* PortraitJobQueue;
					yield* Queue.offer(portraitQueue, {
						sessionId: input.sessionId,
						userId,
					});
					logger.info(
						shouldQueueBundledPortrait
							? "Generate results: queued bundled portrait for first extension completion"
							: "Generate results: queued initial free portrait on assessment completion",
						{
							sessionId: input.sessionId,
							userId,
							jobKey,
						},
					);
				} else {
					logger.info("Generate results: skipped duplicate portrait job enqueue", {
						sessionId: input.sessionId,
						userId,
						jobKey,
					});
				}
			}

			logger.info("Generate results: finalization complete", {
				sessionId: input.sessionId,
			});

			return { status: "completed" as GenerateResultsStatus };
		}).pipe(
			Effect.ensuring(
				Effect.gen(function* () {
					if (extensionUserSerializeKey != null) {
						yield* sessionRepo.releaseSessionLock(extensionUserSerializeKey).pipe(Effect.orDie);
					}
					yield* sessionRepo.releaseSessionLock(input.sessionId).pipe(Effect.orDie);
				}),
			),
		);
	});
