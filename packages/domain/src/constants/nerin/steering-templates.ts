/**
 * Intent x Observation Steering Templates — Story 28-3
 *
 * 9 intent x observation templates that determine Nerin's response shape.
 * Each template is a prose instruction in Nerin's voice with parameter slots
 * that are filled at render time based on the steering pipeline output.
 *
 * Template matrix:
 * - open x relate (1)
 * - explore x relate/noticing/contradiction/convergence (4)
 * - amplify x relate/noticing/contradiction/convergence (4)
 *
 * Bridge templates (4 more) will be added in Epic 2, Story 2.2.
 *
 * These templates are consumed by the Prompt Builder (Story 1.4).
 */

import type { ObservationFocus } from "../../types/pacing";

// ─── Steering Prefix ────────────────────────────────────────────────

/** Prefix for the steering section — frames steering as Nerin's attention. */
export const STEERING_PREFIX = "What's caught your attention this turn:";

// ─── Open Templates (1) ─────────────────────────────────────────────

/** open x relate — first question, territory curiosity framing. */
export const OPEN_RELATE_TEMPLATE =
	"This is your first question. You're curious about {territory.name} — {territory.description}.";

// ─── Explore Templates (4) ──────────────────────────────────────────

/** explore x relate — connect naturally, territory curiosity. */
export const EXPLORE_RELATE_TEMPLATE =
	"Connect naturally to what they just shared. Your curiosity is on {territory.name} — {territory.description}.";

/** explore x noticing — domain shift pointing toward territory. */
export const EXPLORE_NOTICING_TEMPLATE =
	"Something is shifting in how they talk about {domain}. That shift points toward {territory.description} — follow it.";

/** explore x contradiction — facet tension across domains, linked to territory. */
export const EXPLORE_CONTRADICTION_TEMPLATE =
	"{facet} shows up differently in {domain1} vs {domain2}. That tension has something to do with {territory.description} — explore it.";

/** explore x convergence — facet pattern across domains, linked to territory. */
export const EXPLORE_CONVERGENCE_TEMPLATE =
	"{facet} keeps showing up across {domains}. That pattern connects to {territory.description} — go deeper.";

// ─── Amplify Templates (4) ──────────────────────────────────────────

/** amplify x relate — last question, land it with feeling. */
export const AMPLIFY_RELATE_TEMPLATE =
	"This is your last question. Connect to what they just shared and land it — something that lets them leave with a feeling, not a thread to chase.";

/** amplify x noticing — last question, name the domain shift. */
export const AMPLIFY_NOTICING_TEMPLATE =
	"This is your last question. Something has been shifting in how they talk about {domain}. Name it — give them something to sit with.";

/** amplify x contradiction — last question, frame tension as worth holding. */
export const AMPLIFY_CONTRADICTION_TEMPLATE =
	"This is your last question. {facet} shows up differently in {domain1} vs {domain2}. Frame that tension as something worth holding — not to resolve, to notice.";

/** amplify x convergence — last question, name the core pattern. */
export const AMPLIFY_CONVERGENCE_TEMPLATE =
	"This is your last question. {facet} has shown up consistently across {domains}. Name that pattern — it says something core about who they are.";

// ─── Template Lookup ────────────────────────────────────────────────

/** Lookup table: intent x observation type -> template string. */
const TEMPLATE_LOOKUP: Record<string, string> = {
	"open:relate": OPEN_RELATE_TEMPLATE,
	"explore:relate": EXPLORE_RELATE_TEMPLATE,
	"explore:noticing": EXPLORE_NOTICING_TEMPLATE,
	"explore:contradiction": EXPLORE_CONTRADICTION_TEMPLATE,
	"explore:convergence": EXPLORE_CONVERGENCE_TEMPLATE,
	"amplify:relate": AMPLIFY_RELATE_TEMPLATE,
	"amplify:noticing": AMPLIFY_NOTICING_TEMPLATE,
	"amplify:contradiction": AMPLIFY_CONTRADICTION_TEMPLATE,
	"amplify:convergence": AMPLIFY_CONVERGENCE_TEMPLATE,
};

// ─── Template Rendering ─────────────────────────────────────────────

/**
 * Replace `{key}` placeholders in a template string with values from a parameters record.
 *
 * Supports dotted keys like `{territory.name}`. Unmatched placeholders are left intact.
 */
export function renderTemplate(template: string, params: Record<string, string>): string {
	let result = template;
	for (const [key, value] of Object.entries(params)) {
		// Escape special regex characters in the key (dots in dotted keys)
		const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		result = result.replace(new RegExp(`\\{${escaped}\\}`, "g"), value);
	}
	return result;
}

/**
 * Extract template parameters from an ObservationFocus and territory.
 *
 * Parameter signatures per observation type:
 * - relate: territory.name, territory.description
 * - noticing: domain, territory.name, territory.description
 * - contradiction: facet, domain1, domain2, territory.name, territory.description
 * - convergence: facet, domains, territory.name, territory.description
 */
function extractParams(
	focus: ObservationFocus,
	territory: { readonly name: string; readonly description: string },
): Record<string, string> {
	const base: Record<string, string> = {
		"territory.name": territory.name,
		"territory.description": territory.description,
	};

	switch (focus.type) {
		case "relate":
			return base;
		case "noticing":
			return { ...base, domain: focus.domain };
		case "contradiction":
			return {
				...base,
				facet: focus.target.facet,
				domain1: focus.target.pair[0].domain,
				domain2: focus.target.pair[1].domain,
			};
		case "convergence":
			return {
				...base,
				facet: focus.target.facet,
				domains: focus.target.domains.map((d) => d.domain).join(", "),
			};
	}
}

/**
 * Select and render the correct intent x observation template.
 *
 * @param intent - The conversational intent (open, explore, amplify)
 * @param focus - The observation focus discriminated union
 * @param territory - Territory with name and description for parameter interpolation
 * @returns Rendered template string with all parameters filled
 * @throws Error if no template exists for the given intent x observation combination
 */
export function renderSteeringTemplate(
	intent: "open" | "explore" | "amplify",
	focus: ObservationFocus,
	territory: { readonly name: string; readonly description: string },
): string {
	const key = `${intent}:${focus.type}`;
	const template = TEMPLATE_LOOKUP[key];

	if (!template) {
		throw new Error(
			`No steering template for intent "${intent}" x observation "${focus.type}". ` +
				"Valid combinations: open x relate, explore x all, amplify x all.",
		);
	}

	const params = extractParams(focus, territory);
	return renderTemplate(template, params);
}
