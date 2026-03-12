/**
 * Depth Readiness Score (DRS) — Story 21-2, evolved Story 23-2
 *
 * The single metric driving conversation energy pacing.
 * Pure functions — no Effect dependencies. All configurable via DRSConfig.
 *
 * DRS = (breadthWeight * Breadth + engagementWeight * Engagement) * EnergyMultiplier
 *
 * Evolved to use continuous expectedEnergy [0, 1] instead of categorical EnergyLevel.
 *
 * See architecture-conversation-experience-evolution.md ADR-CEE-3 for full specification.
 */
import type { AppConfigService } from "../../config/app-config";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * DRS configuration — extracted from AppConfig for pure function usage.
 * All formula parameters are configurable, no magic numbers.
 */
export interface DRSConfig {
	readonly breadthWeight: number;
	readonly engagementWeight: number;
	readonly breadthOffset: number;
	readonly breadthRange: number;
	readonly wordCountThreshold: number;
	readonly evidenceThreshold: number;
	readonly engagementWordWeight: number;
	readonly engagementEvidenceWeight: number;
	readonly recencyWeights: readonly number[];
	readonly energyWeightLight: number;
	readonly energyWeightMedium: number;
	readonly energyWeightHeavy: number;
	readonly lightFitCenter: number;
	readonly lightFitRange: number;
	readonly mediumFitCenter: number;
	readonly mediumFitRange: number;
	readonly heavyFitCenter: number;
	readonly heavyFitRange: number;
}

/**
 * Input for computing DRS. Caller provides aggregated data from the conversation.
 */
export interface DRSInput {
	/** Number of facets with at least some evidence */
	readonly coveredFacets: number;
	/** Word counts of the last N user messages (most recent first) */
	readonly lastWordCounts: readonly number[];
	/** Evidence counts per message for last N messages (most recent first) */
	readonly lastEvidenceCounts: readonly number[];
	/** Observed energy values for last N messages (most recent first), continuous [0, 1] */
	readonly lastEnergyValues: readonly number[];
}

// ─── Utility ────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function average(values: readonly number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ─── Component Functions ────────────────────────────────────────────

/**
 * Breadth component: how many facets have been covered.
 * Returns 0 when below offset, scales linearly, caps at 1.
 *
 * Breadth = clamp((coveredFacets - offset) / range, 0, 1)
 */
export function computeBreadth(coveredFacets: number, config: DRSConfig): number {
	return clamp((coveredFacets - config.breadthOffset) / config.breadthRange, 0, 1);
}

/**
 * Engagement component: behavioral signals from recent messages.
 * Combines word count and evidence density.
 *
 * word = clamp(avgWordCount / threshold, 0, 1)
 * evid = clamp(avgEvidence / threshold, 0, 1)
 * Engagement = clamp(wordWeight * word + evidWeight * evid, 0, 1)
 */
export function computeEngagement(
	wordCounts: readonly number[],
	evidenceCounts: readonly number[],
	config: DRSConfig,
): number {
	if (wordCounts.length === 0) return 0;

	const word = clamp(average(wordCounts) / config.wordCountThreshold, 0, 1);
	const evid = clamp(average(evidenceCounts) / config.evidenceThreshold, 0, 1);

	return clamp(config.engagementWordWeight * word + config.engagementEvidenceWeight * evid, 0, 1);
}

/**
 * Derive an energy weight from a continuous energy value using the
 * configured light/medium/heavy weights. Uses linear interpolation:
 * - [0, 0.38) maps from energyWeightLight toward energyWeightMedium
 * - [0.38, 0.55) maps from energyWeightMedium toward energyWeightHeavy
 * - [0.55, 1.0] maps from energyWeightMedium toward energyWeightHeavy
 */
function energyValueToWeight(energy: number, config: DRSConfig): number {
	if (energy < 0.38) {
		// Light range: interpolate from light to medium weight
		const t = energy / 0.38;
		return config.energyWeightLight + t * (config.energyWeightMedium - config.energyWeightLight);
	}
	if (energy < 0.55) {
		// Medium range: interpolate from medium toward heavy
		const t = (energy - 0.38) / (0.55 - 0.38);
		return config.energyWeightMedium + t * (config.energyWeightHeavy - config.energyWeightMedium);
	}
	// Heavy range
	return config.energyWeightHeavy;
}

