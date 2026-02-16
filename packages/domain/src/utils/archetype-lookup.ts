/**
 * Archetype Lookup System
 *
 * Pure, deterministic lookup that maps 4-letter OCEAN codes to personality archetypes.
 * Uses hand-curated names for common combinations and a component-based fallback
 * generator for the remaining combinations.
 *
 * Letter system (unique per trait):
 *   Openness:          P (Practical)  G (Grounded)    O (Open-minded)
 *   Conscientiousness: F (Flexible)   B (Balanced)    D (Disciplined)
 *   Extraversion:      I (Introvert)  A (Ambivert)    E (Extravert)
 *   Agreeableness:     C (Candid)     N (Negotiator)  W (Warm)
 *
 * @module
 */

import { CURATED_ARCHETYPES } from "../constants/archetypes";
import type { Archetype, OceanCode4 } from "../types/archetype";

/** Valid letters per position in a 4-letter code (O, C, E, A) */
const VALID_CODE4_REGEX = /^[PGO][FBD][IAE][CNW]$/;
/** Valid letters per position in a 5-letter code (O, C, E, A, N) */
const VALID_CODE5_REGEX = /^[PGO][FBD][IAE][CNW][RTS]$/;

/** Short trait key for the 4 traits used in archetype lookup (OCEA order). */
type TraitKey = "O" | "C" | "E" | "A";

/** Valid letters for each trait position in a 4-letter code */
type OpennessLetter = "P" | "G" | "O";
type ConscientiousnessLetter = "F" | "B" | "D";
type ExtraversionLetter = "I" | "A" | "E";
type AgreeablenessLetter = "C" | "N" | "W";

/** Union of all valid code4 position letters */
type Code4Letter =
	| OpennessLetter
	| ConscientiousnessLetter
	| ExtraversionLetter
	| AgreeablenessLetter;

/** Lookup type keyed by any valid code4 letter */
type LevelLookup<T> = Record<TraitKey, Record<Code4Letter, T>>;

/**
 * Adjective pools for each trait at each level.
 * Used by the fallback generator to construct personality names.
 */
const TRAIT_ADJECTIVES = {
	O: {
		O: ["Creative", "Curious", "Imaginative"],
		G: ["Balanced", "Pragmatic"],
		P: ["Practical", "Traditional"],
	},
	C: {
		D: ["Organized", "Disciplined", "Methodical"],
		B: ["Flexible", "Adaptable"],
		F: ["Spontaneous", "Easygoing"],
	},
	E: {
		E: ["Energetic", "Social", "Outgoing"],
		A: ["Moderate", "Selective"],
		I: ["Quiet", "Reserved", "Reflective"],
	},
	A: {
		W: ["Caring", "Cooperative", "Warm"],
		N: ["Fair", "Balanced"],
		C: ["Independent", "Self-reliant", "Autonomous"],
	},
};

/**
 * Noun mapping derived from Agreeableness level.
 */
const AGREEABLENESS_NOUNS: Record<string, string> = {
	W: "Collaborator",
	N: "Navigator",
	C: "Individualist",
};

/**
 * Trait-level description fragments for generating fallback descriptions.
 * Uses second-person voice ("you") for warm, direct personality descriptions.
 * Each trait has: opener (behavioral intro), depth (expanded insight),
 * social (interpersonal), and drive (motivational core).
 *
 * DO NOT rename, export, or move this constant — it is a private implementation
 * detail of the fallback generator. Story 8.2 will create a separate exported
 * TRAIT_DESCRIPTIONS in packages/domain/src/constants/trait-descriptions.ts.
 */
const TRAIT_DESCRIPTIONS: Record<
	TraitKey,
	Record<string, { opener: string; depth: string; social: string; drive: string }>
