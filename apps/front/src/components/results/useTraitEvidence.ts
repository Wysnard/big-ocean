/**
 * Hook for loading all facet evidence for a selected trait.
 *
 * When a trait is selected, fetches evidence for all 6 facets in that trait.
 * Returns structured data for the DetailZone component.
 */

import { useQuery } from "@tanstack/react-query";
import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName, TraitName } from "@workspace/domain";
import { TRAIT_TO_FACETS } from "@workspace/domain";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchFacetEvidence(
	sessionId: string,
	facetName: FacetName,
): Promise<SavedFacetEvidence[]> {
	const response = await fetch(
		`${API_URL}/api/evidence/facet?sessionId=${sessionId}&facetName=${facetName}`,
		{
			headers: { "Content-Type": "application/json" },
			credentials: "include",
		},
	);
	if (!response.ok) return [];
	return response.json();
}

export interface FacetDetailData {
	name: FacetName;
	score: number;
	confidence: number;
	evidence: SavedFacetEvidence[];
}

/**
 * Fetches evidence for all 6 facets in the given trait.
 * Returns data compatible with DetailZone's facetDetails prop.
 */
export function useTraitEvidence(
	sessionId: string,
	traitName: TraitName | null,
	facetScores: ReadonlyMap<FacetName, number>,
	facetConfidences: ReadonlyMap<FacetName, number>,
	enabled = true,
) {
	const facetNames = traitName ? TRAIT_TO_FACETS[traitName] : [];

	return useQuery({
		queryKey: ["trait-evidence", sessionId, traitName],
		queryFn: async (): Promise<FacetDetailData[]> => {
			if (!traitName) return [];

			const results = await Promise.all(
				facetNames.map(async (facetName) => {
					const evidence = await fetchFacetEvidence(sessionId, facetName);
					return {
						name: facetName,
						score: facetScores.get(facetName) ?? 0,
						confidence: facetConfidences.get(facetName) ?? 0,
						evidence,
					};
				}),
			);

			return results;
		},
		enabled: enabled && !!traitName,
		staleTime: 5 * 60 * 1000,
	});
}
