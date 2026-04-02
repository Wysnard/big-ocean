/**
 * Three-Tier Extraction Pipeline (Story 24-2, Story 42-2)
 *
 * Orchestrates ConversAnalyzer extraction with graceful degradation:
 * - Tier 1: strict schema with retry (up to 3 attempts)
 * - Tier 2: lenient schema (1 attempt)
 * - Tier 3: neutral defaults (no LLM call)
 *
 * Two independent parallel calls — user state + evidence — each with its own three-tier fallback.
 * The conversation never breaks due to extraction failure — it just becomes less steered.
 */

import type {
	ConversanalyzerEvidenceOutput,
	ConversanalyzerUserStateOutput,
	DomainDistribution,
} from "@workspace/domain";
import {
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
	type DomainMessage,
	type ExtractionTier,
	LoggerRepository,
} from "@workspace/domain";
import { Effect, Schedule } from "effect";

/** Input for the three-tier extraction pipeline */
export interface ThreeTierExtractionInput {
	readonly sessionId: string;
	readonly message: string;
	readonly recentMessages: readonly DomainMessage[];
	readonly domainDistribution: DomainDistribution;
}

/** Output from the three-tier extraction pipeline */
export interface ThreeTierExtractionOutput {
	readonly output: ConversanalyzerV2Output;
	readonly extractionTier: ExtractionTier;
}

/** Neutral defaults for user state — Tier 3 fallback */
const USER_STATE_NEUTRAL_DEFAULTS: ConversanalyzerUserStateOutput = {
	userState: {
		energyBand: "steady",
		tellingBand: "mixed",
		energyReason: "",
		tellingReason: "",
		withinMessageShift: false,
	},
	tokenUsage: { input: 0, output: 0 },
};

/** Neutral defaults for evidence — Tier 3 fallback */
const EVIDENCE_NEUTRAL_DEFAULTS: ConversanalyzerEvidenceOutput = {
	evidence: [],
	tokenUsage: { input: 0, output: 0 },
};

/**
 * Run user state extraction with three-tier fallback.
 * Tier 1: strict x3 → Tier 2: lenient x1 → Tier 3: neutral defaults
 */
export const runUserStateExtraction = (input: ThreeTierExtractionInput) =>
	Effect.gen(function* () {
		const conversanalyzer = yield* ConversanalyzerRepository;
		const logger = yield* LoggerRepository;

		const conversanalyzerInput = {
			message: input.message,
			recentMessages: input.recentMessages,
			domainDistribution: input.domainDistribution,
		};

		const tier1 = Effect.suspend(() => conversanalyzer.analyzeUserState(conversanalyzerInput)).pipe(
			Effect.retry(Schedule.recurs(2)),
			Effect.map((output) => ({
				output,
				tier: 1 as ExtractionTier,
			})),
		);

		const result = yield* tier1.pipe(
			Effect.catchAll((tier1Error) =>
				conversanalyzer.analyzeUserStateLenient(conversanalyzerInput).pipe(
					Effect.tap(() =>
						Effect.sync(() => {
							logger.warn("User state extraction fell back to Tier 2 (lenient)", {
								sessionId: input.sessionId,
								tier1Error: tier1Error.message,
							});
						}),
					),
					Effect.map((output) => ({
						output,
						tier: 2 as ExtractionTier,
					})),
				),
			),
			Effect.catchAll((tier2Error) =>
				Effect.sync(() => {
					logger.warn("User state extraction failed at all tiers, using neutral defaults", {
						sessionId: input.sessionId,
						tier2Error: tier2Error.message,
					});
					return {
						output: USER_STATE_NEUTRAL_DEFAULTS,
						tier: 3 as ExtractionTier,
					};
				}),
			),
		);

		return result;
	});

/**
 * Run evidence extraction with three-tier fallback.
 * Tier 1: strict x3 → Tier 2: lenient x1 → Tier 3: neutral defaults (empty array)
 */
export const runEvidenceExtraction = (input: ThreeTierExtractionInput) =>
	Effect.gen(function* () {
		const conversanalyzer = yield* ConversanalyzerRepository;
		const logger = yield* LoggerRepository;

		const conversanalyzerInput = {
			message: input.message,
			recentMessages: input.recentMessages,
			domainDistribution: input.domainDistribution,
		};

		const tier1 = Effect.suspend(() => conversanalyzer.analyzeEvidence(conversanalyzerInput)).pipe(
			Effect.retry(Schedule.recurs(2)),
			Effect.map((output) => ({
				output,
				tier: 1 as ExtractionTier,
			})),
		);

		const result = yield* tier1.pipe(
			Effect.catchAll((tier1Error) =>
				conversanalyzer.analyzeEvidenceLenient(conversanalyzerInput).pipe(
					Effect.tap(() =>
						Effect.sync(() => {
							logger.warn("Evidence extraction fell back to Tier 2 (lenient)", {
								sessionId: input.sessionId,
								tier1Error: tier1Error.message,
							});
						}),
					),
					Effect.map((output) => ({
						output,
						tier: 2 as ExtractionTier,
					})),
				),
			),
			Effect.catchAll((tier2Error) =>
				Effect.sync(() => {
					logger.warn("Evidence extraction failed at all tiers, using neutral defaults", {
						sessionId: input.sessionId,
						tier2Error: tier2Error.message,
					});
					return {
						output: EVIDENCE_NEUTRAL_DEFAULTS,
						tier: 3 as ExtractionTier,
					};
				}),
			),
		);

		return result;
	});

/**
 * Run the split three-tier extraction pipeline.
 *
 * Runs user state extraction first, then evidence extraction sequentially.
 * Each call has its own independent three-tier fallback — if user state fails,
 * evidence extraction still runs.
 * Returns combined output compatible with ConversanalyzerV2Output.
 *
 * Story 42-4: Changed from parallel to sequential (user state first, then evidence).
 */
export const runSplitThreeTierExtraction = (input: ThreeTierExtractionInput) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		// Run user state extraction first, then evidence extraction sequentially.
		// Both are independent — each has its own three-tier fallback.
		const userStateResult = yield* runUserStateExtraction(input);
		const evidenceResult = yield* runEvidenceExtraction(input);

		// Combine into the existing ConversanalyzerV2Output shape
		const combined: ConversanalyzerV2Output = {
			userState: userStateResult.output.userState,
			evidence: evidenceResult.output.evidence,
			tokenUsage: {
				input: userStateResult.output.tokenUsage.input + evidenceResult.output.tokenUsage.input,
				output: userStateResult.output.tokenUsage.output + evidenceResult.output.tokenUsage.output,
			},
		};

		logger.info("Three-tier extraction completed", {
			sessionId: input.sessionId,
			userStateTier: userStateResult.tier,
			evidenceTier: evidenceResult.tier,
			evidenceCount: combined.evidence.length,
			energyBand: combined.userState.energyBand,
			tellingBand: combined.userState.tellingBand,
		});

		// Use the worst (highest) tier number for the combined extraction tier
		const combinedTier = Math.max(userStateResult.tier, evidenceResult.tier) as ExtractionTier;

		return {
			output: combined,
			extractionTier: combinedTier,
		} satisfies ThreeTierExtractionOutput;
	});