/**
 * Energy multiplier: recency-weighted pressure from observed energy values.
 * High pressure from heavy energy suppresses DRS, causing recovery via lighter topics.
 *
 * energyPressure = sum(recencyWeight[i] * energyWeight(value)) / maxPossiblePressure
 * EnergyMultiplier = clamp(1 - energyPressure, 0, 1)
 */
export function computeEnergyMultiplier(
	energyValues: readonly number[],
	config: DRSConfig,
): number {
	if (energyValues.length === 0) return 1;

	const maxEnergyWeight = Math.max(
		config.energyWeightLight,
		config.energyWeightMedium,
		config.energyWeightHeavy,
	);

	// Use only the recency weights for available data
	const usedRecencyWeights = config.recencyWeights.slice(0, energyValues.length);

	let weightedSum = 0;
	let maxPossiblePressure = 0;

	for (let i = 0; i < energyValues.length; i++) {
		const recencyWeight = usedRecencyWeights[i] ?? 0;
		const eWeight = energyValueToWeight(energyValues[i]!, config);
		weightedSum += recencyWeight * eWeight;
		maxPossiblePressure += recencyWeight * maxEnergyWeight;
	}

	if (maxPossiblePressure === 0) return 1;

	const energyPressure = weightedSum / maxPossiblePressure;
	return clamp(1 - energyPressure, 0, 1);
}

// ─── Main DRS Function ──────────────────────────────────────────────

/**
 * Compute the Depth Readiness Score (DRS).
 *
 * DRS = (breadthWeight * Breadth + engagementWeight * Engagement) * EnergyMultiplier
 *
 * Returns a value between 0 and 1:
 * - ~0.1-0.3: Early conversation, favors light territories
 * - ~0.4-0.6: Mid conversation, favors medium territories
 * - ~0.7+: Late conversation, favors heavy territories
 */
export function computeDRS(input: DRSInput, config: DRSConfig): number {
	const breadth = computeBreadth(input.coveredFacets, config);
	const engagement = computeEngagement(input.lastWordCounts, input.lastEvidenceCounts, config);
	const energyMultiplier = computeEnergyMultiplier(input.lastEnergyValues, config);

	const raw =
		(config.breadthWeight * breadth + config.engagementWeight * engagement) * energyMultiplier;

	return clamp(raw, 0, 1);
}

// ─── Energy Fit ─────────────────────────────────────────────────────

/**
 * Compute energy fit for a territory given the current DRS and the
 * territory's continuous expectedEnergy value.
 *
 * Derives a guidance level from expectedEnergy thresholds:
 * - < 0.38 = light fit curve
 * - < 0.55 = medium fit curve
 * - >= 0.55 = heavy fit curve
 */
export function computeEnergyFit(drs: number, expectedEnergy: number, config: DRSConfig): number {
	if (expectedEnergy < 0.38) {
		return clamp((config.lightFitCenter - drs) / config.lightFitRange, 0, 1);
	}
	if (expectedEnergy < 0.55) {
		return 1 - clamp(Math.abs(drs - config.mediumFitCenter) / config.mediumFitRange, 0, 1);
	}
	return clamp((drs - config.heavyFitCenter) / config.heavyFitRange, 0, 1);
}

// ─── Config Extraction ──────────────────────────────────────────────

/**
 * Extract DRS-specific config from AppConfigService.
 * Keeps DRS functions pure by accepting a focused config object.
 */
export function extractDRSConfig(config: AppConfigService): DRSConfig {
	return {
		breadthWeight: config.drsBreadthWeight,
		engagementWeight: config.drsEngagementWeight,
		breadthOffset: config.drsBreadthOffset,
		breadthRange: config.drsBreadthRange,
		wordCountThreshold: config.drsWordCountThreshold,
		evidenceThreshold: config.drsEvidenceThreshold,
		engagementWordWeight: config.drsEngagementWordWeight,
		engagementEvidenceWeight: config.drsEngagementEvidenceWeight,
		recencyWeights: config.drsRecencyWeights,
		energyWeightLight: config.drsEnergyWeightLight,
		energyWeightMedium: config.drsEnergyWeightMedium,
		energyWeightHeavy: config.drsEnergyWeightHeavy,
		lightFitCenter: config.drsLightFitCenter,
		lightFitRange: config.drsLightFitRange,
		mediumFitCenter: config.drsMediumFitCenter,
		mediumFitRange: config.drsMediumFitRange,
		heavyFitCenter: config.drsHeavyFitCenter,
		heavyFitRange: config.drsHeavyFitRange,
	};
}
