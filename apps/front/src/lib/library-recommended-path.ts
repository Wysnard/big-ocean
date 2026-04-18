import type { GetResultsResponse } from "@workspace/contracts";
import { getLibraryEntryData, type LibraryEntryData } from "@/lib/library-content";
import { selectRecommendedKeysFromResults } from "@/lib/library-recommended-path.pure";

export { archetypeDisplayNameToLibrarySlug } from "@/lib/library-recommended-path.pure";

export function buildStaticRecommendedFallback(): readonly [
	LibraryEntryData,
	LibraryEntryData,
	LibraryEntryData,
] {
	const archetype = getLibraryEntryData("archetype", "compass-personality-archetype");
	const trait = getLibraryEntryData("trait", "openness");
	const facet = getLibraryEntryData("facet", "imagination");
	if (!archetype || !trait || !facet) {
		throw new Error("library-recommended-path: missing fallback library entries");
	}
	return [archetype, trait, facet];
}

/**
 * Resolves archetype → trait → facet article entries from assessment results.
 * Falls back to individual static entries when a mapping is missing.
 */
export function resolveRecommendedPathFromResults(
	results: GetResultsResponse,
	fallback: readonly [LibraryEntryData, LibraryEntryData, LibraryEntryData],
): readonly [LibraryEntryData, LibraryEntryData, LibraryEntryData] {
	const keys = selectRecommendedKeysFromResults(results);

	const archetypeEntry = keys.archetypeSlug
		? getLibraryEntryData("archetype", keys.archetypeSlug)
		: undefined;
	const archetype = archetypeEntry ?? fallback[0];

	const traitEntry = keys.traitName ? getLibraryEntryData("trait", keys.traitName) : undefined;
	const trait = traitEntry ?? fallback[1];

	const facetEntry = keys.facetName ? getLibraryEntryData("facet", keys.facetName) : undefined;
	const facet = facetEntry ?? fallback[2];

	return [archetype, trait, facet];
}
