/**
 * Nerin Pipeline — Director Model (Story 43-5)
 *
 * 4-step sequential pipeline replacing the old 6-layer pacing system:
 * 1. Evidence extraction (existing Haiku call, three-tier fail-open unchanged)
 * 2. Coverage analysis (pure function — reads all session evidence, returns targets)
 * 3. Nerin Director (LLM — receives system prompt + full history + coverage targets, returns brief)
 * 4. Nerin Actor (LLM — receives actor prompt + brief, returns response)
 *
 * Exchange is saved with director_output, coverage_targets, and extraction_tier.
 *
 * Evidence idempotency: on retry, evidence extraction is skipped if evidence
 * already exists for the current exchange (the exchange row created before
 * the Director call serves as the idempotency anchor).
 */

import {
	AgentInvocationError,
	AppConfig,
	AssessmentExchangeRepository,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateDomainDistribution,
	analyzeCoverage,
	buildActorPrompt,
	type ConversanalyzerV2Output,
	ConversationEvidenceRepository,
	CostGuardRepository,
	calculateCost,
	computeFinalWeight,
	type DomainMessage,
	type ExtractionTier,
	enrichWithDefinitions,
	getUTCDateKey,
	LoggerRepository,
	NERIN_DIRECTOR_CLOSING_PROMPT,
	NERIN_DIRECTOR_PROMPT,
	NerinActorRepository,
	NerinDirectorRepository,
	pickFarewellMessage,
} from "@workspace/domain";
import { Effect } from "effect";
import { runSplitThreeTierExtraction } from "./three-tier-extraction";

export interface NerinPipelineInput {
	readonly sessionId: string;
	readonly userId?: string;
	readonly userMessage: string;
}

export interface NerinPipelineOutput {
	readonly response: string;
	readonly isFinalTurn: boolean;
	/** Static farewell message — only present on the final turn */
	readonly surfacingMessage?: string;
}

/**
 * Runs the full Nerin Director Model pipeline.
 *
 * Steps:
 * 1. Extract evidence from user message (three-tier fail-open)
 * 2. Analyze coverage to find weakest domain/facets
 * 3. Generate Director brief (main or closing prompt)
 * 4. Voice brief via Nerin Actor
 *
 * Atomic write: user message + assistant message are persisted together
 * only after the Actor call succeeds.
 */
