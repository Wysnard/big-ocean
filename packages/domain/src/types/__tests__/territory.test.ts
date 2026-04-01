import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { FacetName } from "../../constants/big-five";
import { type Territory, TerritoryIdSchema } from "../territory";

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

	describe("Territory interface", () => {
		it("enforces correct shape with expectedEnergy and 2-tuple domains", () => {
			const territory: Territory = {
				id: Schema.decodeSync(TerritoryIdSchema)("test-territory"),
				expectedEnergy: 0.42,
				domains: ["work", "relationships"] as const,
				expectedFacets: ["imagination", "intellect", "adventurousness"] as readonly FacetName[],
				opener: "Tell me about a time you tried something new at work.",
			};
			expect(territory.id).toBe("test-territory");
			expect(territory.expectedEnergy).toBe(0.42);
			expect(territory.domains).toHaveLength(2);
			expect(territory.expectedFacets).toHaveLength(3);
			expect(territory.opener).toBeDefined();
		});

		it("expectedEnergy is a continuous number in [0, 1]", () => {
			const territory: Territory = {
				id: Schema.decodeSync(TerritoryIdSchema)("light-territory"),
				expectedEnergy: 0.25,
				domains: ["leisure", "health"] as const,
				expectedFacets: ["imagination"] as readonly FacetName[],
				opener: "Test",
			};
			expect(territory.expectedEnergy).toBeGreaterThanOrEqual(0);
			expect(territory.expectedEnergy).toBeLessThanOrEqual(1);
		});
	});
});
