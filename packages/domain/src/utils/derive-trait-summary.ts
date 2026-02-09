/**
 * Derive Trait Summary
 *
 * Maps a 5-letter OCEAN code to a trait summary record.
 * Each trait gets its corresponding level letter (H/M/L).
 */

import { BIG_FIVE_TRAITS } from "../types/trait";

export function deriveTraitSummary(oceanCode5: string): Record<string, string> {
	const traitSummary: Record<string, string> = {};
	for (let i = 0; i < BIG_FIVE_TRAITS.length; i++) {
		const trait = BIG_FIVE_TRAITS[i];
		const level = oceanCode5[i];
		if (trait && level) traitSummary[trait] = level;
	}
	return traitSummary;
}
