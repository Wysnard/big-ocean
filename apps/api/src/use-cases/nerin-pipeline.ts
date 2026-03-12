/**
 * Nerin Pipeline -- Territory-Based 8-Step Orchestration (Story 21-7)
 *
 * Replaces the old facet-targeted steering with territory-based conversation steering.
 * Clean cut migration -- no backward compatibility shim or feature flag.
 *
 * Story 23-3: Refactored to use assessment_exchange for per-turn state storage.
 * Territory, energy level, and other pipeline metadata now stored on exchange rows
 * instead of message columns.
 *
 * 8-step orchestration:
 * 1. computeDRS() -- depth readiness from coverage, engagement, energy history
 * 2. scoreAllTerritories() -- rank territories by coverage, energy fit, freshness
 * 3. selectTerritory() -- pick best territory (or cold-start for first N messages)
 * 4. buildNerinPrompt() -- look up territory from catalog for Nerin guidance
 * 5. callNerin() -- invoke Nerin with territory-contextualized prompt
 * 6. callConversAnalyzer() -- analyze current exchange for evidence + energy
 * 7. saveEvidence() -- persist extracted evidence
 * 8. saveExchangeMetadata() -- store pipeline state on assessment_exchange
 */

import {
	AppConfig,
	AssessmentExchangeRepository,
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateDomainDistribution,
	buildFacetEvidenceCounts,
	buildTerritoryPrompt,
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
	ConversationEvidenceRepository,
	CostGuardRepository,
	calculateCost,
	computeDRS,
	computeFinalWeight,
	type DomainMessage,
	extractDRSConfig,
	extractTerritoryScorerConfig,
	GREETING_MESSAGES,
	getUTCDateKey,
	LoggerRepository,
	NerinAgentRepository,
	scoreAllTerritories,
	selectTerritoryWithColdStart,
	TERRITORY_CATALOG,
	type TerritoryId,
	TerritoryIdSchema,
	type TerritoryVisitHistory,
} from "@workspace/domain";
import { Effect, Schedule, Schema } from "effect";

/** Helper to create branded TerritoryId */
const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

/**
 * Default cold-start territories — light-energy territories for the first
 * few messages before scoring takes over. These are curated light-energy
 * territories selected for broad appeal and low emotional stakes.
 */
const COLD_START_TERRITORIES: readonly TerritoryId[] = [
	tid("creative-pursuits"),
	tid("weekend-adventures"),
	tid("social-circles"),
] as const;

/** Max user messages that count as cold start: 1 greeting + 1 opening question = 2 assistant msgs before user replies */
const COLD_START_USER_MSG_THRESHOLD = GREETING_MESSAGES.length + 1;

export interface NerinPipelineInput {
	readonly sessionId: string;
	readonly userId?: string;
	readonly userMessage: string;
}

export interface NerinPipelineOutput {
	readonly response: string;
	readonly isFinalTurn: boolean;
}

// ---- Helpers ----

/**
 * Build territory visit history from previous exchange records.
 * Exchanges without selectedTerritory are skipped.
 */
function buildVisitHistory(
	exchanges: ReadonlyArray<{
		selectedTerritory?: string | null;
		turnNumber: number;
	}>,
): TerritoryVisitHistory {
	const visits = new Map<TerritoryId, { visitCount: number; lastVisitExchange: number }>();

	for (const exchange of exchanges) {
		if (exchange.selectedTerritory) {
			const tid = exchange.selectedTerritory as TerritoryId;
			const existing = visits.get(tid);
			if (existing) {
				visits.set(tid, {
					visitCount: existing.visitCount + 1,
					lastVisitExchange: exchange.turnNumber,
				});
			} else {
				visits.set(tid, {
					visitCount: 1,
					lastVisitExchange: exchange.turnNumber,
				});
			}
		}
	}

	return visits;
}

/**
 * Extract last N observed energy values from exchange records (most recent first).
 * Energy is stored as a continuous [0, 1] value on the exchange.
 */
function extractLastEnergyValues(
	exchanges: ReadonlyArray<{
		energy?: number | null;
	}>,
	count: number,
): number[] {
	const values: number[] = [];
	for (let i = exchanges.length - 1; i >= 0 && values.length < count; i--) {
		const exchange = exchanges[i];
		if (exchange?.energy != null) {
			values.push(exchange.energy);
		}
	}
	return values;
}

/**
 * Extract last N word counts from user messages (most recent first).
 */
function extractLastWordCounts(
	userMessages: ReadonlyArray<{ content: string }>,
	count: number,
): number[] {
	const counts: number[] = [];
	for (let i = userMessages.length - 1; i >= 0 && counts.length < count; i--) {
		const msg = userMessages[i];
		if (msg) {
			counts.push(msg.content.split(/\s+/).filter(Boolean).length);
		}
	}
	return counts;
}

