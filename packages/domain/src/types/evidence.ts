/**
 * Evidence Input Type
 *
 * Minimal intersection type used by formula functions for facet metric calculations.
 * Both conversation_evidence and finalization_evidence rows satisfy this shape.
 */
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";

export interface EvidenceInput {
	readonly bigfiveFacet: FacetName;
	readonly score: number;
	readonly confidence: number;
	readonly domain: LifeDomain;
}
