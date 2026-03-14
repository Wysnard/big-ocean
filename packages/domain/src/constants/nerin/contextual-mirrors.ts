/**
 * Contextual Mirror System — Story 29-3
 *
 * Mirrors loaded contextually by intent x observation. Replaces the
 * monolithic MIRRORS_EXPLORE and MIRRORS_AMPLIFY modules with a lookup
 * table that returns curated mirror sets based on the current steering
 * context.
 *
 * From the brainstorming spec:
 * - Open: no mirrors
 * - Explore: observation-specific subsets
 * - Bridge: smaller observation-specific subsets
 * - Amplify: same 4 mirrors for all observations
 *
 * Each mirror set includes the guardrail:
 * "You can discover new mirrors in the moment — but the biology must be real"
 */

import type { ConversationalIntent } from "../../types/pacing";

// ─── Mirror Definitions ─────────────────────────────────────────────

interface Mirror {
	readonly name: string;
	readonly biology: string;
	readonly meaning: string;
	readonly caveat?: string;
}

const HERMIT_CRAB: Mirror = {
	name: "Hermit Crab",
	biology: "must go naked between shells to grow",
	meaning: "vulnerability as prerequisite for growth",
};

const GHOST_NET: Mirror = {
	name: "Ghost Net",
	biology: "lost nets keep catching for decades",
	meaning: "patterns that outlive their purpose",
};

const PILOT_FISH: Mirror = {
	name: "Pilot Fish",
	biology: "cleans sharks, appreciated, never steers",
	meaning: "useful to everyone, never choosing direction",
};

const TIDE_POOL: Mirror = {
	name: "Tide Pool",
	biology: "rearranged twice daily, survivors adapt",
	meaning: "control vs. adaptation",
};

const MIMIC_OCTOPUS: Mirror = {
	name: "Mimic Octopus",
	biology: "impersonates 15 species, own form unknown",
	meaning: "lost under performances",
};

const CLOWNFISH: Mirror = {
	name: "Clownfish",
	biology: "immune to anemone venom, doesn't know why",
	meaning: "belonging without understanding why",
};

const DOLPHIN_ECHOLOCATION: Mirror = {
	name: "Dolphin Echolocation",
	biology: "pods travel together, each navigates alone",
	meaning: "surrounded but solo",
};

const BIOLUMINESCENCE: Mirror = {
	name: "Bioluminescence",
	biology: "deep creatures control their light",
	meaning: "curated visibility, never fully on",
};

const PARROTFISH: Mirror = {
	name: "Parrotfish",
	biology: "eats coral, excretes sand, creates beaches",
	meaning: "invisible essential work",
	caveat:
		"USE CAREFULLY: implies nobody sees their contribution — wrong for someone whose people DO care",
};

const SEA_URCHIN: Mirror = {
	name: "Sea Urchin",
	biology: "no brain, navigates via nerve nets",
	meaning: "overthinking, less central processing",
};

const CORAL_REEF: Mirror = {
	name: "Coral Reef",
	biology: "builds ecosystem, fish swim in and out",
	meaning: "what you built holds, movement is normal",
};

const VOLCANIC_VENTS: Mirror = {
	name: "Volcanic Vents",
	biology: "ecosystems thrive in toxic pressure",
	meaning: "life doesn't wait for conditions",
};

const MOLA_MOLA: Mirror = {
	name: "Mola Mola",
	biology: "weirdest body plan, heaviest bony fish",
	meaning: "not fitting a template \u2260 not belonging",
};

/** All 13 mirrors in canonical order. */
const ALL_MIRRORS: readonly Mirror[] = [
	HERMIT_CRAB,
	GHOST_NET,
	PILOT_FISH,
	TIDE_POOL,
	MIMIC_OCTOPUS,
	CLOWNFISH,
	DOLPHIN_ECHOLOCATION,
	BIOLUMINESCENCE,
	PARROTFISH,
	SEA_URCHIN,
	CORAL_REEF,
	VOLCANIC_VENTS,
	MOLA_MOLA,
];

// ─── Mirror Set Definitions ─────────────────────────────────────────

// Explore x observation
const EXPLORE_RELATE_MIRRORS = ALL_MIRRORS;
const EXPLORE_NOTICING_MIRRORS = [HERMIT_CRAB, VOLCANIC_VENTS, BIOLUMINESCENCE, TIDE_POOL];
const EXPLORE_CONTRADICTION_MIRRORS = [TIDE_POOL, BIOLUMINESCENCE, DOLPHIN_ECHOLOCATION, MIMIC_OCTOPUS];
const EXPLORE_CONVERGENCE_MIRRORS = [GHOST_NET, PILOT_FISH, CORAL_REEF, PARROTFISH, SEA_URCHIN];

