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
	"solo",
	"other",
] as const;

export type LifeDomain = (typeof LIFE_DOMAINS)[number];

export const LifeDomainSchema = S.Literal(...LIFE_DOMAINS);

/** Type guard for steerable domains (excludes "other") */
const isSteerableDomain = (d: LifeDomain): d is Exclude<LifeDomain, "other"> => d !== "other";

/** Domains eligible for steering (excludes "other") */
export const STEERABLE_DOMAINS = LIFE_DOMAINS.filter(isSteerableDomain);
