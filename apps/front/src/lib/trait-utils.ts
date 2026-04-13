import type { TraitName, TraitResult } from "@workspace/domain";

/**
 * Returns the dominant (highest-scoring) trait from a list of trait results.
 * Falls back to "openness" when the array is empty.
 */
export function getDominantTrait(traits: TraitResult[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name;
}
