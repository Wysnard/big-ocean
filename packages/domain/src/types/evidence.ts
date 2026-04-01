/**
 * Evidence Input Type (v2 — Decision D4)
 *
 * Minimal intersection type used by formula functions for facet metric calculations.
 * v2 replaces noisy 0-20 scores with structured deviation/strength/confidence signals.
 *
 * Story 18-1: In-place replacement (Pattern 1 — no parallel EvidenceInputV2).
 */
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";

export type EvidenceStrength = "weak" | "moderate" | "strong";
export type EvidenceConfidence = "low" | "medium" | "high";

/** Polarity of evidence — whether the observed behavior indicates HIGH or LOW on a facet (Story 42-1) */
export type EvidencePolarity = "high" | "low";

export interface EvidenceInput {
	readonly bigfiveFacet: FacetName;
	readonly deviation: number;
	readonly strength: EvidenceStrength;
	readonly confidence: EvidenceConfidence;
	readonly domain: LifeDomain;
	readonly note?: string;
}

/**
 * Evidence as extracted by the v3 polarity-based extraction model (Story 42-1).
 *
 * Uses polarity (high/low) + strength instead of raw deviation.
 * Deviation is derived deterministically via deriveDeviation(polarity, strength).
 */
export interface ExtractedEvidence {
	readonly bigfiveFacet: FacetName;
	readonly polarity: EvidencePolarity;
	readonly strength: EvidenceStrength;
	readonly confidence: EvidenceConfidence;
	readonly domain: LifeDomain;
	readonly note: string;
}
