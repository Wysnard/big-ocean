/**
 * Nerin Pipeline -- Pacing Pipeline Integration (Story 27-3)
 *
 * Wires the full pacing pipeline into the Nerin conversation loop:
 * E_target -> V2 scorer -> V2 selector -> Move Governor -> Prompt Builder -> Nerin -> ConversAnalyzer -> save.
 *
 * Replaces the old DRS + multiplicative scorer + old prompt builder path.
 * Clean cut migration -- no backward compatibility shim or feature flag.
 *
 * Pipeline steps:
 * 1. Compute E_target from energy/telling histories
 * 2. Score all territories via V2 additive scorer
 * 3. Select territory via V2 selector (cold-start-perimeter for turn 1, argmax for turns 2+)
 * 4. Compute observation focus strengths
 * 5. Run Move Governor to produce PromptBuilderInput
 * 6. Build system prompt via 4-tier prompt builder
 * 7. Call Nerin with composed system prompt
 * 8. Call ConversAnalyzer via three-tier extraction
 * 9. Save evidence + exchange metadata
 */

import {
	AppConfig,
	AssessmentExchangeRepository,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateDomainDistribution,
	buildPrompt,
	buildSurfacingPrompt,
	type ConversanalyzerV2Output,
	ConversationEvidenceRepository,
	CostGuardRepository,
	calculateCost,
	computeContradictionStrength,
	computeConvergenceStrength,
	computeETargetV2,
	computeFacetMetrics,
	computeFinalWeight,
	computeGovernorOutput,
	computeNoticingStrength,
	computePerDomainConfidence,
	computeRelateStrength,
	computeSmoothedClarity,
	type DomainMessage,
	deriveSessionPhase,
	deriveTransitionType,
	type EnergyBand,
	type ExtractionTier,
	type FacetMetrics as FacetMetricsType,
	getUTCDateKey,
	type LifeDomain,
	LoggerRepository,
	type MoveGovernorInput,
	mapEnergyBand,
	mapTellingBand,
	NerinAgentRepository,
	OBSERVATION_FOCUS_CONSTANTS,
	PACING_SCORER_DEFAULTS,
	type PacingVisitHistory,
	scoreAllTerritoriesV2,
	selectTerritoryV2,
	TERRITORY_CATALOG,
	type TellingBand,
	type TerritoryId,
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
	/** Beat 2 surfacing message — only present on the final turn */
	readonly surfacingMessage?: string;
}

// ---- Helpers ----

/**
 * Build visit history from exchange records for the V2 scorer.
 * Maps territory ID -> last visit turn number.
 */
function buildPacingVisitHistory(
	exchanges: ReadonlyArray<{
		selectedTerritory?: string | null;
		turnNumber: number;
	}>,
): PacingVisitHistory {
	const visits = new Map<TerritoryId, number>();

	for (const exchange of exchanges) {
		if (exchange.selectedTerritory) {
			visits.set(exchange.selectedTerritory as TerritoryId, exchange.turnNumber);
		}
	}

	return visits;
}

/**
 * Extract energy history from exchange records as continuous [0, 1] values.
 * Chronological order (oldest first) as expected by computeETarget.
 */
function extractEnergyHistory(exchanges: ReadonlyArray<{ energy?: number | null }>): number[] {
	const values: number[] = [];
	for (const exchange of exchanges) {
		if (exchange.energy != null) {
			values.push(exchange.energy);
		}
	}
	return values;
}

/**
 * Extract telling history from exchange records as continuous [0, 1] values.
 * Chronological order (oldest first) as expected by computeETarget.
 * Null values are preserved as null (telling may be unavailable).
 */
function extractTellingHistory(
	exchanges: ReadonlyArray<{ telling?: number | null }>,
): (number | null)[] {
	const values: (number | null)[] = [];
	for (const exchange of exchanges) {
		// telling is stored as a continuous value; null if extraction failed
		values.push(exchange.telling ?? null);
	}
	return values;
}

/**
 * Get the current territory from the most recent exchange.
 * Returns null if no exchanges exist yet.
 */
function getCurrentTerritory(
	exchanges: ReadonlyArray<{ selectedTerritory?: string | null }>,
): TerritoryId | null {
	for (let i = exchanges.length - 1; i >= 0; i--) {
		const exchange = exchanges[i];
		if (exchange?.selectedTerritory) {
			return exchange.selectedTerritory as TerritoryId;
		}
	}
	return null;
}