// Bridge x observation
const BRIDGE_RELATE_MIRRORS = ALL_MIRRORS;
const BRIDGE_NOTICING_MIRRORS = [HERMIT_CRAB, VOLCANIC_VENTS];
const BRIDGE_CONTRADICTION_MIRRORS = [TIDE_POOL, DOLPHIN_ECHOLOCATION];
const BRIDGE_CONVERGENCE_MIRRORS = [GHOST_NET, CORAL_REEF, PILOT_FISH];

// Amplify — same set for all observations
const AMPLIFY_MIRRORS = [GHOST_NET, MIMIC_OCTOPUS, VOLCANIC_VENTS, MOLA_MOLA];

// ─── Formatting ─────────────────────────────────────────────────────

const MIRROR_GUARDRAIL =
	"You can discover new mirrors in the moment — but the biology must be real, and the implicit argument must match what this person needs to hear.";

function formatMirror(mirror: Mirror): string {
	const base = `\u2022 ${mirror.name} \u2014 ${mirror.biology} \u2192 ${mirror.meaning}`;
	return mirror.caveat ? `${base} (${mirror.caveat})` : base;
}

function formatMirrorSet(mirrors: readonly Mirror[], header: string): string {
	const lines = mirrors.map(formatMirror);
	return `NATURAL WORLD MIRRORS${header}:\n\nYou use the ocean as a lens for people. Sea life, biology, geology, diving phenomena \u2014 used as metaphors that make the user reflect on what they just said.\n\nMIRROR REFERENCE \u2014 patterns you've seen before, mapped to the ocean:\n\n${lines.join("\n")}\n\n${MIRROR_GUARDRAIL}`;
}

// ─── Pre-rendered Mirror Sets ───────────────────────────────────────

const EXPLORE_RELATE_SET = formatMirrorSet(EXPLORE_RELATE_MIRRORS, "");
const EXPLORE_NOTICING_SET = formatMirrorSet(EXPLORE_NOTICING_MIRRORS, "");
const EXPLORE_CONTRADICTION_SET = formatMirrorSet(EXPLORE_CONTRADICTION_MIRRORS, "");
const EXPLORE_CONVERGENCE_SET = formatMirrorSet(EXPLORE_CONVERGENCE_MIRRORS, "");

const BRIDGE_RELATE_SET = formatMirrorSet(BRIDGE_RELATE_MIRRORS, "");
const BRIDGE_NOTICING_SET = formatMirrorSet(BRIDGE_NOTICING_MIRRORS, "");
const BRIDGE_CONTRADICTION_SET = formatMirrorSet(BRIDGE_CONTRADICTION_MIRRORS, "");
const BRIDGE_CONVERGENCE_SET = formatMirrorSet(BRIDGE_CONVERGENCE_MIRRORS, "");

const AMPLIFY_SET = formatMirrorSet(
	AMPLIFY_MIRRORS,
	" (AMPLIFY)",
);

// ─── Lookup Table ───────────────────────────────────────────────────

type ObservationType = "relate" | "noticing" | "contradiction" | "convergence";

const MIRROR_LOOKUP: Record<string, string | null> = {
	// Open — no mirrors
	"open:relate": null,
	"open:noticing": null,
	"open:contradiction": null,
	"open:convergence": null,
	// Explore — observation-specific
	"explore:relate": EXPLORE_RELATE_SET,
	"explore:noticing": EXPLORE_NOTICING_SET,
	"explore:contradiction": EXPLORE_CONTRADICTION_SET,
	"explore:convergence": EXPLORE_CONVERGENCE_SET,
	// Bridge — subset of explore
	"bridge:relate": BRIDGE_RELATE_SET,
	"bridge:noticing": BRIDGE_NOTICING_SET,
	"bridge:contradiction": BRIDGE_CONTRADICTION_SET,
	"bridge:convergence": BRIDGE_CONVERGENCE_SET,
	// Amplify — same set for all observations
	"amplify:relate": AMPLIFY_SET,
	"amplify:noticing": AMPLIFY_SET,
	"amplify:contradiction": AMPLIFY_SET,
	"amplify:convergence": AMPLIFY_SET,
};

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Get the contextual mirror set for the given intent and observation type.
 *
 * Returns a formatted mirror block string to include in the system prompt,
 * or null if no mirrors should be loaded (e.g., open intent).
 *
 * @param intent - The conversational intent (open, explore, bridge, amplify)
 * @param observationType - The observation focus type (relate, noticing, contradiction, convergence)
 * @returns Formatted mirror block string, or null if no mirrors for this context
 */
export function getMirrorsForContext(
	intent: ConversationalIntent,
	observationType: ObservationType,
): string | null {
	const key = `${intent}:${observationType}`;
	return MIRROR_LOOKUP[key] ?? null;
}