> = {
	O: {
		O: {
			opener:
				"New ideas and creative exploration hold a genuine pull for you, a curiosity that goes beyond casual interest into something that shapes how you see the world",
			depth:
				"Imaginative thinking leads you to possibilities that others overlook, connecting dots across domains and finding patterns where most people see unrelated noise. That creative instinct isn't something you turn on and off — it runs through how you approach problems, conversations, and even the way you spend your free time",
			social:
				"conversations tend to light up when you introduce an unexpected angle or a question nobody else thought to ask",
			drive:
				"The thrill of discovering something new keeps you moving forward, and the promise of what's around the next corner makes routine feel like a temporary state rather than a permanent condition",
		},
		G: {
			opener:
				"Curiosity and practicality live side by side in how you approach the world, creating a balance that lets you stay open to new ideas without losing your footing",
			depth:
				"A grounded perspective helps you evaluate new concepts with a clear head, filtering out what's merely trendy from what genuinely offers value. That discernment means the changes you adopt tend to stick, because they were chosen thoughtfully rather than impulsively",
			social:
				"people around you appreciate that your openness to new perspectives never comes at the cost of reliability or common sense",
			drive:
				"Finding approaches that are both thoughtful and realistic motivates your decisions, and there's satisfaction in knowing that your choices are built on solid ground rather than wishful thinking",
		},
		P: {
			opener:
				"Familiar approaches and proven methods form the backbone of how you operate, providing a foundation of reliability that shapes everything from daily routines to major decisions",
			depth:
				"A practical mindset keeps you focused on what actually works rather than chasing untested theories or flashy trends. That preference isn't rigidity — it's an earned trust in the methods that have consistently delivered results in your experience",
			social:
				"the people in your life can count on your consistency, knowing that what worked yesterday will still work tomorrow because you don't change course without good reason",
			drive:
				"The reliability of well-established ways of doing things provides a kind of security that frees your energy for the things that truly matter, rather than constantly reinventing the wheel",
		},
	},
	C: {
		D: {
			opener:
				"Tasks get approached with discipline and careful planning, a methodical quality that ensures nothing important falls through the cracks",
			depth:
				"An organized nature means important details rarely get left to chance — each step is thought through, each contingency considered, and the result is work that holds up under scrutiny. That thoroughness extends beyond professional life into how you manage your personal world as well",
			social:
				"others learn quickly that commitments you make are commitments you keep, because follow-through isn't optional in your vocabulary",
			drive:
				"The satisfaction of a job done thoroughly and well is deeply rewarding, and that internal standard of excellence pushes you to deliver your best even when no one is watching",
		},
		B: {
			opener:
				"Organizational style adapts to fit whatever situation is at hand, shifting between careful structure and relaxed flexibility as the moment demands",
			depth:
				"That adaptability means you can thrive in environments that would frustrate people who lean too heavily toward either extreme — highly structured settings don't feel stifling, and loosely organized ones don't feel chaotic. Context determines your approach rather than rigid habit",
			social:
				"colleagues and friends find you easy to work with because your approach meets them where they are rather than insisting they come to you",
			drive:
				"Staying effective regardless of circumstances is what matters most, and that versatility keeps you productive and grounded whether plans hold steady or fall apart unexpectedly",
		},
		F: {
			opener:
				"Spontaneity and flexible approaches win out over rigid schedules in how you navigate daily life, creating a rhythm that adapts to circumstances rather than fighting them",
			depth:
				"An easygoing style means pivoting quickly when plans change comes naturally — where others might freeze or stress over disruption, you adjust course and keep moving forward without missing a beat. That flexibility isn't carelessness; it's a genuine comfort with uncertainty",
			social:
				"people around you often feel more relaxed in your presence because your lack of rigidity gives everyone room to breathe and be themselves",
			drive:
				"The freedom to respond to life as it comes, without being boxed in by over-commitments or inflexible expectations, is something you protect instinctively because it's essential to how you function best",
		},
	},
	E: {
		E: {
			opener:
				"Social environments feel energizing rather than draining, and interaction with others is where some of your best thinking and deepest satisfaction happen",
			depth:
				"An outgoing nature makes bringing people together feel instinctive — not as a performance or social obligation but as a genuine expression of who you are. Group settings amplify your energy rather than depleting it, and you tend to leave conversations feeling more alive than when they started",
			social:
				"friends and acquaintances alike notice that your presence shifts the energy in a room, making gatherings feel warmer and more connected",
			drive:
				"The energy and warmth of shared experiences fuel your sense of purpose, and a life rich in human connection feels fundamentally more meaningful than one spent in isolation, no matter how comfortable that isolation might be",
		},
		A: {
			opener:
				"Social settings get engaged selectively, with your moments chosen carefully based on what feels genuine rather than what's expected or convenient",
			depth:
				"A moderate social energy lets you enjoy both company and solitude without either one feeling like a compromise. Crowded rooms don't overwhelm you and quiet evenings don't bore you — your comfort zone is unusually wide, spanning both ends of the social spectrum without strain",
			social:
				"the people closest to you understand that your selectivity about when to engage isn't aloofness but intentionality, a way of ensuring that every interaction gets your full attention",
			drive:
				"Meaningful interactions matter more than constant activity, and choosing quality over quantity in your social life ensures that the connections you build carry real depth and genuine significance",
		},
		I: {
			opener:
				"Quiet reflection and deeper one-on-one connections are where your strength lives, drawing energy from solitude and focused engagement rather than the buzz of social gatherings",
			depth:
				"A reflective nature gives you a rich inner world that fuels your best thinking, the kind of insight that only comes from taking time to sit with ideas rather than reacting to them immediately. That depth of processing means your contributions, when they come, tend to carry unusual weight and clarity",
			social:
				"close friends know that your quiet presence is anything but disengaged — it's attentive, thoughtful, and fully present in a way that louder personalities sometimes struggle to achieve",
			drive:
				"The depth that comes from focused, unhurried engagement is irreplaceable in your experience, and you protect your capacity for it by being intentional about how you spend your social energy",
		},
	},
	A: {
		W: {
			opener:
				"Cooperation and genuine care for the people around you shape how you move through the world, creating connections built on trust and mutual respect",
			depth:
				"Warmth creates a sense of trust that draws others naturally, not through any deliberate strategy but through the simple consistency of treating people well. That kindness isn't naive — it's a deliberate choice to lead with generosity, backed by the understanding that most people respond in kind",
			social:
				"relationships in your life tend to run deep because people sense that your care is authentic, something that's felt rather than performed",
			drive:
				"Building relationships where everyone feels valued is more than a preference — it's a core part of how you understand your own purpose, and the communities you help create reflect that priority at every level",
		},
		N: {
			opener:
				"Personal goals and the needs of others get balanced with a fairness that comes naturally, navigating competing interests without sacrificing either side entirely",
			depth:
				"A fair-minded approach helps you move through situations where other people's needs conflict with your own, finding paths that honor both without resentment or martyrdom. That balance isn't about keeping score — it's about genuinely believing that solutions exist where everyone walks away feeling respected",
			social:
				"people in your life trust you to be honest about your own needs while remaining considerate of theirs, a combination that makes you both reliable and easy to be around",
			drive:
				"Finding solutions that honor both your own path and the people in your life gives you a sense of integrity that purely self-interested or purely self-sacrificing approaches never could",
		},
		C: {
			opener:
				"Independence and trust in your own judgment define how you make decisions, standing by your convictions even when external pressure pushes in a different direction",
			depth:
				"A self-reliant nature means you're comfortable going against the grain when your own analysis tells you it's the right call. That confidence isn't stubbornness for its own sake — it's the natural result of having learned, through experience, that your internal compass is usually worth following",
			social:
				"the people who know you well respect your directness and the consistency of your positions, even when they disagree with the conclusions you reach",
			drive:
				"The freedom to chart your own course without compromise is something you value at a fundamental level, and the decisions you make reflect that commitment to personal autonomy and honest self-direction",
		},
	},
};

