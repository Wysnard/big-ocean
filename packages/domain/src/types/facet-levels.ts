/**
 * Facet-Level Types and Mappings (Story 8.3)
 *
 * Each of the 30 Big Five facets has two named levels (Low/High) identified
 * by globally unique two-letter codes. The first letter is the OCEAN trait
 * prefix (O/C/E/A/N), the second is a facet-specific letter.
 *
 * Threshold: 0-10 = Low code, 11-20 = High code (binary split).
 */

import type { FacetName } from "../constants/big-five";

// ─── Openness Facet Levels (O prefix) ───────────────────────────────────────

export type ImaginationLevel = "OP" | "OV";
export type ArtisticInterestsLevel = "OL" | "OA";
export type EmotionalityLevel = "OS" | "OE";
export type AdventurousnessLevel = "OC" | "OD";
export type IntellectLevel = "OF" | "OI";
export type LiberalismLevel = "OT" | "OR";

// ─── Conscientiousness Facet Levels (C prefix) ──────────────────────────────

export type SelfEfficacyLevel = "CD" | "CA";
export type OrderlinessLevel = "CS" | "CM";
export type DutifulnessLevel = "CI" | "CO";
export type AchievementStrivingLevel = "CR" | "CE";
export type SelfDisciplineLevel = "CF" | "CP";
export type CautiousnessLevel = "CB" | "CL";

// ─── Extraversion Facet Levels (E prefix) ────────────────────────────────────

export type FriendlinessLevel = "ER" | "EW";
export type GregariousnessLevel = "ES" | "EG";
export type AssertivenessLevel = "ED" | "EA";
export type ActivityLevelLevel = "EC" | "EB";
export type ExcitementSeekingLevel = "EP" | "ET";
export type CheerfulnessLevel = "EM" | "EL";

// ─── Agreeableness Facet Levels (A prefix) ───────────────────────────────────

export type TrustLevel = "AS" | "AT";
export type MoralityLevel = "AD" | "AI";
export type AltruismLevel = "AF" | "AG";
export type CooperationLevel = "AC" | "AH";
export type ModestyLevel = "AO" | "AU";
export type SympathyLevel = "AL" | "AE";

// ─── Neuroticism Facet Levels (N prefix) ─────────────────────────────────────

export type AnxietyLevel = "NC" | "NA";
export type AngerLevel = "NP" | "NF";
export type DepressionLevel = "NB" | "NS";
export type SelfConsciousnessLevel = "NU" | "NW";
export type ImmoderationLevel = "ND" | "NI";
export type VulnerabilityLevel = "NR" | "NV";

// ─── Facet Letter Map ────────────────────────────────────────────────────────

/** Maps each facet to its [lowCode, highCode] two-letter level codes */
export const FACET_LETTER_MAP: Record<FacetName, readonly [string, string]> = {
	// Openness facets (O prefix)
	imagination: ["OP", "OV"],
	artistic_interests: ["OL", "OA"],
	emotionality: ["OS", "OE"],
	adventurousness: ["OC", "OD"],
	intellect: ["OF", "OI"],
	liberalism: ["OT", "OR"],

	// Conscientiousness facets (C prefix)
	self_efficacy: ["CD", "CA"],
	orderliness: ["CS", "CM"],
	dutifulness: ["CI", "CO"],
	achievement_striving: ["CR", "CE"],
	self_discipline: ["CF", "CP"],
	cautiousness: ["CB", "CL"],

	// Extraversion facets (E prefix)
	friendliness: ["ER", "EW"],
	gregariousness: ["ES", "EG"],
	assertiveness: ["ED", "EA"],
	activity_level: ["EC", "EB"],
	excitement_seeking: ["EP", "ET"],
	cheerfulness: ["EM", "EL"],

	// Agreeableness facets (A prefix)
	trust: ["AS", "AT"],
	morality: ["AD", "AI"],
	altruism: ["AF", "AG"],
	cooperation: ["AC", "AH"],
	modesty: ["AO", "AU"],
	sympathy: ["AL", "AE"],

	// Neuroticism facets (N prefix)
	anxiety: ["NC", "NA"],
	anger: ["NP", "NF"],
	depression: ["NB", "NS"],
	self_consciousness: ["NU", "NW"],
	immoderation: ["ND", "NI"],
	vulnerability: ["NR", "NV"],
} as const;

// ─── Per-Trait Facet Level Labels ───────────────────────────────────────────

const OPENNESS_FACET_LEVEL_LABELS = {
	OP: "Concrete",
	OV: "Visionary",
	OL: "Utilitarian",
	OA: "Aesthetic",
	OS: "Stoic",
	OE: "Expressive",
	OC: "Consistent",
	OD: "Daring",
	OF: "Focused",
	OI: "Inquisitive",
	OT: "Traditional",
	OR: "Progressive",
} as const;

const CONSCIENTIOUSNESS_FACET_LEVEL_LABELS = {
	CD: "Tentative",
	CA: "Capable",
	CS: "Spontaneous",
	CM: "Methodical",
	CI: "Independent",
	CO: "Devoted",
	CR: "Easygoing",
	CE: "Driven",
	CF: "Freewheeling",
	CP: "Persistent",
	CB: "Decisive",
	CL: "Deliberate",
} as const;

const EXTRAVERSION_FACET_LEVEL_LABELS = {
	ER: "Reserved",
	EW: "Welcoming",
	ES: "Solitary",
	EG: "Sociable",
	ED: "Deferential",
	EA: "Commanding",
	EC: "Unhurried",
	EB: "Energetic",
	EP: "Serene",
	ET: "Adventurous",
	EM: "Reflective",
	EL: "Radiant",
} as const;

const AGREEABLENESS_FACET_LEVEL_LABELS = {
	AS: "Guarded",
	AT: "Trusting",
	AD: "Shrewd",
	AI: "Principled",
	AF: "Self-reliant",
	AG: "Giving",
	AC: "Competitive",
	AH: "Harmonious",
	AO: "Forthright",
	AU: "Unassuming",
	AL: "Objective",
	AE: "Compassionate",
} as const;

const NEUROTICISM_FACET_LEVEL_LABELS = {
	NC: "Composed",
	NA: "Vigilant",
	NP: "Patient",
	NF: "Fiery",
	NB: "Buoyant",
	NS: "Melancholy",
	NU: "Poised",
	NW: "Self-aware",
	ND: "Restrained",
	NI: "Impulsive",
	NR: "Sturdy",
	NV: "Tender",
} as const;

// ─── Merged Facet Level Labels ──────────────────────────────────────────────

/** Human-readable label for every two-letter facet code — globally unique flat map */
export const FACET_LEVEL_LABELS = {
	...OPENNESS_FACET_LEVEL_LABELS,
	...CONSCIENTIOUSNESS_FACET_LEVEL_LABELS,
	...EXTRAVERSION_FACET_LEVEL_LABELS,
	...AGREEABLENESS_FACET_LEVEL_LABELS,
	...NEUROTICISM_FACET_LEVEL_LABELS,
} as const;

/** Derived type — preserves literal code→label mappings for type-safe lookups */
export type FacetLevelLabels = typeof FACET_LEVEL_LABELS;

/** Union of all valid two-letter facet level codes */
export type FacetLevelCode = keyof FacetLevelLabels;
