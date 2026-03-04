/**
 * Get Assessment Results Use Case
 *
 * Business logic for retrieving final assessment results.
 * Read-only after Story 11.1 — no lazy finalization. If session is not
 * "completed", returns SessionNotCompleted error.
 *
 * Reads persisted scores from assessment_results, generates OCEAN code,
 * looks up archetype, and computes overall confidence.
 *
 * Dependencies: AssessmentSessionRepository, AssessmentResultRepository, LoggerRepository
 */

import type { EvidenceInput } from "@workspace/domain";
import {
	AppConfig,
	AssessmentMessageRepository,
	AssessmentResultError,
	AssessmentResultRepository,
	AssessmentSessionRepository,
	BIG_FIVE_TRAITS,
	ConversationEvidenceRepository,
	CostGuardRepository,
	calculateConfidenceFromFacetScores,
	calculateCost,
	computeAllFacetResults,
	computeDomainCoverage,
	computeTraitResults,
	extract4LetterCode,
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetName,
	type FacetResult,
	type FacetScoresMap,
	generateOceanCode,
	getFacetLevel,
	LoggerRepository,
	lookupArchetype,
	PortraitRepository,
	PublicProfileRepository,
	SessionNotCompleted,
	SessionNotFound,
	TeaserPortraitRepository,
	TRAIT_LETTER_MAP,
	type TraitResult,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

export interface GetResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId?: string;
}

export interface GetResultsOutput {
	readonly oceanCode5: string;
	readonly oceanCode4: string;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly archetypeColor: string;
	readonly isCurated: boolean;
	readonly traits: readonly TraitResult[];
	readonly facets: readonly FacetResult[];
	readonly overallConfidence: number;
	readonly messageCount: number;
	readonly publicProfileId: string | null;
	readonly shareableUrl: string | null;
	readonly isPublic: boolean | null;
}

/**
 * Map trait score (0-120) to trait-specific level letter
 */
const mapScoreToLevel = (traitName: string, score: number): string => {
	const letters = TRAIT_LETTER_MAP[traitName as keyof typeof TRAIT_LETTER_MAP];
	if (score < 40) return letters[0];
	if (score < 80) return letters[1];
	return letters[2];
};

/**
 * Lazy finalization: scores + teaser portrait computed inline on first GET /results.
 * Idempotent — skips if assessment_results already exists at stage "scored" or "completed".
 */
const lazyFinalize = (sessionId: string, userId: string | null) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const logger = yield* LoggerRepository;
		const conversationEvidenceRepo = yield* ConversationEvidenceRepository;
		const assessmentResultRepo = yield* AssessmentResultRepository;
		const costGuardRepo = yield* CostGuardRepository;
		const teaserPortraitRepo = yield* TeaserPortraitRepository;
		const portraitRepo = yield* PortraitRepository;

		// Idempotency: check if already scored/completed
		const existingResult = yield* assessmentResultRepo.getBySessionId(sessionId);
		if (existingResult?.stage === "completed" || existingResult?.stage === "scored") {
			// Already done — just ensure session is marked completed
			if (existingResult.stage === "scored") {
				yield* assessmentResultRepo.updateStage(sessionId, "completed");
				yield* sessionRepo.updateSession(sessionId, {
					status: "completed",
					finalizationProgress: "completed",
				});
			}
			return;
		}

		// Acquire lock to prevent concurrent finalization
		const lockAcquired = yield* sessionRepo.acquireSessionLock(sessionId).pipe(
			Effect.map(() => true),
			Effect.catchTag("ConcurrentMessageError", () => Effect.succeed(false)),
		);

		if (!lockAcquired) {
			// Another request is already finalizing — wait and retry read
			// For simplicity, just fail with a retriable error message
			return yield* Effect.fail(
				new AssessmentResultError({
					message: "Results are being generated, please retry in a few seconds",
				}),
			);
		}

		yield* Effect.gen(function* () {
			// Fetch conversation evidence
			const conversationEvidence = yield* conversationEvidenceRepo.findBySession(sessionId);
			const scoringInputs: EvidenceInput[] = conversationEvidence.map((ev) => ({
				bigfiveFacet: ev.bigfiveFacet,
				deviation: ev.deviation as -3 | -2 | -1 | 0 | 1 | 2 | 3,
				strength: ev.strength,
				confidence: ev.confidence,
				domain: ev.domain,
			}));

			logger.info("Lazy finalization: scoring from conversation evidence", {
				sessionId,
				evidenceCount: conversationEvidence.length,
			});

			// Compute scores
			const facets = computeAllFacetResults(scoringInputs);
			const traits = computeTraitResults(facets);
			const domainCoverage = computeDomainCoverage(scoringInputs);

			// Generate teaser portrait
			const teaserOutput = yield* teaserPortraitRepo
				.generateTeaser({
					sessionId,
					evidence: conversationEvidence,
					scoringEvidence: scoringInputs,
				})
				.pipe(Effect.retry(Schedule.once));

			// Track teaser cost (fail-open)
			const teaserCostKey = userId ?? sessionId;
			const teaserCost = calculateCost(teaserOutput.tokenUsage.input, teaserOutput.tokenUsage.output);
			yield* costGuardRepo.incrementDailyCost(teaserCostKey, teaserCost.totalCents).pipe(
				Effect.catchTag("RedisOperationError", (err) => {
					logger.warn("Failed to track teaser portrait cost (non-blocking)", {
						error: err.message,
						sessionId,
					});
					return Effect.succeed(0);
				}),
			);

			// Upsert assessment_results with scores + portrait
			const upsertedResult = yield* assessmentResultRepo.upsert({
				assessmentSessionId: sessionId,
				facets,
				traits,
				domainCoverage,
				portrait: teaserOutput.portrait,
				stage: "scored",
			});

			// Store teaser in portraits table
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

			// Mark completed
			yield* assessmentResultRepo.updateStage(sessionId, "completed");
			yield* sessionRepo.updateSession(sessionId, {
				status: "completed",
				finalizationProgress: "completed",
			});

			logger.info("Lazy finalization complete", { sessionId });
		}).pipe(Effect.ensuring(sessionRepo.releaseSessionLock(sessionId).pipe(Effect.orDie)));
	});