/**
 * Base RGB colors per trait level for deterministic color generation.
 */
const TRAIT_COLORS = {
	O: { O: [74, 144, 226], G: [128, 128, 128], P: [200, 180, 140] },
	C: { D: [46, 139, 87], B: [128, 128, 128], F: [210, 150, 80] },
	E: { E: [255, 165, 0], A: [128, 128, 128], I: [100, 100, 180] },
	A: { W: [255, 105, 180], N: [128, 128, 128], C: [120, 120, 120] },
};

const TRAIT_ORDER: readonly TraitKey[] = ["O", "C", "E", "A"];

/** Parsed 4-letter code as a fixed-length tuple of trait-level letters. */
type Code4Tuple = [Code4Letter, Code4Letter, Code4Letter, Code4Letter];

/**
 * Parse a validated 4-letter code into a typed tuple.
 * Must only be called after regex validation.
 */
const parseCode4 = (code4: string): Code4Tuple =>
	[code4[0], code4[1], code4[2], code4[3]] as Code4Tuple;

/**
 * Calculate the "extremeness" of a trait level (distance from mid).
 * High and Low letters are extreme (1), Mid letters are not (0).
 */
const MID_LETTERS = new Set(["G", "B", "A", "N"]);
const extremeness = (letter: Code4Letter): number => (MID_LETTERS.has(letter) ? 0 : 1);

/**
 * Generate a personality name from a 4-letter code using component-based approach.
 *
 * Strategy: Pick one adjective from the primary trait (most extreme, OCEAN priority for ties)
 * and combine with a noun derived from the Agreeableness level.
 *
 * @param levels - Parsed 4-letter code tuple
 * @returns Generated name like "Creative Collaborator"
 */
const generateArchetypeName = (levels: Code4Tuple): string => {
	// Find primary trait: most extreme (High or Low), OCEAN order for ties
	let primaryIdx = 0;
	let primaryExtremeness = extremeness(levels[0]);

	for (let i = 1; i < 4; i++) {
		const ext = extremeness(levels[i] as Code4Letter);
		if (ext > primaryExtremeness) {
			primaryIdx = i;
			primaryExtremeness = ext;
		}
	}

	const primaryTrait = TRAIT_ORDER[primaryIdx] as TraitKey;
	const primaryLevel = levels[primaryIdx] as Code4Letter;
	const adjectives = (TRAIT_ADJECTIVES as LevelLookup<string[]>)[primaryTrait][primaryLevel];
	const adjective = adjectives[0]; // deterministic: always first

	const aLevel = levels[3]; // Agreeableness is 4th position
	const noun = AGREEABLENESS_NOUNS[aLevel as string];

	return `${adjective} ${noun}`;
};

