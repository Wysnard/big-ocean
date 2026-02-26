/**
 * Generate Results Use Case (Story 11.1 + 11.2 + 11.3 + 11.5)
 *
 * Triggers the finalization pipeline for a completed assessment.
 * Implements three-tier idempotency:
 *   Tier 1: Already completed → return immediately
 *   Tier 2: Lock contention → return current progress (not an error)
 *   Guard 2: Finalization evidence exists → skip FinAnalyzer, reuse evidence
 *
 * Phase 1: FinAnalyzer (Sonnet) → finalization_evidence + assessment_results placeholder
 * Phase 2: Score computation + teaser portrait (Haiku) → assessment_results populated
 */

import type { EvidenceInput, FinalizationEvidenceInput } from "@workspace/domain";
import {
	AssessmentMessageRepository,
	AssessmentResultError,
	AssessmentResultRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	calculateCost,
	computeAllFacetResults,
	computeDomainCoverage,
	computeHighlightPositions,
	computeTraitResults,
	FinalizationEvidenceRepository,
	FinanalyzerRepository,
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
		const messageRepo = yield* AssessmentMessageRepository;
		const finanalyzerRepo = yield* FinanalyzerRepository;
		const finalizationEvidenceRepo = yield* FinalizationEvidenceRepository;
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

		// 2. Idempotency tier 1: already completed
		if (session.status === "completed") {
			logger.info("Generate results: session already completed (idempotency tier 1)", {
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

		// 4. Idempotency tier 2: try to acquire lock
		// Note: catchTag("ConcurrentMessageError") is an intentional exception to the Error Propagation Rule.
		// Per AC#7, concurrent duplicates must return current progress (HTTP 200), not an error.
		const lockAcquired = yield* sessionRepo.acquireSessionLock(input.sessionId).pipe(
			Effect.map(() => true),
			Effect.catchTag("ConcurrentMessageError", () => Effect.succeed(false)),
		);

		if (!lockAcquired) {
			logger.info(
				"Generate results: concurrent request, returning current progress (idempotency tier 2)",
				{
					sessionId: input.sessionId,
				},
			);
			const currentProgress = (session.finalizationProgress ?? "analyzing") as GenerateResultsStatus;
			return { status: currentProgress };
		}

		// Lock acquired — run the pipeline with guaranteed lock release
		return yield* Effect.gen(function* () {
			const pipelineStart = Date.now();

			// ═══════════════════════════════════════════════════════════════
			// PHASE 1: FinAnalyzer (Sonnet) → finalization_evidence
			// ═══════════════════════════════════════════════════════════════

			// 5. Update progress to "analyzing"
			yield* sessionRepo.updateSession(input.sessionId, { finalizationProgress: "analyzing" });

			// Guard 2: Check if finalization evidence already exists (idempotency)
			const evidenceExists = yield* finalizationEvidenceRepo.existsForSession(input.sessionId);
			let phase1ResultId: string | null = null;
			if (evidenceExists) {
				logger.info("Idempotency Guard 2: finalization evidence exists, skipping FinAnalyzer", {
					sessionId: input.sessionId,
				});
			} else {
				// Fetch ALL messages for the session
				const messages = yield* messageRepo.getMessages(input.sessionId);

				// Map to FinanalyzerMessage format
				const finanalyzerMessages = messages.map((m) => ({
					id: m.id,
					role: m.role as "user" | "assistant",
					content: m.content,
				}));

				logger.info("Phase 1: Calling FinAnalyzer (Sonnet)", {
					sessionId: input.sessionId,
					messageCount: finanalyzerMessages.length,
				});

				// Call FinAnalyzer with retry once
				const finanalyzerOutput = yield* finanalyzerRepo
					.analyze({ messages: finanalyzerMessages })
					.pipe(Effect.retry(Schedule.once));

				// Create assessment_results placeholder row (FK target for finalization_evidence)
				const assessmentResult = yield* assessmentResultRepo.create({
					assessmentSessionId: input.sessionId,
					facets: {},
					traits: {},
					domainCoverage: {},
					portrait: "",
				});
				phase1ResultId = assessmentResult.id;

				// Build message content map for highlight computation
				const messageContentMap = new Map<string, string>();
				for (const m of messages) {
					messageContentMap.set(m.id, m.content);
				}

				// Process evidence: validate messageIds, compute highlights
				const evidenceInputs: FinalizationEvidenceInput[] = [];
				let skippedCount = 0;

				for (const ev of finanalyzerOutput.evidence) {
					const messageContent = messageContentMap.get(ev.messageId);
					if (messageContent === undefined) {
						logger.warn("FinAnalyzer returned invalid messageId, skipping evidence item", {
							messageId: ev.messageId,
							sessionId: input.sessionId,
						});
						skippedCount++;
						continue;
					}

					const { highlightStart, highlightEnd } = computeHighlightPositions(messageContent, ev.quote);

					evidenceInputs.push({
						assessmentMessageId: ev.messageId,
						assessmentResultId: assessmentResult.id,
						bigfiveFacet: ev.bigfiveFacet,
						score: ev.score,
						confidence: ev.confidence,
						domain: ev.domain,
						rawDomain: ev.rawDomain,
						quote: ev.quote,
						highlightStart,
						highlightEnd,
					});
				}

				if (skippedCount > 0) {
					logger.warn("FinAnalyzer evidence items skipped due to invalid messageIds", {
						skippedCount,
						totalCount: finanalyzerOutput.evidence.length,
						sessionId: input.sessionId,
					});
				}

				// Batch save evidence
				yield* finalizationEvidenceRepo.saveBatch(evidenceInputs);

				logger.info("Phase 1 complete: finalization evidence saved", {
					sessionId: input.sessionId,
					evidenceCount: evidenceInputs.length,
					tokenUsage: finanalyzerOutput.tokenUsage,
				});

				// Track cost (fail-open — Redis errors don't block finalization)
				const costKey = session.userId ?? input.sessionId;
				const cost = calculateCost(
					finanalyzerOutput.tokenUsage.input,
					finanalyzerOutput.tokenUsage.output,
				);
				yield* costGuardRepo.incrementDailyCost(costKey, cost.totalCents).pipe(
					Effect.catchTag("RedisOperationError", (err) => {
						logger.warn("Failed to track FinAnalyzer cost (non-blocking)", {
							error: err.message,
							sessionId: input.sessionId,
						});
						return Effect.succeed(0);
					}),
				);
			}

			const phase1Duration = Date.now() - pipelineStart;
			logger.info("Phase 1 timing", {
				sessionId: input.sessionId,
				phase1DurationMs: phase1Duration,
				skipped: evidenceExists,
			});

			// ═══════════════════════════════════════════════════════════════
			// PHASE 2: Score computation + teaser portrait (Story 11.3 + 11.5)
			// ═══════════════════════════════════════════════════════════════
			const phase2Start = Date.now();

			// 6. Update progress to "generating_portrait"
			yield* sessionRepo.updateSession(input.sessionId, {
				finalizationProgress: "generating_portrait",
			});

			// Resolve the assessmentResultId — depends on whether Phase 1 ran
			let assessmentResultId: string;
			if (phase1ResultId) {
				// Normal path: Phase 1 created the result
				assessmentResultId = phase1ResultId;
			} else {
				// Guard 2 path: Phase 1 was skipped, fetch existing result
				const existingResult = yield* assessmentResultRepo.getBySessionId(input.sessionId);
				if (!existingResult) {
					return yield* Effect.fail(
						new AssessmentResultError({
							message: `Assessment result not found for session '${input.sessionId}' (data corruption)`,
						}),
					);
				}
				assessmentResultId = existingResult.id;
			}

			// Fetch finalization evidence
			const finalizationEvidence = yield* finalizationEvidenceRepo.getByResultId(assessmentResultId);

			// Map to EvidenceInput for formula functions
			const scoringInputs: EvidenceInput[] = finalizationEvidence.map((ev) => ({
				bigfiveFacet: ev.bigfiveFacet,
				score: ev.score,
				confidence: ev.confidence,
				domain: ev.domain,
			}));

			// Compute scores
			const facets = computeAllFacetResults(scoringInputs);
			const traits = computeTraitResults(facets);
			const domainCoverage = computeDomainCoverage(scoringInputs);

			// Generate teaser portrait (~2-3s)
			const teaserOutput = yield* teaserPortraitRepo
				.generateTeaser({ sessionId: input.sessionId, evidence: finalizationEvidence })
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

			// Update the placeholder row with real scores and teaser portrait
			yield* assessmentResultRepo.update(assessmentResultId, {
				facets,
				traits,
				domainCoverage,
				portrait: teaserOutput.portrait,
			});

			// Store teaser in portraits table (additive — assessment_results.portrait stays)
			const teaserPlaceholder = yield* portraitRepo
				.insertPlaceholder({
					assessmentResultId,
					tier: "teaser" as const,
					modelUsed: teaserOutput.modelUsed,
				})
				.pipe(Effect.catchTag("DuplicatePortraitError", () => Effect.succeed(null)));

			if (teaserPlaceholder) {
				yield* portraitRepo
					.updateContent(teaserPlaceholder.id, teaserOutput.portrait)
					.pipe(Effect.catchTag("PortraitNotFoundError", () => Effect.void));
				// Store locked section titles by updating the portrait row
				yield* portraitRepo
					.updateLockedSectionTitles(teaserPlaceholder.id, teaserOutput.lockedSectionTitles)
					.pipe(Effect.catchTag("PortraitNotFoundError", () => Effect.void));
			}

			const phase2Duration = Date.now() - phase2Start;
			const totalDuration = Date.now() - pipelineStart;

			const facetsWithEvidence = Object.values(facets).filter((f) => f.confidence > 0).length;
			logger.info("Phase 2 complete: scores computed and teaser generated", {
				sessionId: input.sessionId,
				facetsWithEvidence,
				phase2DurationMs: phase2Duration,
				totalDurationMs: totalDuration,
				teaserLength: teaserOutput.portrait.length,
				traitScores: Object.fromEntries(
					Object.entries(traits).map(([t, v]) => [t, v.score.toFixed(2)]),
				),
			});

			if (totalDuration > 20000) {
				logger.warn("Finalization exceeded 20s target", {
					sessionId: input.sessionId,
					totalDurationMs: totalDuration,
					phase1DurationMs: phase1Duration,
					phase2DurationMs: phase2Duration,
				});
			}

			// 7. Mark completed
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
