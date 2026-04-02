import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { TerritoryIdSchema } from "../../types/territory";
import { ALL_FACETS, isFacetName } from "../big-five";
import { LIFE_DOMAINS } from "../life-domain";
import { getTerritoryById, TERRITORY_CATALOG } from "../territory-catalog";

describe("TERRITORY_CATALOG", () => {
	it("contains exactly 31 territories", () => {
		expect(TERRITORY_CATALOG.size).toBe(31);
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

	it("no territory references the solo domain", () => {
		for (const [id, territory] of TERRITORY_CATALOG) {
			for (const domain of territory.domains) {
				expect(domain, `Territory "${id}" still references deprecated "solo" domain`).not.toBe("solo");
			}
		}
	});

	it("active steerable domains appear in >= 6 territories", () => {
		const domainCounts = new Map<string, number>();
		for (const [, territory] of TERRITORY_CATALOG) {
			for (const domain of territory.domains) {
				domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
			}
		}
		// Check active steerable domains (not "other", not deprecated "solo")
		for (const domain of ["work", "relationships", "family", "leisure", "health"]) {
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

	it("has correct energy distribution: 12 light, 12 medium, 7 heavy", () => {
		let light = 0;
		let medium = 0;
		let heavy = 0;
		for (const [, territory] of TERRITORY_CATALOG) {
			const e = territory.expectedEnergy;
			if (e >= 0.2 && e <= 0.37) light++;
			else if (e >= 0.38 && e <= 0.53) medium++;
			else if (e >= 0.58 && e <= 0.72) heavy++;
		}
		expect(light, `Expected 12 light territories, got ${light}`).toBe(12);
		expect(medium, `Expected 12 medium territories, got ${medium}`).toBe(12);
		expect(heavy, `Expected 7 heavy territories, got ${heavy}`).toBe(7);
	});
});

describe("inner-life territory", () => {
	it("exists in the catalog with correct id", () => {
		const innerLifeId = Schema.decodeSync(TerritoryIdSchema)("inner-life");
		const territory = getTerritoryById(innerLifeId);
		expect(territory).toBeDefined();
		expect(territory?.id).toBe(innerLifeId);
	});

	it("has domains health and leisure", () => {
		const innerLifeId = Schema.decodeSync(TerritoryIdSchema)("inner-life");
		const territory = getTerritoryById(innerLifeId);
		expect(territory?.domains).toEqual(["health", "leisure"]);
	});

	it("has the correct 5 facets", () => {
		const innerLifeId = Schema.decodeSync(TerritoryIdSchema)("inner-life");
		const territory = getTerritoryById(innerLifeId);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining([
				"intellect",
				"emotionality",
				"imagination",
				"liberalism",
				"artistic_interests",
			]),
		);
		expect(territory?.expectedFacets).toHaveLength(5);
	});

	it("has expectedEnergy 0.60", () => {
		const innerLifeId = Schema.decodeSync(TerritoryIdSchema)("inner-life");
		const territory = getTerritoryById(innerLifeId);
		expect(territory?.expectedEnergy).toBe(0.6);
	});
});

describe("identity-and-purpose removal", () => {
	it("no longer exists in the catalog", () => {
		const oldId = Schema.decodeSync(TerritoryIdSchema)("identity-and-purpose");
		expect(getTerritoryById(oldId)).toBeUndefined();
	});
});

describe("domain remap verification", () => {
	const remapTable: Record<string, [string, string]> = {
		"daily-routines": ["work", "health"],
		"creative-pursuits": ["leisure", "work"],
		"weekend-adventures": ["leisure", "relationships"],
		"learning-curiosity": ["leisure", "work"],
		"comfort-zones": ["health", "relationships"],
		"spontaneity-and-impulse": ["leisure", "health"],
		"emotional-awareness": ["health", "relationships"],
		"ambition-and-goals": ["work", "health"],
		"growing-up": ["family", "relationships"],
		"friendship-depth": ["relationships", "leisure"],
		"opinions-and-values": ["relationships", "work"],
		"inner-struggles": ["health", "relationships"],
	};

	for (const [territoryId, expectedDomains] of Object.entries(remapTable)) {
		it(`${territoryId} has domains [${expectedDomains.join(", ")}]`, () => {
			const id = Schema.decodeSync(TerritoryIdSchema)(territoryId);
			const territory = getTerritoryById(id);
			expect(territory).toBeDefined();
			expect(territory?.domains).toEqual(expectedDomains);
		});
	}
});

describe("new health territories (Story 41-2)", () => {
	it("body-and-movement has correct definition", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("body-and-movement");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.domains).toEqual(["health", "leisure"]);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining(["activity_level", "self_discipline", "excitement_seeking"]),
		);
		expect(territory?.expectedFacets).toHaveLength(3);
		expect(territory?.expectedEnergy).toBe(0.25);
	});

	it("cravings-and-indulgences has correct definition", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("cravings-and-indulgences");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.domains).toEqual(["health", "leisure"]);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining(["immoderation", "self_discipline", "cautiousness"]),
		);
		expect(territory?.expectedFacets).toHaveLength(3);
		expect(territory?.expectedEnergy).toBe(0.4);
	});

	it("stress-and-the-body has correct definition", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("stress-and-the-body");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.domains).toEqual(["health", "work"]);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining(["vulnerability", "anxiety", "self_efficacy", "self_discipline"]),
		);
		expect(territory?.expectedFacets).toHaveLength(4);
		expect(territory?.expectedEnergy).toBe(0.6);
	});
});

