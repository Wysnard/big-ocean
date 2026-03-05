import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { ENERGY_LEVELS, TerritoryIdSchema } from "../../types/territory";
import { ALL_FACETS, isFacetName } from "../big-five";
import { LIFE_DOMAINS } from "../life-domain";
import { COLD_START_TERRITORIES, getTerritoryById, TERRITORY_CATALOG } from "../territory-catalog";

describe("TERRITORY_CATALOG", () => {
	it("contains exactly 22 territories", () => {
		expect(TERRITORY_CATALOG.size).toBe(22);
	});

	it("each territory has 3-6 expected facets", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				territory.expectedFacets.length,
				`Territory "${id}" has ${territory.expectedFacets.length} facets (expected 3-6)`,
			).toBeGreaterThanOrEqual(3);
			expect(
				territory.expectedFacets.length,
				`Territory "${id}" has ${territory.expectedFacets.length} facets (expected 3-6)`,
			).toBeLessThanOrEqual(6);
		}
	});

	it("each territory has 1-3 domains", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				territory.domains.length,
				`Territory "${id}" has ${territory.domains.length} domains (expected 1-3)`,
			).toBeGreaterThanOrEqual(1);
			expect(
				territory.domains.length,
				`Territory "${id}" has ${territory.domains.length} domains (expected 1-3)`,
			).toBeLessThanOrEqual(3);
		}
	});

	it("all expectedFacets are valid FacetName values", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			for (const facet of territory.expectedFacets) {
				expect(isFacetName(facet), `Territory "${id}" has invalid facet "${facet}"`).toBe(true);
			}
		}
	});

	it("all domains are valid LifeDomain values", () => {
		const validDomains = new Set(LIFE_DOMAINS);
		for (const [id, territory] of TERRITORY_CATALOG) {
			for (const domain of territory.domains) {
				expect(validDomains.has(domain), `Territory "${id}" has invalid domain "${domain}"`).toBe(true);
			}
		}
	});

	it("all energyLevel values are valid EnergyLevel values", () => {
		const validLevels = new Set(ENERGY_LEVELS);
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				validLevels.has(territory.energyLevel),
				`Territory "${id}" has invalid energy level "${territory.energyLevel}"`,
			).toBe(true);
		}
	});

	it("all 30 facets are covered across the full catalog", () => {
		const coveredFacets = new Set<string>();
		for (const [, territory] of TERRITORY_CATALOG) {
			for (const facet of territory.expectedFacets) {
				coveredFacets.add(facet);
			}
		}
		for (const facet of ALL_FACETS) {
			expect(coveredFacets.has(facet), `Facet "${facet}" is not covered by any territory`).toBe(true);
		}
	});

	it("each territory has a non-empty opener string", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(territory.opener.length, `Territory "${id}" has empty opener`).toBeGreaterThan(0);
		}
	});

	it("territory IDs in the map match the territory.id field", () => {
		for (const [key, territory] of TERRITORY_CATALOG) {
			expect(key).toBe(territory.id);
		}
	});
});

describe("COLD_START_TERRITORIES", () => {
	it("contains exactly 3 territory IDs", () => {
		expect(COLD_START_TERRITORIES).toHaveLength(3);
	});

	it("all IDs exist in the catalog", () => {
		for (const id of COLD_START_TERRITORIES) {
			expect(TERRITORY_CATALOG.has(id), `Cold-start territory "${id}" not found in catalog`).toBe(
				true,
			);
		}
	});

	it("all referenced territories are light-energy", () => {
		for (const id of COLD_START_TERRITORIES) {
			const territory = TERRITORY_CATALOG.get(id);
			expect(territory).toBeDefined();
			expect(territory?.energyLevel, `Cold-start territory "${id}" is not light-energy`).toBe("light");
		}
	});
});

describe("getTerritoryById", () => {
	it("returns the correct territory for a valid ID", () => {
		const firstEntry = TERRITORY_CATALOG.entries().next().value!;
		const [id] = firstEntry;
		const result = getTerritoryById(id);
		expect(result).toBeDefined();
		expect(result?.id).toBe(id);
	});

	it("returns undefined for an invalid ID", () => {
		const invalidId = Schema.decodeSync(TerritoryIdSchema)("nonexistent-territory");
		const result = getTerritoryById(invalidId);
		expect(result).toBeUndefined();
	});
});
