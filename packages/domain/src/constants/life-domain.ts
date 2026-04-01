/**
 * Life Domain Constants
 *
 * Domains of life explored during personality assessment.
 * Used by conversanalyzer for evidence tagging and steering target selection.
 *
 * Pattern: as const → type → Schema → pgEnum (in infrastructure)
 */
import * as S from "effect/Schema";

export const LIFE_DOMAINS = [
	"work",
	"relationships",
	"family",
	"leisure",
	"health",
	"other",
] as const;

export type LifeDomain = (typeof LIFE_DOMAINS)[number];

export const LifeDomainSchema = S.Literal(...LIFE_DOMAINS);

/** Domains not eligible for steering: "other" (catch-all) */
const NON_STEERABLE: ReadonlySet<LifeDomain> = new Set(["other"]);

/** Type guard for steerable domains */
const isSteerableDomain = (d: LifeDomain): boolean => !NON_STEERABLE.has(d);

/** Domains eligible for steering (excludes "other") */
export const STEERABLE_DOMAINS = LIFE_DOMAINS.filter(isSteerableDomain);

/** @deprecated Solo domain removed in Story 40-3. ActiveLifeDomain is now identical to LifeDomain. */
export type ActiveLifeDomain = LifeDomain;

/**
 * Domain definitions for extraction prompts and domain assignment guidance.
 * Single source of truth — used by ConversAnalyzer prompt and any future domain-referencing code.
 *
 * Key design decisions (scoring-confidence-v2-spec):
 * - leisure absorbs introspective/alone-time aspects previously in solo
 * - health captures self-care, exercise, diet, sleep, stress management
 * - education maps to work (a student's "work" is studying)
 * - other is a last resort — target <5%
 */
export const LIFE_DOMAIN_DEFINITIONS: Record<ActiveLifeDomain, string> = {
	work:
		"Professional activities, career, job tasks, education, studying, colleagues, workplace dynamics",
	relationships: "Romantic partners, close friendships, social connections",
	family: "Parents, siblings, children, extended family, household dynamics",
	leisure:
		"Hobbies, entertainment, sports, travel, group activities, alone-time hobbies, introspection, daydreaming",
	health:
		"Exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management",
	other: "ONLY when truly doesn't fit above. Target <5%",
};
