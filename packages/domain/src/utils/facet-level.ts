/**
 * Facet Score-to-Level Mapping (Story 8.3)
 *
 * Maps a facet score (0-20) to its two-letter level code.
 * Threshold: 0-10 = Low code, 11-20 = High code (binary split at midpoint).
 *
 * Float scores are handled naturally: 10.0 → Low, 10.1 → High.
 */

import type { FacetName } from "../constants/big-five";
import { FACET_LETTER_MAP } from "../types/facet-levels";

export function getFacetLevel(facetName: FacetName, score: number): string {
	const [low, high] = FACET_LETTER_MAP[facetName];
	return score <= 10 ? low : high;
}