describe("new hard-to-assess coverage territories (Story 41-2)", () => {
	it("home-and-space has correct definition", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("home-and-space");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.domains).toEqual(["family", "leisure"]);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining(["orderliness", "activity_level", "cautiousness"]),
		);
		expect(territory?.expectedFacets).toHaveLength(3);
		expect(territory?.expectedEnergy).toBe(0.22);
	});

	it("trips-and-plans has correct definition", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("trips-and-plans");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.domains).toEqual(["leisure", "relationships"]);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining(["orderliness", "adventurousness", "cooperation"]),
		);
		expect(territory?.expectedFacets).toHaveLength(3);
		expect(territory?.expectedEnergy).toBe(0.28);
	});

	it("taking-care has correct definition", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("taking-care");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.domains).toEqual(["health", "family"]);
		expect(territory?.expectedFacets).toEqual(
			expect.arrayContaining(["altruism", "sympathy", "dutifulness", "self_discipline"]),
		);
		expect(territory?.expectedFacets).toHaveLength(4);
		expect(territory?.expectedEnergy).toBe(0.48);
	});
});

describe("facet additions to existing territories (Story 41-3)", () => {
	it("work-dynamics includes cautiousness", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("work-dynamics");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.expectedFacets).toContain("cautiousness");
	});

	it("growing-up includes liberalism", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("growing-up");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.expectedFacets).toContain("liberalism");
	});

	it("inner-life includes artistic_interests (from Story 2.1)", () => {
		const id = Schema.decodeSync(TerritoryIdSchema)("inner-life");
		const territory = getTerritoryById(id);
		expect(territory).toBeDefined();
		expect(territory?.expectedFacets).toContain("artistic_interests");
	});
});

describe("catalog validation (Story 41-3)", () => {
	it("every facet has >= 2 territory routes", () => {
		const facetTerritoryCount = new Map<string, number>();
		for (const facet of ALL_FACETS) {
			facetTerritoryCount.set(facet, 0);
		}
		for (const [, territory] of TERRITORY_CATALOG) {
			for (const facet of territory.expectedFacets) {
				facetTerritoryCount.set(facet, (facetTerritoryCount.get(facet) ?? 0) + 1);
			}
		}
		for (const [facet, count] of facetTerritoryCount) {
			expect(
				count,
				`Facet "${facet}" appears in only ${count} territories (expected >= 2)`,
			).toBeGreaterThanOrEqual(2);
		}
	});

	it("no hard-to-assess facet is stuck in a single domain pair", () => {
		const hardToAssess = [
			"orderliness",
			"artistic_interests",
			"cautiousness",
			"liberalism",
			"dutifulness",
			"altruism",
			"immoderation",
			"depression",
			"modesty",
			"adventurousness",
		];
		for (const facet of hardToAssess) {
			const domainPairs = new Set<string>();
			for (const [, territory] of TERRITORY_CATALOG) {
				if (territory.expectedFacets.includes(facet as any)) {
					const sortedDomains = [...territory.domains].sort().join(",");
					domainPairs.add(sortedDomains);
				}
			}
			expect(
				domainPairs.size,
				`Hard-to-assess facet "${facet}" is stuck in ${domainPairs.size} domain pair(s): ${[...domainPairs].join(" | ")} (expected >= 2)`,
			).toBeGreaterThanOrEqual(2);
		}
	});

	it("orderliness appears in >= 3 territories across >= 4 domains", () => {
		const territories: string[] = [];
		const domains = new Set<string>();
		for (const [id, territory] of TERRITORY_CATALOG) {
			if (territory.expectedFacets.includes("orderliness" as any)) {
				territories.push(id as string);
				for (const domain of territory.domains) {
					domains.add(domain);
				}
			}
		}
		expect(
			territories.length,
			`orderliness appears in ${territories.length} territories (expected >= 3)`,
		).toBeGreaterThanOrEqual(3);
		expect(
			domains.size,
			`orderliness appears across ${domains.size} domains (expected >= 4)`,
		).toBeGreaterThanOrEqual(4);
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
