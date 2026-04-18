import type { GetResultsResponse } from "@workspace/contracts";

/**
 * Maps API archetype display names (e.g. "The Compass") to library article slugs.
 */
export function archetypeDisplayNameToLibrarySlug(archetypeName: string): string | undefined {
	const trimmed = archetypeName.trim();
	const match = /^The\s+(\w+)/i.exec(trimmed);
	if (!match?.[1]) {
		return undefined;
	}
	return `${match[1].toLowerCase()}-personality-archetype`;
}

function pickSalientTrait(
	traits: GetResultsResponse["traits"],
): GetResultsResponse["traits"][number] | undefined {
	if (traits.length === 0) {
		return undefined;
	}
	return [...traits].sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
}

function pickSalientFacetForTrait(
	facets: GetResultsResponse["facets"],
	traitName: string,
): GetResultsResponse["facets"][number] | undefined {
	const pool = facets.filter((f) => f.traitName === traitName);
	if (pool.length === 0) {
		return undefined;
	}
	return [...pool].sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
}

/**
 * Derives library slugs / facet keys from assessment results (no I/O).
 */
export function selectRecommendedKeysFromResults(results: GetResultsResponse): {
	archetypeSlug: string | undefined;
	traitName: string | undefined;
	facetName: string | undefined;
} {
	const salientTrait = pickSalientTrait(results.traits);
	const traitName = salientTrait?.name;
	const salientFacet = traitName ? pickSalientFacetForTrait(results.facets, traitName) : undefined;

	return {
		archetypeSlug: archetypeDisplayNameToLibrarySlug(results.archetypeName),
		traitName,
		facetName: salientFacet?.name,
	};
}
