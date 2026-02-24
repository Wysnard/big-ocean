import type { FacetName } from "../../../constants/big-five";
import type { LifeDomain } from "../../../constants/life-domain";
import type { EvidenceInput } from "../../../types/evidence";
import type { FacetMetrics } from "../../formula";

export function makeEvidence(
	facet: FacetName,
	domain: LifeDomain,
	score: number,
	confidence: number,
): EvidenceInput {
	return { bigfiveFacet: facet, domain, score, confidence };
}

export function getMetrics(result: Map<FacetName, FacetMetrics>, facet: FacetName): FacetMetrics {
	const m = result.get(facet);
	if (!m) throw new Error(`No metrics for facet: ${facet}`);
	return m;
}
