import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import { ENERGY_LEVELS, type EnergyLevel, type Territory, TerritoryIdSchema } from "../territory";

describe("Territory Types", () => {
	describe("TerritoryId (branded string)", () => {
		it("decodes a valid string into a TerritoryId", () => {
			const result = Schema.decodeSync(TerritoryIdSchema)("creative-pursuits");
			expect(result).toBe("creative-pursuits");
		});

		it("rejects non-string values", () => {
			expect(() => Schema.decodeSync(TerritoryIdSchema)(123 as unknown)).toThrow();
		});
	});

	describe("EnergyLevel", () => {
		it("has exactly 3 values: light, medium, heavy", () => {
			expect(ENERGY_LEVELS).toEqual(["light", "medium", "heavy"]);
			expect(ENERGY_LEVELS).toHaveLength(3);
		});

		it("type-checks valid energy levels", () => {
			const light: EnergyLevel = "light";
			const medium: EnergyLevel = "medium";
			const heavy: EnergyLevel = "heavy";
			expect([light, medium, heavy]).toEqual(["light", "medium", "heavy"]);
		});
	});

	describe("Territory interface", () => {
		it("enforces correct shape with valid types", () => {
			const territory: Territory = {
				id: Schema.decodeSync(TerritoryIdSchema)("test-territory"),
				energyLevel: "light",
				domains: ["work", "relationships"] as readonly LifeDomain[],
				expectedFacets: ["imagination", "intellect", "adventurousness"] as readonly FacetName[],
				opener: "Tell me about a time you tried something new at work.",
			};
			expect(territory.id).toBe("test-territory");
			expect(territory.energyLevel).toBe("light");
			expect(territory.domains).toHaveLength(2);
			expect(territory.expectedFacets).toHaveLength(3);
			expect(territory.opener).toBeDefined();
		});
	});
});
