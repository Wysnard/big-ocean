/**
 * Band-to-Numeric Mapping — Story 23-2 (FR17)
 *
 * Pure functions that deterministically map categorical energy and telling
 * bands to continuous [0, 1] values. Used by the pacing pipeline to convert
 * ConversAnalyzer v2's categorical output into numeric values.
 *
 * All values are in [0, 1] space per NFR1.
 */

import type { EnergyBand } from "../types/pacing";
import type { TellingBand } from "../types/pacing";

/**
 * Energy band to numeric mapping.
 *
 * minimal=0.1, low=0.3, steady=0.5, high=0.7, very_high=0.9
 *
 * Anchor: steady=0.5 corresponds to the comfort threshold (zero drain).
 */
const ENERGY_BAND_MAP: Record<EnergyBand, number> = {
	minimal: 0.1,
	low: 0.3,
	steady: 0.5,
	high: 0.7,
	very_high: 0.9,
} as const;

/**
 * Telling band to numeric mapping.
 *
 * fully_compliant=0.0, mostly_compliant=0.25, mixed=0.5,
 * mostly_self_propelled=0.75, strongly_self_propelled=1.0
 */
const TELLING_BAND_MAP: Record<TellingBand, number> = {
	fully_compliant: 0.0,
	mostly_compliant: 0.25,
	mixed: 0.5,
	mostly_self_propelled: 0.75,
	strongly_self_propelled: 1.0,
} as const;

/**
 * Map an energy band to its continuous [0, 1] value.
 *
 * Pure function, no side effects.
 */
export function mapEnergyBand(band: EnergyBand): number {
	return ENERGY_BAND_MAP[band];
}

/**
 * Map a telling band to its continuous [0, 1] value.
 *
 * Pure function, no side effects.
 */
export function mapTellingBand(band: TellingBand): number {
	return TELLING_BAND_MAP[band];
}