/**
 * Compute observation focus strengths from evidence and exchange state.
 *
 * Returns the raw strengths needed by the Move Governor:
 * - relate: energy x telling
 * - noticing: smoothed clarity for top domain
 * - contradiction: best facet contradiction across domains
 * - convergence: best facet convergence across 3+ domains
 * - phase: mean(confidence) / C_MAX
 * - sharedFireCount: number of prior non-Relate observations
 */
function computeObservationFocusInputs(
	facetMetrics: ReadonlyMap<string, FacetMetricsType>,
	currentEnergy: number,
	currentTelling: number,
	previousSmoothedClarity: number,
): {
	relateStrength: number;
	noticingStrength: number;
	contradictionStrength: number;
	convergenceStrength: number;
	noticingDomain: LifeDomain | undefined;
	contradictionTarget:
		| {
				facet: string;
				pair: readonly [
					{ domain: LifeDomain; score: number; confidence: number },
					{ domain: LifeDomain; score: number; confidence: number },
				];
				strength: number;
		  }
		| undefined;
	convergenceTarget:
		| {
				facet: string;
				domains: readonly { domain: LifeDomain; score: number; confidence: number }[];
				strength: number;
		  }
		| undefined;
	phase: number;
	smoothedClarity: number;
} {
	// Relate strength
	const relateStrength = computeRelateStrength(currentEnergy, currentTelling);

	// Phase: mean confidence across all facets with evidence / C_MAX
	let sumConf = 0;
	let countConf = 0;
	for (const [, metrics] of facetMetrics) {
		if (metrics.confidence > 0) {
			sumConf += metrics.confidence;
			countConf++;
		}
	}
	const phase = countConf > 0 ? sumConf / countConf / OBSERVATION_FOCUS_CONSTANTS.C_MAX : 0;

	// Noticing: find the domain with the highest signal clarity
	// Clarity = max per-domain confidence across all facets for each domain
	const domainMaxConf = new Map<LifeDomain, number>();
	for (const [, metrics] of facetMetrics) {
		for (const [domain, weight] of metrics.domainWeights) {
			const conf = computePerDomainConfidence(weight);
			const current = domainMaxConf.get(domain) ?? 0;
			if (conf > current) domainMaxConf.set(domain, conf);
		}
	}

	let topDomain: LifeDomain | undefined;
	let topClarity = 0;
	for (const [domain, conf] of domainMaxConf) {
		if (conf > topClarity) {
			topClarity = conf;
			topDomain = domain;
		}
	}

	const smoothedClarity = computeSmoothedClarity(previousSmoothedClarity, topClarity);
	const noticingStrength = computeNoticingStrength(smoothedClarity);

	// Contradiction: find the facet with the highest score divergence between 2 domains
	let bestContradictionStrength = 0;
	let contradictionTarget:
		| {
				facet: string;
				pair: readonly [
					{ domain: LifeDomain; score: number; confidence: number },
					{ domain: LifeDomain; score: number; confidence: number },
				];
				strength: number;
		  }
		| undefined;

	for (const [facet, metrics] of facetMetrics) {
		const domainEntries = [...metrics.domainWeights.entries()];
		if (domainEntries.length < 2) continue;

		// Get per-domain confidences for this facet
		const domainConfs = domainEntries.map(([domain, weight]) => ({
			domain,
			confidence: computePerDomainConfidence(weight),
			score: metrics.score, // Facet-level score (same across domains for now)
		}));

		// Find pair with maximum confidence divergence
		for (let i = 0; i < domainConfs.length; i++) {
			for (let j = i + 1; j < domainConfs.length; j++) {
				const a = domainConfs[i]!;
				const b = domainConfs[j]!;
				// Delta: absolute difference in per-domain confidence
				const delta = Math.abs(a.confidence - b.confidence);
				const strength = computeContradictionStrength(delta, a.confidence, b.confidence);
				if (strength > bestContradictionStrength) {
					bestContradictionStrength = strength;
					contradictionTarget = {
						facet: facet as string,
						pair: [
							{ domain: a.domain, score: a.score, confidence: a.confidence },
							{ domain: b.domain, score: b.score, confidence: b.confidence },
						] as const,
						strength,
					};
				}
			}
		}
	}

	// Convergence: find the facet with most consistent scores across 3+ domains
	let bestConvergenceStrength = 0;
	let convergenceTarget:
		| {
				facet: string;
				domains: readonly { domain: LifeDomain; score: number; confidence: number }[];
				strength: number;
		  }
		| undefined;

	for (const [facet, metrics] of facetMetrics) {
		const domainEntries = [...metrics.domainWeights.entries()];
		if (domainEntries.length < 3) continue;

		const domainConfs = domainEntries.map(([domain, weight]) => ({
			domain,
			confidence: computePerDomainConfidence(weight),
			score: metrics.score,
		}));

		const confidences = domainConfs.map((d) => d.confidence);
		const maxConf = Math.max(...confidences);
		const minConf = Math.min(...confidences);
		const normalizedSpread = maxConf > 0 ? (maxConf - minConf) / maxConf : 0;

		const strength = computeConvergenceStrength(normalizedSpread, confidences);
		if (strength > bestConvergenceStrength) {
			bestConvergenceStrength = strength;
			convergenceTarget = {
				facet: facet as string,
				domains: domainConfs.map((d) => ({
					domain: d.domain,
					score: d.score,
					confidence: d.confidence,
				})),
				strength,
			};
		}
	}

	return {
		relateStrength,
		noticingStrength,
		contradictionStrength: bestContradictionStrength,
		convergenceStrength: bestConvergenceStrength,
		noticingDomain: topDomain,
		contradictionTarget,
		convergenceTarget,
		phase,
		smoothedClarity,
	};
}

