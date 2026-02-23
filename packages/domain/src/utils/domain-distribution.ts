/**
 * Domain Distribution Utility
 *
 * Aggregates evidence records into a distribution across all 6 life domains.
 * Ensures every domain key is always present (never sparse).
 *
 * Story 10.2
 */
import type { LifeDomain } from "../constants/life-domain";
import { LIFE_DOMAINS } from "../constants/life-domain";
import type { EvidenceInput } from "../types/evidence";

/** Mapped type guaranteeing all 6 domains are always present */
export type DomainDistribution = { readonly [K in LifeDomain]: number };

/**
 * Count evidence records per life domain.
 * Returns a complete distribution with all 6 domains (0 for domains with no evidence).
 */
export function aggregateDomainDistribution(
	evidence: readonly EvidenceInput[],
): DomainDistribution {
	const counts = Object.fromEntries(LIFE_DOMAINS.map((d) => [d, 0])) as Record<LifeDomain, number>;
	for (const e of evidence) {
		counts[e.domain] += 1;
	}
	return counts as DomainDistribution;
}
