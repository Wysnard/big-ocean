/**
 * Generate Results Use Case (Story 18-4: Staged Idempotency Rewrite)
 *
 * Triggers the finalization pipeline for a completed assessment.
 * Reads conversation_evidence (not finalization_evidence) as the authoritative source.
 *
 * Pipeline stages:
 *   1. Idempotency check: stage=completed → return immediately
 *   2. Idempotency check: stage=scored → skip scoring, proceed to completion
 *   3. Acquire lock → compute scores + portrait → upsert result with stage=scored
 *   4. Mark session completed, set stage=completed
 */

import type { EvidenceInput } from "@workspace/domain";
import {
	AssessmentResultRepository,
	AssessmentSessionRepository,
	ConversationEvidenceRepository,
	CostGuardRepository,
	calculateCost,
	computeAllFacetResults,
	computeDomainCoverage,
	computeTraitResults,
	LoggerRepository,
	PortraitRepository,
	SessionNotFinalizing,
	SessionNotFound,
	TeaserPortraitRepository,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

export interface GenerateResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string | null;
}

export type GenerateResultsStatus = "analyzing" | "generating_portrait" | "completed";

export const generateResults = (input: GenerateResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const logger = yield* LoggerRepository;
		const conversationEvidenceRepo = yield* ConversationEvidenceRepository;
		const assessmentResultRepo = yield* AssessmentResultRepository;
		const costGuardRepo = yield* CostGuardRepository;
		const teaserPortraitRepo = yield* TeaserPortraitRepository;
		const portraitRepo = yield* PortraitRepository;

		// 1. Validate session exists and user owns it
		const session = yield* sessionRepo.getSession(input.sessionId);

		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 2. Idempotency: already completed (session-level check)
		if (session.status === "completed") {
			logger.info("Generate results: session already completed (idempotency)", {
				sessionId: input.sessionId,
			});
			return { status: "completed" as GenerateResultsStatus };
		}

		// 3. Validate session is in finalizing status
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

				// Fetch conversation evidence (authoritative source — Story 18-4)
				const conversationEvidence = yield* conversationEvidenceRepo.findBySession(input.sessionId);

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
								signalPower: +v.signalPower.toFixed(3),
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
								signalPower: +v.signalPower.toFixed(3),
							},
						]),
					),
					domainCoverage,
				});

				// Update progress to generating portrait
				yield* sessionRepo.updateSession(input.sessionId, {
					finalizationProgress: "generating_portrait",
				});

				// Generate teaser portrait
				const teaserOutput = yield* teaserPortraitRepo
					.generateTeaser({
						sessionId: input.sessionId,
						evidence: conversationEvidence,
						scoringEvidence: scoringInputs,
					})
					.pipe(Effect.retry(Schedule.once));

				// Track teaser cost (fail-open)
				const teaserCostKey = session.userId ?? input.sessionId;
				const teaserCost = calculateCost(teaserOutput.tokenUsage.input, teaserOutput.tokenUsage.output);
				yield* costGuardRepo.incrementDailyCost(teaserCostKey, teaserCost.totalCents).pipe(
					Effect.catchTag("RedisOperationError", (err) => {
						logger.warn("Failed to track teaser portrait cost (non-blocking)", {
							error: err.message,
							sessionId: input.sessionId,
						});
						return Effect.succeed(0);
					}),
				);

				// Upsert assessment_results with scores + portrait, set stage=scored
				const upsertedResult = yield* assessmentResultRepo.upsert({
					assessmentSessionId: input.sessionId,
					facets,
					traits,
					domainCoverage,
					portrait: teaserOutput.portrait,
					stage: "scored",
				});

				// Store teaser in portraits table (additive)
				const teaserPlaceholder = yield* portraitRepo
					.insertPlaceholder({
						assessmentResultId: upsertedResult.id,
						tier: "teaser" as const,
						modelUsed: teaserOutput.modelUsed,
					})
					.pipe(Effect.catchTag("DuplicatePortraitError", () => Effect.succeed(null)));

				if (teaserPlaceholder) {
					yield* portraitRepo
						.updateContent(teaserPlaceholder.id, teaserOutput.portrait)
						.pipe(Effect.catchTag("PortraitNotFoundError", () => Effect.void));
				}

				const scoringDuration = Date.now() - pipelineStart;
				const facetsWithEvidence = Object.values(facets).filter((f) => f.confidence > 0).length;
				logger.info("Scoring stage complete", {
					sessionId: input.sessionId,
					facetsWithEvidence,
					scoringDurationMs: scoringDuration,
					teaserLength: teaserOutput.portrait.length,
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
			// STAGE: COMPLETION
			// ═══════════════════════════════════════════════════════

			// Set stage=completed on assessment_results
			yield* assessmentResultRepo.updateStage(input.sessionId, "completed");

			// Mark session completed
			yield* sessionRepo.updateSession(input.sessionId, {
				status: "completed",
				finalizationProgress: "completed",
			});

			logger.info("Generate results: finalization complete", {
				sessionId: input.sessionId,
			});

			return { status: "completed" as GenerateResultsStatus };
		}).pipe(Effect.ensuring(sessionRepo.releaseSessionLock(input.sessionId).pipe(Effect.orDie)));
	});
