/**
 * Extension Context Builder — Story 36-2
 *
 * Builds a prompt-friendly summary of themes and patterns from a parent
 * session's evidence for use in conversation extension sessions.
 *
 * Pure function — no Effect dependencies, no I/O.
 *
 * The summary references territory names and dominant facets observed
 * without including specific user quotes or exchange content.
 */

import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import { TERRITORY_CATALOG } from "../../constants/territory-catalog";
import type { TerritoryId } from "../../types/territory";

// ─── Types ──────────────────────────────────────────────────────────

/** Minimal evidence record shape needed for context building. */
export interface ExtensionEvidenceRecord {
	readonly bigfiveFacet: FacetName;
	readonly domain: LifeDomain;
	readonly deviation: number;
	readonly strength: string;
	readonly confidence: string;
}

/** Minimal exchange record shape needed for context building. */
export interface ExtensionExchangeRecord {
	readonly selectedTerritory: string | null;
	readonly turnNumber: number;
}

/** Output of the extension context builder. */
export interface ExtensionContext {
	/** Human-readable summary for inclusion in Nerin's system prompt */
	readonly summary: string;
	/** Territory names visited in the parent session (for debugging) */
	readonly visitedTerritoryNames: readonly string[];
	/** Top facets by evidence count (for debugging) */
	readonly dominantFacets: readonly FacetName[];
}

// ─── Build Extension Context ───────────────────────────────────────

/**
 * Build a prompt-friendly extension context from parent session data.
 *
 * Returns a summary of explored themes (territory names) and dominant
 * personality facets observed, suitable for inclusion in Nerin's Common
 * prompt layer. Never includes user quotes or specific exchange content.
 *
 * @param parentEvidence - Evidence records from the parent session
 * @param parentExchanges - Exchange records from the parent session (for visited territories)
 * @returns ExtensionContext with a prompt summary and debug metadata
 */
export function buildExtensionContext(
	parentEvidence: readonly ExtensionEvidenceRecord[],
	parentExchanges: readonly ExtensionExchangeRecord[],
): ExtensionContext {
	// Collect unique visited territory names (ordered by first visit)
	const visitedTerritoryIds = new Set<TerritoryId>();
	for (const exchange of parentExchanges) {
		if (exchange.selectedTerritory) {
			visitedTerritoryIds.add(exchange.selectedTerritory as TerritoryId);
		}
	}

	const visitedTerritoryNames: string[] = [];
	for (const id of visitedTerritoryIds) {
		const territory = TERRITORY_CATALOG.get(id);
		if (territory) {
			visitedTerritoryNames.push(territory.name);
		}
	}

	// Count evidence per facet to find dominant facets
	const facetCounts = new Map<FacetName, number>();
	for (const record of parentEvidence) {
		const count = facetCounts.get(record.bigfiveFacet) ?? 0;
		facetCounts.set(record.bigfiveFacet, count + 1);
	}

	// Sort facets by evidence count (descending), take top 5
	const dominantFacets = [...facetCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([facet]) => facet);

	// Build human-readable summary
	const summary = formatExtensionSummary(visitedTerritoryNames, dominantFacets);

	return {
		summary,
		visitedTerritoryNames,
		dominantFacets,
	};
}

// ─── Formatting ────────────────────────────────────────────────────

/**
 * Format the extension context into a prompt section.
 *
 * The summary uses "themes and patterns" language per the story AC,
 * never referencing specific exchanges or quoting the user.
 */
function formatExtensionSummary(
	territoryNames: readonly string[],
	dominantFacets: readonly FacetName[],
): string {
	if (territoryNames.length === 0 && dominantFacets.length === 0) {
		return "";
	}

	const parts: string[] = [
		"CONTINUATION CONTEXT:",
		"This is a continuation of a prior conversation. You have already explored themes together.",
	];

	if (territoryNames.length > 0) {
		const themes = territoryNames.join(", ");
		parts.push(`Previously explored areas: ${themes}.`);
	}

	if (dominantFacets.length > 0) {
		const facetLabels = dominantFacets.map(formatFacetLabel).join(", ");
		parts.push(`Patterns emerged around: ${facetLabels}.`);
	}

	parts.push(
		"Build on these themes and patterns. Reference what you noticed before, but do NOT quote the person's prior words or reference specific exchanges.",
	);

	return parts.join("\n");
}

/**
 * Format a facet name into a human-readable label.
 * e.g., "self_discipline" -> "self-discipline"
 */
function formatFacetLabel(facet: FacetName): string {
	return facet.replace(/_/g, "-");
}
