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

export interface EvidenceInput {
	readonly bigfiveFacet: FacetName;
	readonly deviation: number;
	readonly strength: EvidenceStrength;
	readonly confidence: EvidenceConfidence;
	readonly domain: LifeDomain;
	readonly note?: string;
}
