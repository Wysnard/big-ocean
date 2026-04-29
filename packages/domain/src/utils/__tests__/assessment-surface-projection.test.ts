import { describe, expect, it } from "vitest";
import { ALL_FACETS } from "../../constants/big-five";
import {
	buildFacetScoresMap,
	projectAssessmentSurfaceFromPersistedFacets,
} from "../assessment-surface-projection";

describe("buildFacetScoresMap", () => {
	it("fills all 30 facets; missing keys default to score 0 and confidence 0", () => {
		const partial = { imagination: { score: 12, confidence: 80 } };
		const map = buildFacetScoresMap(partial);

		expect(Object.keys(map).length).toBe(30);
		for (const f of ALL_FACETS) {
			expect(map[f]).toBeDefined();
		}
		expect(map.imagination).toEqual({ score: 12, confidence: 80 });
		const other = ALL_FACETS.filter((x) => x !== "imagination");
		for (const f of other) {
			expect(map[f]).toEqual({ score: 0, confidence: 0 });
		}
	});

	it("hydrates empty persisted record to all-zero facets", () => {
		const map = buildFacetScoresMap({});
		for (const f of ALL_FACETS) {
			expect(map[f]).toEqual({ score: 0, confidence: 0 });
		}
	});
});

describe("projectAssessmentSurfaceFromPersistedFacets", () => {
	it("returns a consistent facet map and projection", () => {
		const { facetScoresMap, projection } = projectAssessmentSurfaceFromPersistedFacets({});
		expect(facetScoresMap.imagination?.score).toBe(0);
		expect(projection.oceanCode5).toMatch(/^[A-Z]{5}$/);
		expect(projection.archetype.name).toBeDefined();
	});
});
