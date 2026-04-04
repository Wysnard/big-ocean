/**
 * Three-Tier Extraction Pipeline (Story 24-2, Story 42-2, Story 43-6)
 *
 * Orchestrates ConversAnalyzer evidence extraction with graceful degradation:
 * - Tier 1: strict schema with retry (up to 3 attempts)
 * - Tier 2: lenient schema (1 attempt)
 * - Tier 3: neutral defaults (no LLM call)
 *
 * User-state extraction removed in Story 43-6 — Director reads energy/telling
 * natively from conversation history.
 */

import type { ConversanalyzerEvidenceOutput, DomainDistribution } from "@workspace/domain";
import {
	ConversanalyzerRepository,
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
	readonly output: ConversanalyzerEvidenceOutput;
	readonly extractionTier: ExtractionTier;
}

/** Neutral defaults for evidence — Tier 3 fallback */
const EVIDENCE_NEUTRAL_DEFAULTS: ConversanalyzerEvidenceOutput = {
	evidence: [],
	tokenUsage: { input: 0, output: 0 },
};

/**
 * Run evidence extraction with three-tier fallback.
 * Tier 1: strict x3 -> Tier 2: lenient x1 -> Tier 3: neutral defaults (empty array)
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

		logger.info("Three-tier extraction completed", {
			sessionId: input.sessionId,
			extractionTier: result.tier,
			evidenceCount: result.output.evidence.length,
		});

		return {
			output: result.output,
			extractionTier: result.tier,
		} satisfies ThreeTierExtractionOutput;
	});
