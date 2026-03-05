/**
 * Territory Prompt Builder -- Story 21-5
 *
 * Looks up the territory catalog and formats guidance for Nerin's system prompt.
 * Nerin receives topic-level direction (opener, domains, energy level) without
 * exposure to scoring internals, expected facets, or DRS values.
 *
 * FR12: Steering outputs territoryId only; prompt builder looks up the catalog.
 * FR13: Nerin receives territory guidance (topic area + energy level) instead of facet targeting.
 */

import type { LifeDomain } from "../../constants/life-domain";
import { TERRITORY_CATALOG } from "../../constants/territory-catalog";
import type { SteeringOutput } from "../../types/steering";
import type { EnergyLevel } from "../../types/territory";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Territory prompt content — the information Nerin receives about
 * the selected territory. Intentionally excludes expectedFacets,
 * DRS, and coverage data.
 */
export interface TerritoryPromptContent {
	readonly opener: string;
	readonly domains: readonly LifeDomain[];
	readonly energyLevel: EnergyLevel;
}

// ─── Energy Guidance ────────────────────────────────────────────────

const ENERGY_GUIDANCE: Record<EnergyLevel, string> = {
	light:
		"Keep the tone casual and approachable. This is low-stakes territory — warmth and curiosity over depth.",
	medium:
		"Moderate depth is welcome here. The person is engaged enough for some self-reflection and personal stakes.",
	heavy:
		"This is deep, emotionally weighty territory. Move with care — meet vulnerability, don't push past it.",
};

// ─── Build Territory Prompt ─────────────────────────────────────────

/**
 * Look up a territory from the catalog and extract prompt-relevant content.
 *
 * Returns only what Nerin needs: opener, domains, and energy level.
 * Throws if the territory ID is not found in the catalog.
 */
export function buildTerritoryPrompt(steeringOutput: SteeringOutput): TerritoryPromptContent {
	const territory = TERRITORY_CATALOG.get(steeringOutput.territoryId);

	if (!territory) {
		throw new Error(
			`Territory not found in catalog: "${steeringOutput.territoryId}". ` +
				"This indicates a mismatch between steering output and the territory catalog.",
		);
	}

	return {
		opener: territory.opener,
		domains: territory.domains,
		energyLevel: territory.energyLevel,
	};
}

// ─── Build System Prompt Section ────────────────────────────────────

/**
 * Format territory content into a system prompt section for Nerin.
 *
 * The opener is presented as a suggested direction, not a mandatory question.
 * Energy-specific guidance adjusts conversational depth expectations.
 */
export function buildTerritorySystemPromptSection(content: TerritoryPromptContent): string {
	const domainList = content.domains.join(", ");
	const energyGuidance = ENERGY_GUIDANCE[content.energyLevel];

	return `
TERRITORY GUIDANCE:
Energy: ${content.energyLevel}
Domain area: ${domainList}

${energyGuidance}

Suggested direction — you could explore something like: "${content.opener}"
This is a suggestion, not a script. Follow the natural flow of conversation. If the person is already in an interesting thread, stay with it. Use this as a direction to steer toward when there's a natural opening.

At most one direct question per response.`;
}
