/**
 * Territory Selector Tests — Story 25-3
 *
 * Pure function tests for the territory selector that picks from
 * the scorer's ranked list via deterministic rules based on turn position.
 */
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { RankedTerritory, TerritoryScorerOutput } from "../../../types/pacing";
import type { TerritoryId } from "../../../types/territory";
import { TerritoryIdSchema } from "../../../types/territory";
import {
	COLD_START_PERIMETER,
	deriveSessionPhase,
	deriveTransitionType,
	selectTerritoryV2,
} from "../territory-selector";

// ─── Helpers ──────────────────────────────────────────────────────────

const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

function makeRankedTerritory(id: string, score: number): RankedTerritory {
	return {
		territoryId: tid(id),
		score,
		breakdown: {
			coverageGain: score * 0.4,
			adjacency: score * 0.3,
			skew: score * 0.1,
			malus: 0,
			freshness: 0,
		},
	};
}

function makeScorerOutput(
	ranked: RankedTerritory[],
	overrides: Partial<TerritoryScorerOutput> = {},
): TerritoryScorerOutput {
	return {
		ranked,
		currentTerritory: overrides.currentTerritory ?? tid("current-territory"),
		turnNumber: overrides.turnNumber ?? 12,
		totalTurns: overrides.totalTurns ?? 25,
	};
}

// ─── Cold-Start Perimeter (Turn 1) ───────────────────────────────────

describe("selectTerritoryV2 — cold-start-perimeter (turn 1)", () => {
	it("selects from pool within COLD_START_PERIMETER of top score", () => {
		const ranked = [
			makeRankedTerritory("territory-a", 2.0),
			makeRankedTerritory("territory-b", 2.0 - COLD_START_PERIMETER * 0.5), // within perimeter
			makeRankedTerritory("territory-c", 2.0 - COLD_START_PERIMETER * 2), // outside perimeter
		];
		const input = makeScorerOutput(ranked, { turnNumber: 1 });

		const result = selectTerritoryV2(input, 42);

		// Selected territory must be one of the pool (a or b), not c
		expect(["territory-a", "territory-b"]).toContain(result.selectedTerritory);
		expect(result.selectionRule).toBe("cold-start-perimeter");
		expect(result.selectionSeed).toBe(42);
	});

	it("produces deterministic selection with the same seed", () => {
		const ranked = [
			makeRankedTerritory("territory-a", 2.0),
			makeRankedTerritory("territory-b", 1.95),
			makeRankedTerritory("territory-c", 1.9),
		];
		const input = makeScorerOutput(ranked, { turnNumber: 1 });

		const result1 = selectTerritoryV2(input, 42);
		const result2 = selectTerritoryV2(input, 42);

		expect(result1.selectedTerritory).toBe(result2.selectedTerritory);
		expect(result1.selectionRule).toBe("cold-start-perimeter");
	});

	it("different seeds can produce different selections", () => {
		// Create a large pool so different seeds are likely to pick differently
		const ranked = Array.from({ length: 20 }, (_, i) =>
			makeRankedTerritory(`territory-${i}`, 2.0 - i * 0.001),
		);
		const input = makeScorerOutput(ranked, { turnNumber: 1 });

		const results = new Set<string>();
		for (let seed = 0; seed < 100; seed++) {
			const result = selectTerritoryV2(input, seed);
			results.add(result.selectedTerritory);
		}

		// With 20 territories in pool and 100 seeds, we should get multiple distinct picks
		expect(results.size).toBeGreaterThan(1);
	});

	it("includes all territories within perimeter when all qualify", () => {
		const ranked = [
			makeRankedTerritory("territory-a", 2.0),
			makeRankedTerritory("territory-b", 2.0 - COLD_START_PERIMETER * 0.1),
			makeRankedTerritory("territory-c", 2.0 - COLD_START_PERIMETER * 0.2),
		];
		const input = makeScorerOutput(ranked, { turnNumber: 1 });

		// All three are within perimeter — any could be selected
		const possibleSelections = new Set<string>();
		for (let seed = 0; seed < 200; seed++) {
			const result = selectTerritoryV2(input, seed);
			possibleSelections.add(result.selectedTerritory);
		}

		// All three should be reachable from different seeds
		expect(possibleSelections.size).toBe(3);
	});

	it("falls back to top-1 when only one territory in pool", () => {
		const ranked = [
			makeRankedTerritory("territory-a", 2.0),
			makeRankedTerritory("territory-b", 0.5), // far outside perimeter
		];
		const input = makeScorerOutput(ranked, { turnNumber: 1 });

		const result = selectTerritoryV2(input, 42);
		expect(result.selectedTerritory).toBe("territory-a");
		expect(result.selectionRule).toBe("cold-start-perimeter");
	});
});