/**
 * Count the number of non-Relate observation focus events from exchange history.
 * Uses the governorOutput field which stores the PromptBuilderInput.
 */
function countSharedFires(exchanges: ReadonlyArray<{ governorOutput?: unknown }>): number {
	let count = 0;
	for (const exchange of exchanges) {
		if (exchange.governorOutput && typeof exchange.governorOutput === "object") {
			const output = exchange.governorOutput as {
				intent?: string;
				observationFocus?: { type?: string };
			};
			if (output.observationFocus && output.observationFocus.type !== "relate") {
				count++;
			}
		}
	}
	return count;
}

/**
 * Runs the full Nerin pipeline with pacing integration.
 *
 * Atomic write: user message + assistant message are persisted together only after the LLM succeeds.
 * This eliminates orphan user messages when the LLM call fails.
 */
export const runNerinPipeline = (input: NerinPipelineInput) =>
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const exchangeRepo = yield* AssessmentExchangeRepository;
		const logger = yield* LoggerRepository;
		const nerin = yield* NerinAgentRepository;
		const evidenceRepo = yield* ConversationEvidenceRepository;
		const costGuard = yield* CostGuardRepository;

		const costKey = input.userId ?? input.sessionId;
		const t0 = Date.now();

		// ---- Gather context ----

		const session = yield* sessionRepo.getSession(input.sessionId);
		const isExtensionSession = !!session.parentSessionId;

		// Load all persisted messages — for authenticated users this spans all
		// sessions so Nerin sees one continuous conversation history.
		const savedMessages = yield* input.userId
			? messageRepo
					.getMessagesByUserId(input.userId)
					.pipe(Effect.catchAll(() => messageRepo.getMessages(input.sessionId)))
			: messageRepo.getMessages(input.sessionId);

		// Current session exchanges — needed for turn counting and message linking.
		const sessionExchanges = yield* exchangeRepo.findBySession(input.sessionId);

		// For authenticated users, load ALL exchanges/evidence across all sessions
		// for visit history, E_target seeding, and scoring coverage.
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

		// ---- Step 1: Compute E_target ----

		// All pipeline exchanges across all user sessions (skip opener turn 0)
		const allPipelineExchanges = allExchanges.filter((e) => e.turnNumber > 0);
		// Current session pipeline exchanges only (for session-specific state)
		const sessionPipelineExchanges = sessionExchanges.filter((e) => e.turnNumber > 0);

		const energyHistory = extractEnergyHistory(sessionPipelineExchanges);
		const tellingHistory = extractTellingHistory(sessionPipelineExchanges);

		// E_target priors: use current session's last exchange, or fall back to
		// the most recent exchange across all sessions (covers extension sessions).
		const lastSessionExchange =
			sessionPipelineExchanges.length > 0
				? sessionPipelineExchanges[sessionPipelineExchanges.length - 1]
				: null;
		const lastAnyExchange =
			allPipelineExchanges.length > 0 ? allPipelineExchanges[allPipelineExchanges.length - 1] : null;

		const priorExchange = lastSessionExchange ?? lastAnyExchange;
		const priorSmoothedEnergy = priorExchange?.smoothedEnergy ?? undefined;
		const priorSessionTrust = priorExchange?.sessionTrust ?? undefined;

		const eTargetResult = computeETargetV2({
			energyHistory,
			tellingHistory,
			priorSmoothedEnergy,
			priorSessionTrust,
		});

		// ---- Step 2: Score all territories ----

		const facetMetrics = computeFacetMetrics(allEvidence as any[]);

		// Visit history and current territory from all user exchanges
		const visitHistory = buildPacingVisitHistory(allPipelineExchanges);
		const currentTerritory = getCurrentTerritory(allPipelineExchanges);

		const scorerOutput = scoreAllTerritoriesV2({
			eTarget: eTargetResult.eTarget,
			facetMetrics,
			catalog: TERRITORY_CATALOG,
			currentTerritory,
			visitHistory,
			turnNumber,
			totalTurns,
			config: PACING_SCORER_DEFAULTS,
		});

		// ---- Step 3: Select territory ----

		// Seed for cold-start-perimeter deterministic selection (turn-based)
		const selectionSeed = turnNumber * 7919; // Prime-based seed for determinism
		const selectorOutput = selectTerritoryV2(scorerOutput, selectionSeed);
		const selectedTerritoryId = selectorOutput.selectedTerritory;

		// ---- Step 4: Compute observation focus strengths ----

		// Get current energy/telling from last exchange (or defaults for first turn)
		const currentEnergy = energyHistory.length > 0 ? energyHistory[energyHistory.length - 1]! : 0.5;
		const currentTelling =
			tellingHistory.length > 0 ? (tellingHistory[tellingHistory.length - 1] ?? 0.5) : 0.5;

		// Get previous smoothed clarity from exchange history
		// (stored as part of governor debug, but for simplicity we recompute)
		const previousSmoothedClarity = 0; // Will build up over exchanges

		const focusInputs = computeObservationFocusInputs(
			facetMetrics,
			currentEnergy,
			currentTelling,
			previousSmoothedClarity,
		);

		const sharedFireCount = countSharedFires(allPipelineExchanges);

		// ---- Step 5: Run Move Governor ----

		const territory = TERRITORY_CATALOG.get(selectedTerritoryId);
		const expectedEnergy = territory?.expectedEnergy ?? 0.5;
		const isFinalTurn = turnNumber >= totalTurns;

		const governorInput: MoveGovernorInput = {
			selectedTerritory: selectedTerritoryId,
			eTarget: eTargetResult.eTarget,
			turnNumber,
			isFinalTurn,
			expectedEnergy,
			previousTerritory: getCurrentTerritory(allPipelineExchanges),
			phase: focusInputs.phase,
			sharedFireCount,
			relateStrength: focusInputs.relateStrength,
			noticingStrength: focusInputs.noticingStrength,
			contradictionStrength: focusInputs.contradictionStrength,
			convergenceStrength: focusInputs.convergenceStrength,
			noticingDomain: focusInputs.noticingDomain,
			contradictionTarget: focusInputs.contradictionTarget as any,
			convergenceTarget: focusInputs.convergenceTarget as any,
		};

		const governorResult = computeGovernorOutput(governorInput);

		// ---- Step 6: Build system prompt via 2-layer prompt builder ----

		const promptResult = buildPrompt(governorResult.output);

		const tPacing = Date.now();

		logger.info("Pacing pipeline computed", {
			sessionId: input.sessionId,
			turnNumber,
			eTarget: +eTargetResult.eTarget.toFixed(3),
			smoothedEnergy: +eTargetResult.smoothedEnergy.toFixed(3),
			selectedTerritory: selectedTerritoryId,
			selectionRule: selectorOutput.selectionRule,
			governorIntent: governorResult.output.intent,
			entryPressure: governorResult.debug.entryPressure.level,
			observationFocus: governorResult.debug.observationGating.winner?.type ?? "relate",
			templateKey: promptResult.templateKey,
			isExtensionSession,
			topScoredTerritories: scorerOutput.ranked.slice(0, 3).map((t) => ({
				id: t.territoryId,
				score: +t.score.toFixed(3),
			})),
		});

		// ---- Step 7: Call Nerin with composed system prompt ----

		let analyzerTokenUsage: { input: number; output: number } | null = null;

		const result = yield* nerin
			.invoke({
				sessionId: input.sessionId,
				messages: domainMessages,
				systemPrompt: promptResult.systemPrompt,
			})
			.pipe(
				Effect.tapError((error) =>
					Effect.sync(() =>
						logger.error("Nerin invocation failed", {
							errorTag: error._tag,
							sessionId: input.sessionId,
							message: error.message,
						}),
					),
				),
			);

		const tNerin = Date.now();

		// ---- Step 8: Call ConversAnalyzer via three-tier extraction ----

		let pendingEvidence: ConversanalyzerV2Output["evidence"] = [];
		let observedEnergyBand: EnergyBand = "steady";
		let observedTellingBand: TellingBand = "mixed";
		let observedEnergy = 0.5;
		let observedTelling = 0.5;
		let withinMessageShift = false;
		let extractionTier: ExtractionTier | null = null;

		// Always run extraction (no more cold-start skip)
		if (turnNumber >= 1) {
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
			observedEnergyBand = evidenceResult.userState.energyBand;
			observedTellingBand = evidenceResult.userState.tellingBand;
			observedEnergy = mapEnergyBand(observedEnergyBand);
			observedTelling = mapTellingBand(observedTellingBand);
			withinMessageShift = evidenceResult.userState.withinMessageShift;

			const filteredEvidence = evidenceResult.evidence.filter(
				(e) => computeFinalWeight(e.strength, e.confidence) >= config.minEvidenceWeight,
			);

			logger.info("Evidence weights computed", {
				sessionId: input.sessionId,
				rawCount: evidenceResult.evidence.length,
				filteredCount: filteredEvidence.length,
				observedEnergyBand,
				observedTellingBand,
				extractionTier,
				evidence: filteredEvidence.map((e) => ({
					facet: e.bigfiveFacet,
					deviation: e.deviation,
					strength: e.strength,
					confidence: e.confidence,
					domain: e.domain,
					finalWeight: +computeFinalWeight(e.strength, e.confidence).toFixed(3),
				})),
			});

			if (filteredEvidence.length > 0) {
				pendingEvidence = filteredEvidence;
			}
		}

		const tExtraction = Date.now();

		// ---- Cost tracking ----

		const nerinCost = calculateCost(result.tokenCount.input, result.tokenCount.output);
		const analyzerCost = analyzerTokenUsage
			? calculateCost(analyzerTokenUsage.input, analyzerTokenUsage.output)
			: { totalCents: 0 };
		const totalCostCents = nerinCost.totalCents + analyzerCost.totalCents;

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

			// Per-session cost tracking (Story 31-6) — fail-open
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
			nerinCostCents: nerinCost.totalCents,
			analyzerCostCents: analyzerCost.totalCents,
			totalCostCents,
			exchangeNumber: turnNumber,
			dateKey: getUTCDateKey(),
		});

		const tCost = Date.now();

		// ---- Step 9: Save exchange + messages + evidence (two-phase model) ----
		//
		// Exchange #N links: AI message #N (question) + user message #N+1 (answer)
		// Phase A: Close previous exchange — link user message + extraction data
		// Phase B: Create new exchange — link AI message + steering data

		// Derive session phase and transition type
		const sessionPhase = deriveSessionPhase(turnNumber, totalTurns);
		const previousTerritory = getCurrentTerritory(allPipelineExchanges);
		const transitionType = previousTerritory
			? deriveTransitionType(selectedTerritoryId, previousTerritory)
			: ("transition" as const);

		// Previous exchange: opener (turn 0) or last pipeline exchange
		const previousExchangeId =
			sessionExchanges.length > 0 ? sessionExchanges[sessionExchanges.length - 1]?.id : null;

		// --- Phase A: Close previous exchange ---
		// Link user message to previous exchange (user is answering that AI question)
		const savedUserMessage = yield* messageRepo.saveMessage(
			input.sessionId,
			"user",
			input.userMessage,
			previousExchangeId ?? undefined,
		);

		if (previousExchangeId) {
			// Store extraction data on previous exchange
			yield* exchangeRepo.update(previousExchangeId, {
				energy: observedEnergy,
				energyBand: observedEnergyBand,
				telling: observedTelling,
				tellingBand: observedTellingBand,
				withinMessageShift,
				...(extractionTier != null ? { extractionTier } : {}),
			});
		}

		// Save evidence linked to user message and the exchange whose question prompted it.
		// Evidence only exists when turnNumber >= 1 (extraction skipped on turn 0),
		// so previousExchangeId is always non-null here.
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

		// Store steering data on new exchange
		yield* exchangeRepo.update(exchange.id, {
			// Pacing state
			smoothedEnergy: eTargetResult.smoothedEnergy,
			sessionTrust: eTargetResult.sessionTrust,
			drain: eTargetResult.drain,
			trustCap: eTargetResult.trustCap,
			eTarget: eTargetResult.eTarget,

			// Scoring
			scorerOutput: {
				ranked: scorerOutput.ranked.slice(0, 5).map((t) => ({
					id: t.territoryId,
					score: +t.score.toFixed(3),
				})),
			},

			// Selection
			selectedTerritory: selectedTerritoryId as string,
			selectionRule: selectorOutput.selectionRule === "cold-start-perimeter" ? "cold_start" : "argmax",

			// Governor
			governorOutput: governorResult.output,
			governorDebug: governorResult.debug,

			// Derived
			sessionPhase:
				sessionPhase === "opening" ? "opening" : sessionPhase === "closing" ? "closing" : "exploring",
			transitionType: transitionType === "continue" ? "normal" : "territory_change",
		});

		// Link AI message to new exchange
		yield* messageRepo.saveMessage(input.sessionId, "assistant", result.response, exchange.id);

		// Increment message_count atomically
		const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

		// Compute isFinalTurn from message count
		const isFinalTurnResult = messageCount >= config.freeTierMessageThreshold;

		// ---- Beat 2: Generate surfacing message on final turn ----

		let surfacingMessage: string | undefined;

		if (isFinalTurnResult) {
			const surfacingPrompt = buildSurfacingPrompt();

			// Build message history for surfacing — include the Beat 1 response
			const surfacingMessages: ReadonlyArray<DomainMessage> = [
				...domainMessages,
				{ id: `surfacing-ctx-${Date.now()}`, role: "assistant" as const, content: result.response },
			];

			const surfacingResult = yield* nerin
				.invoke({
					sessionId: input.sessionId,
					messages: surfacingMessages,
					systemPrompt: surfacingPrompt,
				})
				.pipe(
					Effect.tapError((error) =>
						Effect.sync(() =>
							logger.error("Surfacing message generation failed", {
								errorTag: error._tag,
								sessionId: input.sessionId,
								message: error.message,
							}),
						),
					),
				);

			surfacingMessage = surfacingResult.response;

			// Save surfacing message to DB (linked to closing exchange)
			yield* messageRepo.saveMessage(input.sessionId, "assistant", surfacingMessage, exchange.id);

			// Track surfacing cost — fail-open
			const surfacingCost = calculateCost(
				surfacingResult.tokenCount.input,
				surfacingResult.tokenCount.output,
			);
			if (surfacingCost.totalCents > 0) {
				yield* costGuard
					.incrementDailyCost(costKey, surfacingCost.totalCents)
					.pipe(Effect.catchAll(() => Effect.void));
				yield* costGuard
					.incrementSessionCost(input.sessionId, surfacingCost.totalCents)
					.pipe(Effect.catchAll(() => Effect.void));
			}

			logger.info("Surfacing message generated", {
				sessionId: input.sessionId,
				surfacingLength: surfacingMessage.length,
				surfacingTokenCount: surfacingResult.tokenCount,
			});

			// Transition session to "finalizing"
			yield* sessionRepo.updateSession(input.sessionId, { status: "finalizing" });
		}

		const tSave = Date.now();

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: result.response.length,
			tokenCount: result.tokenCount,
			messageCount,
			isFinalTurn: isFinalTurnResult,
			hasSurfacingMessage: !!surfacingMessage,
			selectedTerritory: selectedTerritoryId,
			observedEnergyBand,
			observedTellingBand,
			extractionTier,
			eTarget: +eTargetResult.eTarget.toFixed(3),
			governorIntent: governorResult.output.intent,
			evidenceCount: pendingEvidence.length,
			exchangeId: exchange.id,
			durationMs: {
				total: tSave - t0,
				gatherContext: tContext - t0,
				pacingPipeline: tPacing - tContext,
				nerinAgent: tNerin - tPacing,
				extraction: tExtraction - tNerin,
				costTracking: tCost - tExtraction,
				dbSave: tSave - tCost,
			},
		});

		return {
			response: result.response,
			isFinalTurn: isFinalTurnResult,
			...(surfacingMessage ? { surfacingMessage } : {}),
		} satisfies NerinPipelineOutput;
	});
