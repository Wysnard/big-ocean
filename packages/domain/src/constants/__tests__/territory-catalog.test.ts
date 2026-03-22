import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { TerritoryIdSchema } from "../../types/territory";
import { ALL_FACETS, isFacetName } from "../big-five";
import { LIFE_DOMAINS } from "../life-domain";
import { getTerritoryById, TERRITORY_CATALOG } from "../territory-catalog";

describe("TERRITORY_CATALOG", () => {
	it("contains exactly 25 territories", () => {
		expect(TERRITORY_CATALOG.size).toBe(25);
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

	it("each territory has exactly 2 domains", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				territory.domains.length,
				`Territory "${id}" has ${territory.domains.length} domains (expected exactly 2)`,
			).toBe(2);
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

	it("all expectedEnergy values are in [0, 1] range", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				territory.expectedEnergy,
				`Territory "${id}" has expectedEnergy ${territory.expectedEnergy} outside [0, 1]`,
			).toBeGreaterThanOrEqual(0);
			expect(
				territory.expectedEnergy,
				`Territory "${id}" has expectedEnergy ${territory.expectedEnergy} outside [0, 1]`,
			).toBeLessThanOrEqual(1);
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

	it("all domains appear in >= 6 territories", () => {
		const domainCounts = new Map<string, number>();
		for (const [, territory] of TERRITORY_CATALOG) {
			for (const domain of territory.domains) {
				domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
			}
		}
		// Check only steerable domains (not "other")
		for (const domain of ["work", "relationships", "family", "leisure", "solo"]) {
			const count = domainCounts.get(domain) ?? 0;
			expect(
				count,
				`Domain "${domain}" appears in only ${count} territories (expected >= 6)`,
			).toBeGreaterThanOrEqual(6);
		}
	});

	it("each territory has a non-empty name string", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(territory.name.length, `Territory "${id}" has empty name`).toBeGreaterThan(0);
		}
	});

	it("each territory has a non-empty description string", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(territory.description.length, `Territory "${id}" has empty description`).toBeGreaterThan(
				0,
			);
		}
	});

	it("each territory has a non-empty descriptionYou string", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				territory.descriptionYou.length,
				`Territory "${id}" has empty descriptionYou`,
			).toBeGreaterThan(0);
		}
	});

	it("descriptionYou uses second-person pronouns", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			expect(
				territory.descriptionYou,
				`Territory "${id}" descriptionYou should use 'you/your' not 'they/their'`,
			).not.toMatch(/\bthey\b|\btheir\b|\bthem\b/i);
		}
	});

	it("descriptions follow curiosity framing pattern", () => {
		const validStarts = ["how", "what", "who", "when", "where", "the"];
		for (const [id, territory] of TERRITORY_CATALOG) {
			const firstWord = territory.description.split(" ")[0]?.toLowerCase();
			expect(
				validStarts.includes(firstWord),
				`Territory "${id}" description starts with "${firstWord}" — expected one of: ${validStarts.join(", ")}`,
			).toBe(true);
		}
	});

	it("has correct energy distribution: 9 light, 10 medium, 6 heavy", () => {
		let light = 0;
		let medium = 0;
		let heavy = 0;
		for (const [, territory] of TERRITORY_CATALOG) {
			const e = territory.expectedEnergy;
			if (e >= 0.2 && e <= 0.37) light++;
			else if (e >= 0.38 && e <= 0.53) medium++;
			else if (e >= 0.58 && e <= 0.72) heavy++;
		}
		expect(light, `Expected 9 light territories, got ${light}`).toBe(9);
		expect(medium, `Expected 10 medium territories, got ${medium}`).toBe(10);
		expect(heavy, `Expected 6 heavy territories, got ${heavy}`).toBe(6);
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