/**
 * Generate a rich description from trait levels using second-person voice.
 *
 * Produces 4 paragraphs joined into a single string:
 * 1. O+C behavioral foundation (O.opener + C.opener + O.depth)
 * 2. E+A social and interpersonal (E.opener + A.opener + E.depth)
 * 3. Cross-trait social nuances (A.social + E.social + C.social)
 * 4. Motivational synthesis (O.drive + A.drive)
 *
 * @param levels - Parsed 4-letter code tuple
 * @returns Description string (1500-2500 characters)
 */
const generateDescription = (levels: Code4Tuple): string => {
	type TraitFragment = {
		opener: string;
		depth: string;
		social: string;
		drive: string;
	};
	const descs = TRAIT_DESCRIPTIONS as LevelLookup<TraitFragment>;
	const o = descs.O[levels[0]];
	const c = descs.C[levels[1]];
	const e = descs.E[levels[2]];
	const a = descs.A[levels[3]];

	/** Capitalize the first letter of a fragment for sentence-start position. */
	const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

	const parts: string[] = [];

	// Para 1: O+C behavioral foundation
	parts.push(`${o.opener}. ${c.opener}. ${o.depth}.`);

	// Para 2: E+A social and interpersonal
	parts.push(`${e.opener}. ${a.opener}. ${e.depth}.`);

	// Para 3: Cross-trait social nuances (c.social starts a new sentence after ". ")
	parts.push(`In relationships, ${a.social}. At the same time, ${e.social}. ${cap(c.social)}.`);

	// Para 4: Motivational synthesis
	parts.push(`${o.drive}. ${a.drive}.`);

	return parts.join(" ");
};

/**
 * Generate a deterministic hex color by averaging trait-level RGB values.
 *
 * @param levels - Parsed 4-letter code tuple
 * @returns Hex color string like "#4A90D9"
 */
const generateColor = (levels: Code4Tuple): string => {
	let r = 0;
	let g = 0;
	let b = 0;

	for (let i = 0; i < 4; i++) {
		const trait = TRAIT_ORDER[i] as TraitKey;
		const level = levels[i] as Code4Letter;
		const [tr, tg, tb] = (TRAIT_COLORS as LevelLookup<[number, number, number]>)[trait][level];
		r += tr;
		g += tg;
		b += tb;
	}

	r = Math.round(r / 4);
	g = Math.round(g / 4);
	b = Math.round(b / 4);

	const toHex = (n: number): string => n.toString(16).padStart(2, "0").toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Look up the personality archetype for a 4-letter OCEAN code.
 *
 * Checks hand-curated entries first, falls back to component-based generation.
 * Every valid 4-letter code (81 total) returns a valid archetype.
 *
 * @param code4 - 4-character string using trait-specific letters (O,C,E,A positions)
 * @returns Archetype with name, description, color, and curation status
 * @throws Error if code4 doesn't match valid letter pattern
 *
 * @example
 * ```typescript
 * const archetype = lookupArchetype("ODAW");
 * // → { code4: "ODAW", name: "The Creative Diplomat", ... }
 * ```
 */
export const lookupArchetype = (code4: string): Archetype => {
	if (!VALID_CODE4_REGEX.test(code4)) {
		throw new Error(
			`Invalid 4-letter OCEAN code: "${code4}". Expected pattern: [PGO][FBD][IAE][CNW].`,
		);
	}

	const validCode4 = code4 as OceanCode4;
	const curated = CURATED_ARCHETYPES[code4];
	if (curated) {
		return {
			code4: validCode4,
			name: curated.name,
			description: curated.description,
			color: curated.color,
			isCurated: true,
		};
	}

	const levels = parseCode4(code4);
	return {
		code4: validCode4,
		name: generateArchetypeName(levels),
		description: generateDescription(levels),
		color: generateColor(levels),
		isCurated: false,
	};
};

/**
 * Extract the first 4 characters from a 5-letter OCEAN code.
 *
 * Drops the Neuroticism letter (5th position) for POC archetype lookup.
 *
 * @param oceanCode5 - 5-character OCEAN code (e.g., "ODEWR")
 * @returns 4-character code (e.g., "ODEW")
 * @throws Error if input doesn't match valid 5-letter pattern
 *
 * @example
 * ```typescript
 * extract4LetterCode("ODEWR") // → "ODEW"
 * ```
 */
export const extract4LetterCode = (oceanCode5: string): OceanCode4 => {
	if (!VALID_CODE5_REGEX.test(oceanCode5)) {
		throw new Error(
			`Invalid 5-letter OCEAN code: "${oceanCode5}". Expected pattern: [PGO][FBD][IAE][CNW][RTS].`,
		);
	}
	return oceanCode5.slice(0, 4) as OceanCode4;
};
