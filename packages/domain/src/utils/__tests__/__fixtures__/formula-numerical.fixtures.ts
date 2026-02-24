import type { FacetName } from "../../../constants/big-five";
import type { LifeDomain } from "../../../constants/life-domain";
import type { EvidenceInput } from "../../../types/evidence";
import type { FacetMetrics } from "../../formula";

export function ev(
	facet: FacetName,
	domain: LifeDomain,
	score: number,
	confidence: number,
): EvidenceInput {
	return { bigfiveFacet: facet, domain, score, confidence };
}

export function m(result: Map<FacetName, FacetMetrics>, facet: FacetName): FacetMetrics {
	const metrics = result.get(facet);
	if (!metrics) throw new Error(`No metrics for ${facet}`);
	return metrics;
}