// ─── Argmax (Turns 2-24, Steady State) ──────────────────────────────

describe("selectTerritoryV2 — argmax (steady state)", () => {
	it("selects top-1 from ranked list (turn 12)", () => {
		const ranked = [
			makeRankedTerritory("territory-a", 2.5),
			makeRankedTerritory("territory-b", 2.0),
			makeRankedTerritory("territory-c", 1.5),
		];
		const input = makeScorerOutput(ranked, { turnNumber: 12 });

		const result = selectTerritoryV2(input);

		expect(result.selectedTerritory).toBe("territory-a");
		expect(result.selectionRule).toBe("argmax");
		expect(result.selectionSeed).toBeUndefined();
	});

	it("tiebreak uses catalog order (lower index wins)", () => {
		const ranked = [
			makeRankedTerritory("territory-a", 2.0),
			makeRankedTerritory("territory-b", 2.0),
			makeRankedTerritory("territory-c", 2.0),
		];
		const input = makeScorerOutput(ranked, { turnNumber: 12 });

		const result = selectTerritoryV2(input);

		// First in ranked list wins tiebreak (already sorted by scorer with catalog order)
		expect(result.selectedTerritory).toBe("territory-a");
	});

	it("returns scorerOutput in result for debug/replay", () => {
		const ranked = [makeRankedTerritory("territory-a", 2.0)];
		const input = makeScorerOutput(ranked, { turnNumber: 5 });

		const result = selectTerritoryV2(input);

		expect(result.scorerOutput).toBe(input);
	});
});

// ─── Argmax (Turn 25, Finale) ───────────────────────────────────────

describe("selectTerritoryV2 — argmax (finale, turn 25)", () => {
	it("uses argmax same as steady-state on final turn", () => {
		const ranked = [makeRankedTerritory("territory-a", 3.0), makeRankedTerritory("territory-b", 2.0)];
		const input = makeScorerOutput(ranked, { turnNumber: 25, totalTurns: 25 });

		const result = selectTerritoryV2(input);

		expect(result.selectedTerritory).toBe("territory-a");
		expect(result.selectionRule).toBe("argmax");
		expect(result.selectionSeed).toBeUndefined();
	});
});

// ─── Edge Cases ─────────────────────────────────────────────────────

describe("selectTerritoryV2 — edge cases", () => {
	it("handles single territory in ranked list", () => {
		const ranked = [makeRankedTerritory("only-territory", 1.0)];
		const input = makeScorerOutput(ranked, { turnNumber: 10 });

		const result = selectTerritoryV2(input);

		expect(result.selectedTerritory).toBe("only-territory");
		expect(result.selectionRule).toBe("argmax");
	});

	it("handles single territory on cold start", () => {
		const ranked = [makeRankedTerritory("only-territory", 1.0)];
		const input = makeScorerOutput(ranked, { turnNumber: 1 });

		const result = selectTerritoryV2(input, 99);

		expect(result.selectedTerritory).toBe("only-territory");
		expect(result.selectionRule).toBe("cold-start-perimeter");
		expect(result.selectionSeed).toBe(99);
	});
});

// ─── Derived Annotations ────────────────────────────────────────────

describe("deriveSessionPhase", () => {
	it("returns 'opening' for turn 1", () => {
		expect(deriveSessionPhase(1, 25)).toBe("opening");
	});

	it("returns 'closing' for the final turn", () => {
		expect(deriveSessionPhase(25, 25)).toBe("closing");
	});

	it("returns 'exploring' for mid-session turns", () => {
		expect(deriveSessionPhase(2, 25)).toBe("exploring");
		expect(deriveSessionPhase(12, 25)).toBe("exploring");
		expect(deriveSessionPhase(24, 25)).toBe("exploring");
	});
});

describe("deriveTransitionType", () => {
	it("returns 'continue' when selected territory matches current", () => {
		expect(deriveTransitionType(tid("same"), tid("same"))).toBe("continue");
	});

	it("returns 'transition' when selected territory differs from current", () => {
		expect(deriveTransitionType(tid("new-one"), tid("old-one"))).toBe("transition");
	});
});
