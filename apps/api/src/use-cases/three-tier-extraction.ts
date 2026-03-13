/**
 * Three-Tier Extraction Pipeline (Story 24-2)
 *
 * Orchestrates ConversAnalyzer v2 extraction with graceful degradation:
 * - Tier 1: `analyze(input)` with retry (strict schema, up to 3 attempts)
 * - Tier 2: `analyzeLenient(input)` (lenient schema, 1 attempt)
 * - Tier 3: neutral defaults (no LLM call)
 *
 * The conversation never breaks due to extraction failure — it just becomes less steered.
 */

import {
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
	type DomainMessage,
	type ExtractionTier,
	LoggerRepository,
} from "@workspace/domain";
import type { DomainDistribution } from "@workspace/domain";
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
			Effect.orElse(() =>
				conversanalyzer.analyzeLenient(conversanalyzerInput).pipe(
					Effect.tap(() =>
						Effect.sync(() => {
							logger.warn("ConversAnalyzer fell back to Tier 2 (lenient schema)", {
								sessionId: input.sessionId,
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
			Effect.orElse(() =>
				Effect.sync((): ThreeTierExtractionOutput => {
					logger.warn(
						"ConversAnalyzer failed at all tiers, using Tier 3 neutral defaults",
						{
							sessionId: input.sessionId,
						},
					);
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
