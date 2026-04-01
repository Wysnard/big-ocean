/**
 * Derive Deviation from Polarity and Strength (Story 42-1)
 *
 * Pure deterministic mapping:
 *   sign(polarity) x magnitude(strength)
 *   high -> positive, low -> negative
 *   strong -> 3, moderate -> 2, weak -> 1
 */
import type { EvidencePolarity, EvidenceStrength } from "../types/evidence";

const STRENGTH_MAGNITUDE: Record<EvidenceStrength, number> = {
	weak: 1,
	moderate: 2,
	strong: 3,
};

/**
 * Derives a deviation value (-3 to +3) from polarity and strength.
 *
 * This bridges the new polarity-based extraction model with the existing
 * scoring formula that expects integer deviation values.
 */
export function deriveDeviation(polarity: EvidencePolarity, strength: EvidenceStrength): number {
	const sign = polarity === "high" ? 1 : -1;
	return sign * STRENGTH_MAGNITUDE[strength];
}