/**
 * Build per-message evidence counts from evidence records.
 * Returns counts for the last N user messages (most recent first).
 */
function extractLastEvidenceCounts(
	evidenceRecords: ReadonlyArray<{ messageId: string }>,
	userMessageIds: readonly string[],
	count: number,
): number[] {
	// Build messageId -> evidence count map
	const countsByMessage = new Map<string, number>();
	for (const record of evidenceRecords) {
		countsByMessage.set(record.messageId, (countsByMessage.get(record.messageId) ?? 0) + 1);
	}

	// Get counts for last N user messages (most recent first)
	const counts: number[] = [];
	for (let i = userMessageIds.length - 1; i >= 0 && counts.length < count; i--) {
		const msgId = userMessageIds[i];
		if (msgId) {
			counts.push(countsByMessage.get(msgId) ?? 0);
		}
	}
	return counts;
}

/**
 * Runs the full Nerin pipeline: territory steering -> Nerin -> ConversAnalyzer -> save.
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
		const conversanalyzer = yield* ConversanalyzerRepository;
		const evidenceRepo = yield* ConversationEvidenceRepository;
		const costGuard = yield* CostGuardRepository;

		const costKey = input.userId ?? input.sessionId;

		// ---- Gather context ----

		// Get all messages for context (does NOT include current user message)
		const previousMessages = yield* messageRepo.getMessages(input.sessionId);

		// Get previous exchanges for pipeline state
		const previousExchanges = yield* exchangeRepo.findBySession(input.sessionId);

		// Map DB entities to domain messages + append current user message in-memory
		const domainMessages: DomainMessage[] = [
			...previousMessages.map((msg) => ({
				id: msg.id,
				role: msg.role,
				content: msg.content,
			})),
			{ id: `pending-${Date.now()}`, role: "user" as const, content: input.userMessage },
		];

		// Partition messages by role
		const userMessages = previousMessages.filter((m) => m.role === "user");
		const userMessageCount = userMessages.length;

		// Get existing evidence for DRS/scoring
		const existingEvidence = yield* evidenceRepo.findBySession(input.sessionId);

		// ---- Steps 1-4: Territory Steering ----

		let selectedTerritoryId: TerritoryId;
		let drsValue = 0;
		let analyzerTokenUsage: { input: number; output: number } | null = null;

		if (userMessageCount >= COLD_START_USER_MSG_THRESHOLD) {
			// Step 1: Compute DRS
			const drsConfig = extractDRSConfig(config);
			const scorerConfig = extractTerritoryScorerConfig(config);

			const facetEvidenceCounts = buildFacetEvidenceCounts(existingEvidence);
			const coveredFacets = facetEvidenceCounts.size;

			const lastWordCounts = extractLastWordCounts(userMessages, 3);
			const lastEvidenceCounts = extractLastEvidenceCounts(
				existingEvidence,
				userMessages.map((m) => m.id),
				3,
			);
			const lastEnergyValues = extractLastEnergyValues(previousExchanges, 3);

			drsValue = computeDRS(
				{
					coveredFacets,
					lastWordCounts,
					lastEvidenceCounts,
					lastEnergyValues,
				},
				drsConfig,
			);

			// Step 2: Score all territories
			const visitHistory = buildVisitHistory(previousExchanges);
			const currentExchange = previousExchanges.length;

			const scoredTerritories = scoreAllTerritories(
				TERRITORY_CATALOG,
				facetEvidenceCounts,
				drsValue,
				visitHistory,
				currentExchange,
				drsConfig,
				scorerConfig,
			);

			// Step 3: Select territory (scoring path)
			const steeringOutput = selectTerritoryWithColdStart({
				messageCount: userMessageCount,
				coldStartThreshold: config.territoryColdStartThreshold,
				coldStartTerritories: COLD_START_TERRITORIES,
				scoredTerritories,
			});

			selectedTerritoryId = steeringOutput.territoryId;

			logger.info("Territory steering computed", {
				sessionId: input.sessionId,
				drs: +drsValue.toFixed(3),
				selectedTerritory: selectedTerritoryId,
				coveredFacets,
				userMessageCount,
				topScoredTerritories: scoredTerritories.slice(0, 3).map((t) => ({
					id: t.territory.id,
					score: +t.score.toFixed(3),
					coverage: +t.coverageValue.toFixed(3),
					energyFit: +t.energyFit.toFixed(3),
					freshness: +t.freshnessBonus.toFixed(3),
				})),
			});
		} else {
			// Step 3 (cold-start path): Select from cold-start territories
			const steeringOutput = selectTerritoryWithColdStart({
				messageCount: userMessageCount,
				coldStartThreshold: config.territoryColdStartThreshold,
				coldStartTerritories: COLD_START_TERRITORIES,
				scoredTerritories: [],
			});

			selectedTerritoryId = steeringOutput.territoryId;

			logger.info("Cold-start territory selected", {
				sessionId: input.sessionId,
				selectedTerritory: selectedTerritoryId,
				userMessageCount,
			});
		}

		// Step 4: Build Nerin prompt from territory catalog
		const territoryPrompt = buildTerritoryPrompt({ territoryId: selectedTerritoryId });

		// Step 5: Call Nerin with territory-contextualized prompt
		const result = yield* nerin
			.invoke({
				sessionId: input.sessionId,
				messages: domainMessages,
				territoryPrompt,
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

		// Step 6: Call ConversAnalyzer v2 (post-Nerin per FR16)
		let pendingEvidence: ConversanalyzerV2Output["evidence"] = [];
		let observedEnergyLevel = "medium";

		if (userMessageCount >= COLD_START_USER_MSG_THRESHOLD) {
			const domainDistribution = aggregateDomainDistribution(existingEvidence);
			const recentMessages: DomainMessage[] = domainMessages.slice(-6);

			const neutralV2Default: ConversanalyzerV2Output = {
				userState: {
					energyBand: "steady",
					tellingBand: "mixed",
					energyReason: "",
					tellingReason: "",
					withinMessageShift: false,
				},
				evidence: [],
				tokenUsage: { input: 0, output: 0 },
			};

			const evidenceResult = yield* conversanalyzer
				.analyze({
					message: input.userMessage,
					recentMessages,
					domainDistribution,
				})
				.pipe(
					Effect.retry(Schedule.recurs(2)),
					Effect.catchAll((error) =>
						Effect.sync(() => {
							logger.warn("ConversAnalyzer failed after 3 attempts, skipping", {
								error: error.message,
								sessionId: input.sessionId,
							});
							return neutralV2Default;
						}),
					),
				);

			analyzerTokenUsage = evidenceResult.tokenUsage;
			// Bridge v2 energyBand to v1 observedEnergyLevel for downstream compatibility
			const band = evidenceResult.userState.energyBand;
			observedEnergyLevel =
				band === "minimal" || band === "low"
					? "light"
					: band === "high" || band === "very_high"
						? "heavy"
						: "medium";

			const filteredEvidence = evidenceResult.evidence.filter(
				(e) => computeFinalWeight(e.strength, e.confidence) >= config.minEvidenceWeight,
			);

			logger.info("Evidence weights computed", {
				sessionId: input.sessionId,
				rawCount: evidenceResult.evidence.length,
				filteredCount: filteredEvidence.length,
				observedEnergyLevel,
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

		// Cost tracking
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
		}

		logger.info("Cost tracked", {
			sessionId: input.sessionId,
			costKey,
			nerinCostCents: nerinCost.totalCents,
			analyzerCostCents: analyzerCost.totalCents,
			totalCostCents,
			dateKey: getUTCDateKey(),
		});

		// Create exchange row for this turn
		const turnNumber = previousExchanges.length + 1;
		const exchange = yield* exchangeRepo.create(input.sessionId, turnNumber);

		// Update exchange with pipeline state
		yield* exchangeRepo.update(exchange.id, {
			selectedTerritory: selectedTerritoryId as string,
			selectionRule: userMessageCount < COLD_START_USER_MSG_THRESHOLD ? "cold_start" : "argmax",
		});

		// Step 7: Save messages and evidence atomically
		const savedUserMessage = yield* messageRepo.saveMessage(
			input.sessionId,
			"user",
			input.userMessage,
			exchange.id,
		);

		if (pendingEvidence.length > 0) {
			yield* evidenceRepo.save(
				pendingEvidence.map((e) => ({
					...e,
					sessionId: input.sessionId,
					messageId: savedUserMessage.id,
				})),
			);
		}

		// Save assistant message linked to same exchange
		yield* messageRepo.saveMessage(input.sessionId, "assistant", result.response, exchange.id);

		// Increment message_count atomically
		const messageCount = yield* sessionRepo.incrementMessageCount(input.sessionId);

		// Compute isFinalTurn
		const isFinalTurn = messageCount >= config.freeTierMessageThreshold;

		// Transition session to "finalizing" on final turn
		if (isFinalTurn) {
			yield* sessionRepo.updateSession(input.sessionId, { status: "finalizing" });
		}

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: result.response.length,
			tokenCount: result.tokenCount,
			messageCount,
			isFinalTurn,
			selectedTerritory: selectedTerritoryId,
			observedEnergyLevel,
			drs: +drsValue.toFixed(3),
			evidenceCount: pendingEvidence.length,
			exchangeId: exchange.id,
		});

		return {
			response: result.response,
			isFinalTurn,
		} satisfies NerinPipelineOutput;
	});
