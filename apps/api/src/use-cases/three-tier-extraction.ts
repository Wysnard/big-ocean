/**
 * Three-Tier Extraction Pipeline (Story 24-2, Story 42-2)
 *
 * Orchestrates ConversAnalyzer extraction with graceful degradation:
 * - Tier 1: strict schema with retry (up to 3 attempts)
 * - Tier 2: lenient schema (1 attempt)
 * - Tier 3: neutral defaults (no LLM call)
 *
 * v2: Single combined call (analyze/analyzeLenient)
 * v3: Split into two independent calls — user state + evidence (Story 42-2)
 *
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

/** Neutral defaults for Tier 3 fallback — no LLM call */
export const NEUTRAL_DEFAULTS: ConversanalyzerV2Output = {
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

/**
 * Run the three-tier extraction pipeline.
 *
 * Tier 1: strict schema with `Effect.retry(Schedule.recurs(2))` — 3 attempts total
 * Tier 2: lenient schema via `Effect.orElse` — 1 attempt
 * Tier 3: `Effect.catchAll` returning NEUTRAL_DEFAULTS — no LLM call
 *
 * Returns the extraction result and which tier produced it.
 */
export const runThreeTierExtraction = (input: ThreeTierExtractionInput) =>
	Effect.gen(function* () {
		const conversanalyzer = yield* ConversanalyzerRepository;
		const logger = yield* LoggerRepository;

		const conversanalyzerInput = {
			message: input.message,
			recentMessages: input.recentMessages,
			domainDistribution: input.domainDistribution,
		};

		// Tier 1: strict schema × 3 attempts (initial + 2 retries)
		// Effect.suspend ensures analyze() is re-called on each retry attempt
		const tier1 = Effect.suspend(() => conversanalyzer.analyze(conversanalyzerInput)).pipe(
			Effect.retry(Schedule.recurs(2)),
			Effect.map(
				(output): ThreeTierExtractionOutput => ({
					output,
					extractionTier: 1 as ExtractionTier,
				}),
			),
		);

		// Orchestrate: Tier 1 → fallback to Tier 2 → fallback to Tier 3
		const result: ThreeTierExtractionOutput = yield* tier1.pipe(
			// Tier 2: lenient schema × 1 attempt (lazy — only runs if Tier 1 fails)
			Effect.catchAll((tier1Error) =>
				conversanalyzer.analyzeLenient(conversanalyzerInput).pipe(
					Effect.tap(() =>
						Effect.sync(() => {
							logger.warn("ConversAnalyzer fell back to Tier 2 (lenient schema)", {
								sessionId: input.sessionId,
								tier1Error: tier1Error.message,
							});
						}),
					),
					Effect.map(
						(output): ThreeTierExtractionOutput => ({
							output,
							extractionTier: 2 as ExtractionTier,
						}),
					),
				),
			),
			// Tier 3: neutral defaults — no LLM call (lazy — only runs if Tier 2 fails)
			Effect.catchAll((tier2Error) =>
				Effect.sync((): ThreeTierExtractionOutput => {
					logger.warn("ConversAnalyzer failed at all tiers, using Tier 3 neutral defaults", {
						sessionId: input.sessionId,
						tier2Error: tier2Error.message,
					});
					return {
						output: NEUTRAL_DEFAULTS,
						extractionTier: 3 as ExtractionTier,
					};
				}),
			),
		);

		logger.info("Three-tier extraction completed", {
			sessionId: input.sessionId,
			extractionTier: result.extractionTier,
			evidenceCount: result.output.evidence.length,
			energyBand: result.output.userState.energyBand,
			tellingBand: result.output.userState.tellingBand,
		});

		return result;
	});

// ─── v3 Split Extraction (Story 42-2) ────────────────────────────────────────

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

/** Output from the split three-tier extraction pipeline */
export interface SplitThreeTierExtractionOutput {
	readonly output: ConversanalyzerV2Output;
	readonly userStateTier: ExtractionTier;
	readonly evidenceTier: ExtractionTier;
}

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
 * Run the split three-tier extraction pipeline (Story 42-2).
 *
 * Calls user state extraction then evidence extraction sequentially.
 * Each call has its own independent three-tier fallback.
 * Returns combined output compatible with ConversanalyzerV2Output.
 */
export const runSplitThreeTierExtraction = (input: ThreeTierExtractionInput) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		// Call 1: User state extraction
		const userStateResult = yield* runUserStateExtraction(input);

		// Call 2: Evidence extraction (runs regardless of Call 1 outcome)
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

		logger.info("Split three-tier extraction completed", {
			sessionId: input.sessionId,
			userStateTier: userStateResult.tier,
			evidenceTier: evidenceResult.tier,
			evidenceCount: combined.evidence.length,
			energyBand: combined.userState.energyBand,
			tellingBand: combined.userState.tellingBand,
		});

		// Return as ThreeTierExtractionOutput for downstream compatibility
		// Use the worst (highest) tier number for the combined extraction tier
		const combinedTier = Math.max(userStateResult.tier, evidenceResult.tier) as ExtractionTier;

		return {
			output: combined,
			extractionTier: combinedTier,
		} satisfies ThreeTierExtractionOutput;
	});
