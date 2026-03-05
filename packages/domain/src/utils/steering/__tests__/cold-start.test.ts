/**
 * Cold-Start Territory Selection Tests — Story 21-4
 *
 * Pure function tests for cold-start territory selection.
 * Tests cover: round-robin selection, scoring handoff, configurable threshold,
 * and output shape matching SteeringOutput.
 */
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { COLD_START_TERRITORIES } from "../../../constants/territory-catalog";
import type { TerritoryId } from "../../../types/territory";
import { TerritoryIdSchema } from "../../../types/territory";
import { selectColdStartTerritory, selectTerritoryWithColdStart } from "../cold-start";
import type { ScoredTerritory } from "../territory-scorer";

// ─── Helpers ──────────────────────────────────────────────────────────

const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

function makeScoredTerritory(id: string, score: number): ScoredTerritory {
	return {
		territory: {
			id: tid(id),
			energyLevel: "medium",
			domains: ["work"],
			expectedFacets: ["imagination", "intellect"],
			opener: "Test opener",
		},
		score,
		coverageValue: 0.8,
		energyFit: 0.7,
		freshnessBonus: 1.0,
	};
}

// ─── selectColdStartTerritory ─────────────────────────────────────────

describe("selectColdStartTerritory", () => {
	it("returns first cold-start territory for message index 0", () => {
		const result = selectColdStartTerritory(0, COLD_START_TERRITORIES);
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[0]);
	});

	it("returns second cold-start territory for message index 1", () => {
		const result = selectColdStartTerritory(1, COLD_START_TERRITORIES);
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[1]);
	});

	it("returns third cold-start territory for message index 2", () => {
		const result = selectColdStartTerritory(2, COLD_START_TERRITORIES);
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[2]);
	});

	it("wraps around with round-robin for index >= array length", () => {
		const result = selectColdStartTerritory(3, COLD_START_TERRITORIES);
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[0]);
	});

	it("returns SteeringOutput shape", () => {
		const result = selectColdStartTerritory(0, COLD_START_TERRITORIES);
		expect(result).toHaveProperty("territoryId");
		expect(Object.keys(result)).toEqual(["territoryId"]);
	});

	it("works with custom cold-start territory list", () => {
		const customTerritories = [tid("custom-a"), tid("custom-b")];
		const result = selectColdStartTerritory(1, customTerritories);
		expect(result.territoryId).toBe(tid("custom-b"));
	});
});

// ─── selectTerritoryWithColdStart ─────────────────────────────────────

describe("selectTerritoryWithColdStart", () => {
	const scoredTerritories = [
		makeScoredTerritory("best-scored", 0.9),
		makeScoredTerritory("second-scored", 0.5),
	];

	it("uses cold-start for message 0", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 0,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[0]);
	});

	it("uses cold-start for message 1", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 1,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[1]);
	});

	it("uses cold-start for message 2", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 2,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[2]);
	});

	it("uses scoring path for message 3 (at threshold)", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 3,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result.territoryId).toBe(tid("best-scored"));
	});

	it("uses scoring path for message 10 (well past threshold)", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 10,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result.territoryId).toBe(tid("best-scored"));
	});

	it("respects configurable threshold (threshold=5)", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 4,
			coldStartThreshold: 5,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		// Message 4 is still below threshold 5, should use cold-start
		expect(result.territoryId).toBe(COLD_START_TERRITORIES[1]); // 4 % 3 = 1
	});

	it("returns SteeringOutput shape from cold-start path", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 0,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result).toHaveProperty("territoryId");
		expect(Object.keys(result)).toEqual(["territoryId"]);
	});

	it("returns SteeringOutput shape from scoring path", () => {
		const result = selectTerritoryWithColdStart({
			messageCount: 5,
			coldStartThreshold: 3,
			coldStartTerritories: COLD_START_TERRITORIES,
			scoredTerritories,
		});
		expect(result).toHaveProperty("territoryId");
		expect(Object.keys(result)).toEqual(["territoryId"]);
	});
});