/**
 * Get Assessment Results Use Case
 *
 * 1. Validates session exists and is completed (or lazily finalizes if "finalizing")
 * 2. Reads persisted facet/trait scores from AssessmentResultRepository
 * 3. Generates OCEAN codes, looks up archetype
 * 4. Computes overall confidence (mean of all facet confidences)
 */
export const getResults = (input: GetResultsInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const profileRepo = yield* PublicProfileRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// 1. Validate session exists
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Ownership guard
		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		// 2. Lazy finalization: if session is "finalizing", compute scores + portrait inline
		if (session.status === "finalizing") {
			yield* lazyFinalize(input.sessionId, session.userId);
		} else if (session.status !== "completed") {
			return yield* Effect.fail(
				new SessionNotCompleted({
					sessionId: input.sessionId,
					currentStatus: session.status,
					message: `Session is '${session.status}', results are not ready yet`,
				}),
			);
		}

		// 3. Fetch messages for count
		const messages = yield* messageRepo.getMessages(input.sessionId);

		// 4. Read persisted scores from assessment_results
		const result = yield* resultRepo.getBySessionId(input.sessionId);
		if (!result || Object.keys(result.facets).length === 0) {
			return yield* Effect.fail(
				new AssessmentResultError({
					message: `Assessment results not found for completed session '${input.sessionId}'`,
				}),
			);
		}

		// Extract FacetScoresMap (score + confidence, ignoring signalPower)
		const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
		for (const [facetName, data] of Object.entries(result.facets)) {
			facetScoresMap[facetName as FacetName] = {
				score: data.score,
				confidence: data.confidence,
			};
		}

		// Recompute trait scores from facets (single source of truth)
		const computedTraits = computeTraitResults(facetScoresMap);

		// 5. Generate OCEAN codes
		const oceanCode5 = generateOceanCode(facetScoresMap);
		const oceanCode4 = extract4LetterCode(oceanCode5);

		// 6. Lookup archetype
		const archetype = lookupArchetype(oceanCode4);

		// 7. Compute overall confidence (mean of all 30 facet confidences, 0-1 scale)
		const overallConfidence =
			Math.round(calculateConfidenceFromFacetScores(facetScoresMap) * 100) / 100;

		// 8. Build trait results array
		const traits: TraitResult[] = BIG_FIVE_TRAITS.map((traitName) => {
			const traitScore = computedTraits[traitName];
			return {
				name: traitName,
				score: Math.round(traitScore.score),
				level: mapScoreToLevel(traitName, traitScore.score),
				confidence: traitScore.confidence,
			};
		});

		// 9. Build facet results array with level fields (Story 11.4)
		const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => {
			const facetData = facetScoresMap[facetName];
			const level = getFacetLevel(facetName, facetData.score);
			const levelLabel = FACET_LEVEL_LABELS[level];
			// Cast needed: TS can't narrow level to specific facet's valid codes
			const levelDescription =
				FACET_DESCRIPTIONS[facetName].levels[
					level as keyof (typeof FACET_DESCRIPTIONS)[typeof facetName]["levels"]
				];
			// Type guard: getFacetLevel guarantees valid level code for this facet
			if (levelDescription === undefined) {
				throw new Error(`Missing facet description for ${facetName}:${level}`);
			}
			return {
				name: facetName,
				traitName: FACET_TO_TRAIT[facetName],
				score: Math.round(facetData.score),
				confidence: facetData.confidence,
				level,
				levelLabel,
				levelDescription,
			};
		});

		// 10. Ensure public profile exists for authenticated users (private by default)
		let existingProfile = yield* profileRepo
			.getProfileBySessionId(input.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed(null)));

		if (existingProfile === null && input.authenticatedUserId != null) {
			existingProfile = yield* profileRepo
				.createProfile({
					sessionId: input.sessionId,
					userId: input.authenticatedUserId,
					oceanCode5,
					oceanCode4,
				})
				.pipe(Effect.catchAll(() => Effect.succeed(null)));
		}

		logger.info("Assessment results retrieved", {
			sessionId: input.sessionId,
			oceanCode5,
			oceanCode4,
			archetypeName: archetype.name,
			overallConfidence,
		});

		return {
			oceanCode5,
			oceanCode4,
			archetypeName: archetype.name,
			archetypeDescription: archetype.description,
			archetypeColor: archetype.color,
			isCurated: archetype.isCurated,
			traits,
			facets,
			overallConfidence,
			messageCount: messages.length,
			publicProfileId: existingProfile?.id ?? null,
			shareableUrl: existingProfile
				? `${config.frontendUrl}/public-profile/${existingProfile.id}`
				: null,
			isPublic: existingProfile?.isPublic ?? null,
		} satisfies GetResultsOutput;
	});
