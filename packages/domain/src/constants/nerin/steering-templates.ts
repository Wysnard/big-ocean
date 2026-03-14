/**
 * Intent x Observation Steering Templates — Stories 28-3, 29-2
 *
 * 13 intent x observation templates that determine Nerin's response shape.
 * Each template is a prose instruction in Nerin's voice with parameter slots
 * that are filled at render time based on the steering pipeline output.
 *
 * Template matrix:
 * - open x relate (1)
 * - explore x relate/noticing/contradiction/convergence (4)
 * - bridge x relate/noticing/contradiction/convergence (4) — Story 29-2
 * - close x relate/noticing/contradiction/convergence (4)
 *
 * These templates are consumed by the Prompt Builder (Story 1.4 / 28-4).
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

// ─── Bridge Templates (4) — Story 29-2 ─────────────────────────────

/**
 * bridge x relate — 3-tier fallback: find connection, flag and leave, clean jump.
 * Absorbs "flag and leave" and "park and pick" from dissolved THREADING module.
 */
export const BRIDGE_RELATE_TEMPLATE =
	"You've been exploring {previousTerritory.name}. Something in what they just shared connects to {newTerritory.description}. Follow that thread. If the thread isn't there but something interesting is unfinished, name it — \"there's something there, we'll come back to it\" — and shift your curiosity to {newTerritory.description}. If nothing connects, you have a good read on {previousTerritory.name} — tell them, and shift your curiosity to {newTerritory.description}.";

/** bridge x noticing — domain shift pulling from previousTerritory toward newTerritory. */
export const BRIDGE_NOTICING_TEMPLATE =
	"Something is shifting in how they talk about {domain}. You've been in {previousTerritory.name} — this shift is pulling you toward {newTerritory.description}.";

/** bridge x contradiction — facet tension pulling from previousTerritory toward newTerritory. */
export const BRIDGE_CONTRADICTION_TEMPLATE =
	"{facet} shows up differently in {domain1} vs {domain2}. You've been exploring {previousTerritory.name} — that tension is pulling you toward {newTerritory.description}.";

/** bridge x convergence — facet pattern spanning from previousTerritory toward newTerritory. */
export const BRIDGE_CONVERGENCE_TEMPLATE =
	"{facet} keeps showing up across {domains}. You've been in {previousTerritory.name}. You're curious where else it lives — {newTerritory.description}.";

/**
 * Soft negative constraint — appended to all bridge templates to prevent
 * Nerin from pulling the conversation back to the previous territory.
 */
export const BRIDGE_NEGATIVE_CONSTRAINT =
	"You've been exploring {previousTerritory.name} — your curiosity has moved. Don't pull the conversation back there.";

// ─── Close Templates (4) ────────────────────────────────────────────

/** close x relate — last question, land it with feeling. */
export const CLOSE_RELATE_TEMPLATE =
	"This is your last question. Connect to what they just shared and land it — something that lets them leave with a feeling, not a thread to chase.";

/** close x noticing — last question, name the domain shift. */
export const CLOSE_NOTICING_TEMPLATE =
	"This is your last question. Something has been shifting in how they talk about {domain}. Name it — give them something to sit with.";

/** close x contradiction — last question, frame tension as worth holding. */
export const CLOSE_CONTRADICTION_TEMPLATE =
	"This is your last question. {facet} shows up differently in {domain1} vs {domain2}. Frame that tension as something worth holding — not to resolve, to notice.";

/** close x convergence — last question, name the core pattern. */
export const CLOSE_CONVERGENCE_TEMPLATE =
	"This is your last question. {facet} has shown up consistently across {domains}. Name that pattern — it says something core about who they are.";

// ─── Template Lookup ────────────────────────────────────────────────

/** Lookup table: intent x observation type -> template string. */
const TEMPLATE_LOOKUP: Record<string, string> = {
	"open:relate": OPEN_RELATE_TEMPLATE,
	"explore:relate": EXPLORE_RELATE_TEMPLATE,
	"explore:noticing": EXPLORE_NOTICING_TEMPLATE,
	"explore:contradiction": EXPLORE_CONTRADICTION_TEMPLATE,
	"explore:convergence": EXPLORE_CONVERGENCE_TEMPLATE,
	"bridge:relate": BRIDGE_RELATE_TEMPLATE,
	"bridge:noticing": BRIDGE_NOTICING_TEMPLATE,
	"bridge:contradiction": BRIDGE_CONTRADICTION_TEMPLATE,
	"bridge:convergence": BRIDGE_CONVERGENCE_TEMPLATE,
	"close:relate": CLOSE_RELATE_TEMPLATE,
	"close:noticing": CLOSE_NOTICING_TEMPLATE,
	"close:contradiction": CLOSE_CONTRADICTION_TEMPLATE,
	"close:convergence": CLOSE_CONVERGENCE_TEMPLATE,
};

/** Total template count — exported for test assertions. */
export const TEMPLATE_COUNT = Object.keys(TEMPLATE_LOOKUP).length;

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
 *
 * For bridge intent, territory params are keyed as newTerritory.* and
 * previousTerritory.* to match bridge template parameter slots.
 */
function extractParams(
	focus: ObservationFocus,
	territory: { readonly name: string; readonly description: string },
	previousTerritory?: { readonly name: string; readonly description: string },
): Record<string, string> {
	// Bridge templates use {newTerritory.*} and {previousTerritory.*}
	// Non-bridge templates use {territory.*}
	const base: Record<string, string> = previousTerritory
		? {
				"newTerritory.name": territory.name,
				"newTerritory.description": territory.description,
				"previousTerritory.name": previousTerritory.name,
			}
		: {
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
 * @param intent - The conversational intent (open, explore, bridge, close)
 * @param focus - The observation focus discriminated union
 * @param territory - Territory with name and description for parameter interpolation
 *   (for bridge intent, this is the **new** territory)
 * @param previousTerritory - For bridge intent only: the territory being transitioned from
 * @returns Rendered template string with all parameters filled
 * @throws Error if no template exists for the given intent x observation combination
 * @throws Error if bridge intent is called without previousTerritory
 */
export function renderSteeringTemplate(
	intent: "open" | "explore" | "bridge" | "close",
	focus: ObservationFocus,
	territory: { readonly name: string; readonly description: string },
	previousTerritory?: { readonly name: string; readonly description: string },
): string {
	if (intent === "bridge" && !previousTerritory) {
		throw new Error(
			"Bridge intent requires previousTerritory parameter. " +
				"Pass the territory being transitioned from as the 4th argument.",
		);
	}

	const key = `${intent}:${focus.type}`;
	const template = TEMPLATE_LOOKUP[key];

	if (!template) {
		throw new Error(
			`No steering template for intent "${intent}" x observation "${focus.type}". ` +
				"Valid combinations: open x relate, explore x all, bridge x all, close x all.",
		);
	}

	const params = extractParams(focus, territory, previousTerritory);
	return renderTemplate(template, params);
}