export const runNerinPipeline = (input: NerinPipelineInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const exchangeRepo = yield* AssessmentExchangeRepository;
		const logger = yield* LoggerRepository;
		const director = yield* NerinDirectorRepository;
		const actor = yield* NerinActorRepository;
		const evidenceRepo = yield* ConversationEvidenceRepository;
		const costGuard = yield* CostGuardRepository;

		const costKey = input.userId ?? input.sessionId;
		const t0 = Date.now();

		// ---- Gather context ----

		const session = yield* sessionRepo.getSession(input.sessionId);
		const isExtensionSession = !!session.parentSessionId;

		// Load all persisted messages — for authenticated users this spans all
		// sessions so Nerin Director sees one continuous conversation history.
		const savedMessages = yield* input.userId
			? messageRepo
					.getMessagesByUserId(input.userId)
					.pipe(Effect.catchAll(() => messageRepo.getMessages(input.sessionId)))
			: messageRepo.getMessages(input.sessionId);

		// Current session exchanges — needed for turn counting and message linking.
		const sessionExchanges = yield* exchangeRepo.findBySession(input.sessionId);

		// For authenticated users, load ALL exchanges/evidence across all sessions
		// for coverage analysis.
		const allExchanges = yield* input.userId
			? exchangeRepo
					.findByUserId(input.userId)
					.pipe(Effect.catchAll(() => exchangeRepo.findBySession(input.sessionId)))
			: exchangeRepo.findBySession(input.sessionId);

		// Append the current (not yet persisted) user message
		const domainMessages: DomainMessage[] = [
			...savedMessages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
			})),
			{ id: `pending-${Date.now()}`, role: "user" as const, content: input.userMessage },
		];

		const allEvidence = yield* input.userId
			? evidenceRepo
					.findByUserId(input.userId)
					.pipe(Effect.catchAll(() => evidenceRepo.findBySession(input.sessionId)))
			: evidenceRepo.findBySession(input.sessionId);

		// Current turn number (1-based, excludes opener exchange at turn 0)
		const turnNumber = sessionExchanges.filter((e) => e.turnNumber > 0).length + 1;
		const totalTurns = config.freeTierMessageThreshold;

		if (isExtensionSession) {
			logger.info("Extension session context loaded", {
				sessionId: input.sessionId,
				parentSessionId: session.parentSessionId,
				totalMessagesLoaded: savedMessages.length,
				totalExchangesLoaded: allExchanges.length,
				totalEvidenceLoaded: allEvidence.length,
			});
		}

		const tContext = Date.now();

		// ---- Step 1: Extract evidence from user message ----
		// Uses three-tier fail-open: strict x3 -> lenient x1 -> neutral defaults.
		// Evidence idempotency: skip extraction if evidence already exists for the
		// previous exchange (retry scenario — ADR-DM-5).

		const previousExchangeId =
			sessionExchanges.length > 0 ? sessionExchanges[sessionExchanges.length - 1]?.id : null;

		// Check for existing evidence on this exchange (idempotency on retry)
		const existingEvidenceCount = previousExchangeId
			? yield* evidenceRepo
					.countByMessage(previousExchangeId)
					.pipe(Effect.catchAll(() => Effect.succeed(0)))
			: 0;

		const shouldExtract = turnNumber >= 1 && existingEvidenceCount === 0;

		let pendingEvidence: ConversanalyzerV2Output["evidence"] = [];
		let extractionTier: ExtractionTier | null = null;
		let analyzerTokenUsage: { input: number; output: number } | null = null;

		if (shouldExtract) {
			const domainDistribution = aggregateDomainDistribution(allEvidence);
			const recentMessages: DomainMessage[] = domainMessages.slice(-6);

			const extraction = yield* runSplitThreeTierExtraction({
				sessionId: input.sessionId,
				message: input.userMessage,
				recentMessages,
				domainDistribution,
			});

			extractionTier = extraction.extractionTier;
			const evidenceResult = extraction.output;
			analyzerTokenUsage = evidenceResult.tokenUsage;

			const filteredEvidence = evidenceResult.evidence.filter(
				(e) => computeFinalWeight(e.strength, e.confidence) >= config.minEvidenceWeight,
			);

			logger.info("Evidence weights computed", {
				sessionId: input.sessionId,
				rawCount: evidenceResult.evidence.length,
				filteredCount: filteredEvidence.length,
				extractionTier,
				evidence: filteredEvidence.map((e) => ({
					facet: e.bigfiveFacet,
					deviation: e.deviation,
					polarity: e.polarity,
					strength: e.strength,
					confidence: e.confidence,
					domain: e.domain,
					finalWeight: +computeFinalWeight(e.strength, e.confidence).toFixed(3),
				})),
			});

			if (filteredEvidence.length > 0) {
				pendingEvidence = filteredEvidence;
			}
		} else if (existingEvidenceCount > 0) {
			logger.info("Evidence extraction skipped (idempotency — evidence already exists)", {
				sessionId: input.sessionId,
				existingEvidenceCount,
			});
		}

		const tExtraction = Date.now();

		// ---- Step 2: Coverage analysis ----
		// Merge freshly extracted evidence into allEvidence for coverage analysis

		const allEvidenceWithCurrent = [
			...allEvidence,
			...pendingEvidence.map((e) => ({
				...e,
				sessionId: input.sessionId,
				messageId: "pending",
				exchangeId: null,
			})),
		];

		const coverageTarget = analyzeCoverage(
			allEvidenceWithCurrent as Parameters<typeof analyzeCoverage>[0],
		);
		const coverageTargetsEnriched = enrichWithDefinitions(coverageTarget);

		const tCoverage = Date.now();

		// ---- Step 3: Nerin Director ----
		// Swap to closing prompt on last turn (ADR-DM-5)

		const isFinalTurnPreCheck = turnNumber >= totalTurns;
		const directorSystemPrompt = isFinalTurnPreCheck
			? NERIN_DIRECTOR_CLOSING_PROMPT
			: NERIN_DIRECTOR_PROMPT;

		const directorResult = yield* director
			.generateBrief({
				systemPrompt: directorSystemPrompt,
				messages: domainMessages,
				coverageTargets: coverageTargetsEnriched,
				sessionId: input.sessionId,
			})
			.pipe(
				Effect.tapError((error) =>
					Effect.sync(() =>
						logger.error("Nerin Director failed", {
							errorTag: error._tag,
							sessionId: input.sessionId,
							message: error.message,
						}),
					),
				),
				// Map NerinDirectorError → AgentInvocationError so it matches the
				// existing error channel expected by the handler contract.
				Effect.mapError(
					(error) =>
						new AgentInvocationError({
							agentName: "NerinDirector",
							sessionId: input.sessionId,
							message: error.message,
						}),
				),
			);

		const tDirector = Date.now();

		logger.info("Director pipeline computed", {
			sessionId: input.sessionId,
			turnNumber,
			targetDomain: coverageTarget.targetDomain,
			targetFacets: coverageTarget.targetFacets,
			briefLength: directorResult.brief.length,
			isFinalTurn: isFinalTurnPreCheck,
			isExtensionSession,
		});

		// ---- Step 4: Nerin Actor ----

		const actorPrompt = buildActorPrompt();

		const actorResult = yield* actor
			.invoke({
				sessionId: input.sessionId,
				actorPrompt,
				directorBrief: directorResult.brief,
			})
			.pipe(
				Effect.tapError((error) =>
					Effect.sync(() =>
						logger.error("Nerin Actor failed", {
							errorTag: error._tag,
							sessionId: input.sessionId,
							message: error.message,
						}),
					),
				),
			);

		const tActor = Date.now();

		// ---- Cost tracking ----

		const actorCost = calculateCost(actorResult.tokenCount.input, actorResult.tokenCount.output);
		const directorCost = calculateCost(
			directorResult.tokenUsage.input,
			directorResult.tokenUsage.output,
		);
		const analyzerCost = analyzerTokenUsage
			? calculateCost(analyzerTokenUsage.input, analyzerTokenUsage.output)
			: { totalCents: 0 };
		const totalCostCents = actorCost.totalCents + directorCost.totalCents + analyzerCost.totalCents;

		if (totalCostCents > 0) {
			yield* costGuard.incrementDailyCost(costKey, totalCostCents).pipe(
				Effect.catchAll((err) =>
					Effect.sync(() => {
						logger.error("Failed to increment daily cost (non-fatal)", {
							error: err.message,
							sessionId: input.sessionId,
							totalCostCents,
						});
					}),
				),
			);

			yield* costGuard.incrementSessionCost(input.sessionId, totalCostCents).pipe(
				Effect.catchAll((err) =>
					Effect.sync(() => {
						logger.error("Failed to increment session cost (non-fatal)", {
							error: err.message,
							sessionId: input.sessionId,
							totalCostCents,
						});
					}),
				),
			);
		}

		logger.info("Cost tracked", {
			event: "session_cost_tracked",
			sessionId: input.sessionId,
			costKey,
			actorCostCents: actorCost.totalCents,
			directorCostCents: directorCost.totalCents,
			analyzerCostCents: analyzerCost.totalCents,
			totalCostCents,
			exchangeNumber: turnNumber,
			dateKey: getUTCDateKey(),
		});

		const tCost = Date.now();

		// ---- Save exchange + messages + evidence (two-phase model) ----
		//
		// Exchange #N links: AI message #N (question) + user message #N+1 (answer)
		// Phase A: Close previous exchange — link user message + extraction data
		// Phase B: Create new exchange — link AI message + Director data

		// --- Phase A: Close previous exchange ---
		// Link user message to previous exchange (user is answering that AI question)
		const savedUserMessage = yield* messageRepo.saveMessage(
			input.sessionId,
			"user",
			input.userMessage,
			previousExchangeId ?? undefined,
		);

		if (previousExchangeId) {
			// Store extraction tier on previous exchange
			yield* exchangeRepo.update(previousExchangeId, {
				...(extractionTier != null ? { extractionTier } : {}),
			});
		}

		// Save evidence linked to user message and the exchange whose question prompted it.
		if (pendingEvidence.length > 0 && previousExchangeId) {
			yield* evidenceRepo.save(
				pendingEvidence.map((e) => ({
					...e,
					sessionId: input.sessionId,
					messageId: savedUserMessage.id,
					exchangeId: previousExchangeId,
				})),
			);
		}

		// --- Phase B: Create new exchange for AI response ---
		const exchange = yield* exchangeRepo.create(input.sessionId, turnNumber);

		// Populate Director model data on the new exchange
		yield* exchangeRepo.update(exchange.id, {
			directorOutput: directorResult.brief,
			coverageTargets: coverageTarget,
		});

		// Link AI message to new exchange
		yield* messageRepo.saveMessage(input.sessionId, "assistant", actorResult.response, exchange.id);

		// Increment message_count atomically
		const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

		// Compute isFinalTurn from message count
		const isFinalTurnResult = messageCount >= config.freeTierMessageThreshold;

		// ---- Farewell message on final turn ----
		// Static farewell replaces the old surfacing LLM call (ADR-DM-5)

		let surfacingMessage: string | undefined;

		if (isFinalTurnResult) {
			surfacingMessage = pickFarewellMessage();

			// Save farewell message to DB (linked to closing exchange)
			yield* messageRepo.saveMessage(input.sessionId, "assistant", surfacingMessage, exchange.id);

			// Transition session to "finalizing"
			yield* sessionRepo.updateSession(input.sessionId, { status: "finalizing" });

			logger.info("Farewell message appended", {
				sessionId: input.sessionId,
				farewellLength: surfacingMessage.length,
			});
		}

		const tSave = Date.now();

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: actorResult.response.length,
			actorTokenCount: actorResult.tokenCount,
			directorTokenCount: directorResult.tokenUsage,
			messageCount,
			isFinalTurn: isFinalTurnResult,
			hasSurfacingMessage: !!surfacingMessage,
			targetDomain: coverageTarget.targetDomain,
			targetFacets: coverageTarget.targetFacets,
			extractionTier,
			evidenceCount: pendingEvidence.length,
			exchangeId: exchange.id,
			durationMs: {
				total: tSave - t0,
				gatherContext: tContext - t0,
				extraction: tExtraction - tContext,
				coverage: tCoverage - tExtraction,
				director: tDirector - tCoverage,
				actor: tActor - tDirector,
				costTracking: tCost - tActor,
				dbSave: tSave - tCost,
			},
		});

		return {
			response: actorResult.response,
			isFinalTurn: isFinalTurnResult,
			...(surfacingMessage ? { surfacingMessage } : {}),
		} satisfies NerinPipelineOutput;
	});
