/**
 * Move Governor Tests — Story 26-3
 *
 * Tests for the Move Governor: intent derivation, entry pressure computation,
 * and orchestration of observation gating into PromptBuilderInput.
 */
import { describe, expect, it } from "vitest";

import type { LifeDomain } from "../../../constants/life-domain";
import type { ContradictionTarget } from "../../../types/pacing";
import type { TerritoryId } from "../../../types/territory";
import {
	computeEntryPressure,
	computeGovernorOutput,
	deriveIntent,
	ENTRY_PRESSURE_LARGE_GAP,
	ENTRY_PRESSURE_MODERATE_GAP,
	type MoveGovernorInput,
} from "../move-governor";

// ─── Helpers ────────────────────────────────────────────────────────

const tid = (s: string) => s as TerritoryId;

/** Build a minimal MoveGovernorInput with sensible defaults */
function buildInput(overrides: Partial<MoveGovernorInput> = {}): MoveGovernorInput {
	return {
		selectedTerritory: tid("creative-pursuits"),
		eTarget: 0.5,
		turnNumber: 5,
		isFinalTurn: false,
		expectedEnergy: 0.45,
		previousTerritory: tid("daily-rituals"),
		// Observation gating inputs
		phase: 0.5,
		sharedFireCount: 0,
		relateStrength: 0.2,
		noticingStrength: 0.0,
		contradictionStrength: 0.0,
		convergenceStrength: 0.0,
		...overrides,
	};
}

// ─── Constants ──────────────────────────────────────────────────────

describe("Entry pressure constants", () => {
	it("ENTRY_PRESSURE_MODERATE_GAP should be 0.15", () => {
		expect(ENTRY_PRESSURE_MODERATE_GAP).toBe(0.15);
	});

	it("ENTRY_PRESSURE_LARGE_GAP should be 0.30", () => {
		expect(ENTRY_PRESSURE_LARGE_GAP).toBe(0.3);
	});
});

// ─── deriveIntent ───────────────────────────────────────────────────

describe("deriveIntent", () => {
	it("returns 'open' for turn 1", () => {
		expect(deriveIntent(1, false, tid("a"), null)).toBe("open");
	});

	it("returns 'open' for turn 1 even if isFinalTurn", () => {
		// Edge case: single-turn session. Open takes priority.
		expect(deriveIntent(1, true, tid("a"), null)).toBe("open");
	});

	it("returns 'open' for turn 1 even if territory changed", () => {
		// Open takes priority over bridge
		expect(deriveIntent(1, false, tid("a"), tid("b"))).toBe("open");
	});

	it("returns 'close' for final turn (not turn 1)", () => {
		expect(deriveIntent(25, true, tid("a"), null)).toBe("close");
	});

	it("returns 'close' for final turn even if territory changed", () => {
		// Close takes priority over bridge
		expect(deriveIntent(25, true, tid("a"), tid("b"))).toBe("close");
	});

	it("returns 'explore' for mid-conversation turns with same territory", () => {
		expect(deriveIntent(5, false, tid("a"), tid("a"))).toBe("explore");
		expect(deriveIntent(12, false, tid("a"), tid("a"))).toBe("explore");
	});

	it("returns 'explore' when previousTerritory is null (no prior exchange)", () => {
		expect(deriveIntent(5, false, tid("a"), null)).toBe("explore");
	});

	it("returns 'bridge' when territory changed, not turn 1, not final turn", () => {
		expect(deriveIntent(5, false, tid("creative-pursuits"), tid("daily-rituals"))).toBe("bridge");
	});

	it("returns 'bridge' on turn 2 when territory changed", () => {
		expect(deriveIntent(2, false, tid("new-territory"), tid("old-territory"))).toBe("bridge");
	});
});

// ─── computeEntryPressure ───────────────────────────────────────────

describe("computeEntryPressure", () => {
	it("returns 'direct' when gap is small (<= 0.15)", () => {
		const result = computeEntryPressure(0.5, 0.6);
		expect(result.level).toBe("direct");
		expect(result.gap).toBeCloseTo(0.1, 5);
	});

	it("returns 'direct' when territory energy is below E_target", () => {
		// Negative gap (territory is easier than target) -> direct
		const result = computeEntryPressure(0.6, 0.3);
		expect(result.level).toBe("direct");
		expect(result.gap).toBe(0); // clamped to 0
	});

	it("returns 'angled' when gap is moderate (> 0.15, <= 0.30)", () => {
		const result = computeEntryPressure(0.4, 0.6);
		expect(result.level).toBe("angled");
		expect(result.gap).toBeCloseTo(0.2, 5);
	});

	it("returns 'soft' when gap is large (> 0.30)", () => {
		const result = computeEntryPressure(0.3, 0.7);
		expect(result.level).toBe("soft");
		expect(result.gap).toBeCloseTo(0.4, 5);
	});

	it("returns 'direct' when E_target is null", () => {
		const result = computeEntryPressure(null, 0.7);
		expect(result.level).toBe("direct");
		expect(result.eTarget).toBe(0);
		expect(result.gap).toBe(0);
	});

	it("returns correct debug info", () => {
		const result = computeEntryPressure(0.4, 0.6);
		expect(result).toEqual({
			level: "angled",
			eTarget: 0.4,
			expectedEnergy: 0.6,
			gap: expect.closeTo(0.2, 5),
		});
	});

	it("returns 'direct' at exact boundary (gap = 0.15)", () => {
		const result = computeEntryPressure(0.45, 0.6);
		expect(result.level).toBe("direct");
	});

	it("returns 'angled' at exact boundary (gap = 0.30)", () => {
		const result = computeEntryPressure(0.3, 0.6);
		expect(result.level).toBe("angled");
	});
});

// ─── computeGovernorOutput ──────────────────────────────────────────

describe("computeGovernorOutput", () => {
	describe("open intent (turn 1)", () => {
		it("returns OpenPromptInput with territory only", () => {
			const input = buildInput({ turnNumber: 1, isFinalTurn: false });
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("open");
			expect(output.territory).toBe(tid("creative-pursuits"));
			// Open has no entryPressure or observationFocus
			expect("entryPressure" in output).toBe(false);
			expect("observationFocus" in output).toBe(false);
		});

		it("debug shows intent=open and isFinalTurn=false", () => {
			const input = buildInput({ turnNumber: 1, isFinalTurn: false });
			const { debug } = computeGovernorOutput(input);

			expect(debug.intent).toBe("open");
			expect(debug.isFinalTurn).toBe(false);
		});
	});

	describe("explore intent (mid-conversation, same territory)", () => {
		it("returns ExplorePromptInput with entry pressure and observation focus", () => {
			const input = buildInput({
				turnNumber: 12,
				isFinalTurn: false,
				// Same territory as previous — triggers explore, not bridge
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("creative-pursuits"),
				eTarget: 0.5,
				expectedEnergy: 0.45,
				relateStrength: 0.3,
				noticingStrength: 0.0,
				contradictionStrength: 0.0,
				convergenceStrength: 0.0,
				phase: 0.5,
				sharedFireCount: 0,
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("explore");
			if (output.intent === "explore") {
				expect(output.entryPressure).toBeDefined();
				expect(output.observationFocus).toBeDefined();
				// Small gap -> direct entry
				expect(output.entryPressure).toBe("direct");
				// No strong non-Relate signals -> Relate wins
				expect(output.observationFocus.type).toBe("relate");
			}
		});

		it("computes entry pressure from E_target - expectedEnergy gap", () => {
			const input = buildInput({
				turnNumber: 12,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("creative-pursuits"),
				eTarget: 0.3,
				expectedEnergy: 0.7,
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("explore");
			if (output.intent === "explore") {
				expect(output.entryPressure).toBe("soft");
			}
			expect(debug.entryPressure.level).toBe("soft");
			expect(debug.entryPressure.gap).toBeCloseTo(0.4, 5);
		});

		it("wires observation gating in explore mode with correct inputs", () => {
			const contradictionTarget: ContradictionTarget = {
				facet: "Assertiveness" as any,
				pair: [
					{ domain: "work" as LifeDomain, score: 0.8, confidence: 0.7 },
					{ domain: "relationships" as LifeDomain, score: 0.3, confidence: 0.6 },
				],
				strength: 0.3,
			};

			const input = buildInput({
				turnNumber: 12,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("creative-pursuits"),
				phase: 0.8,
				sharedFireCount: 0,
				relateStrength: 0.1,
				contradictionStrength: 0.5,
				noticingStrength: 0.0,
				convergenceStrength: 0.0,
				contradictionTarget,
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("explore");
			if (output.intent === "explore") {
				// Contradiction has high effective strength (0.5 * 0.8 = 0.4) > threshold (0.12)
				expect(output.observationFocus.type).toBe("contradiction");
			}
			expect(debug.observationGating.mode).toBe("explore");
		});
	});

	describe("close intent (final turn)", () => {
		it("returns ClosePromptInput with direct entry pressure", () => {
			const input = buildInput({
				turnNumber: 25,
				isFinalTurn: true,
				eTarget: 0.3,
				expectedEnergy: 0.7,
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("close");
			if (output.intent === "close") {
				// Close always uses direct entry pressure
				expect(output.entryPressure).toBe("direct");
				expect(output.observationFocus).toBeDefined();
			}
		});

		it("wires observation gating in close mode", () => {
			const input = buildInput({
				turnNumber: 25,
				isFinalTurn: true,
				relateStrength: 0.1,
				contradictionStrength: 0.8,
				noticingStrength: 0.3,
				convergenceStrength: 0.2,
				contradictionTarget: {
					facet: "Assertiveness" as any,
					pair: [
						{ domain: "work" as LifeDomain, score: 0.8, confidence: 0.7 },
						{ domain: "relationships" as LifeDomain, score: 0.3, confidence: 0.6 },
					],
					strength: 0.8,
				},
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("close");
			if (output.intent === "close") {
				// In close mode, raw strength competition. Contradiction (0.8) wins.
				expect(output.observationFocus.type).toBe("contradiction");
			}
			expect(debug.observationGating.mode).toBe("close");
		});

		it("debug shows intent=close and isFinalTurn=true", () => {
			const input = buildInput({ turnNumber: 25, isFinalTurn: true });
			const { debug } = computeGovernorOutput(input);

			expect(debug.intent).toBe("close");
			expect(debug.isFinalTurn).toBe(true);
			expect(debug.entryPressure.level).toBe("direct");
		});
	});

	describe("MoveGovernorDebug completeness", () => {
		it("contains all required debug fields for explore", () => {
			const input = buildInput({
				turnNumber: 12,
				isFinalTurn: false,
				previousTerritory: tid("creative-pursuits"),
			});
			const { debug } = computeGovernorOutput(input);

			expect(debug).toHaveProperty("intent");
			expect(debug).toHaveProperty("isFinalTurn");
			expect(debug).toHaveProperty("entryPressure");
			expect(debug).toHaveProperty("observationGating");

			// Entry pressure debug
			expect(debug.entryPressure).toHaveProperty("level");
			expect(debug.entryPressure).toHaveProperty("eTarget");
			expect(debug.entryPressure).toHaveProperty("expectedEnergy");
			expect(debug.entryPressure).toHaveProperty("gap");

			// Observation gating debug
			expect(debug.observationGating).toHaveProperty("mode");
			expect(debug.observationGating).toHaveProperty("phase");
			expect(debug.observationGating).toHaveProperty("threshold");
			expect(debug.observationGating).toHaveProperty("sharedFireCount");
			expect(debug.observationGating).toHaveProperty("candidates");
			expect(debug.observationGating).toHaveProperty("winner");
			expect(debug.observationGating).toHaveProperty("mutualExclusionApplied");
		});

		it("contains all required debug fields for open (with default gating debug)", () => {
			const input = buildInput({ turnNumber: 1, isFinalTurn: false });
			const { debug } = computeGovernorOutput(input);

			expect(debug.intent).toBe("open");
			// Open still has debug fields, but they reflect skipped computation
			expect(debug.entryPressure).toBeDefined();
			expect(debug.observationGating).toBeDefined();
		});
	});

	describe("output uses TerritoryId (not full Territory)", () => {
		it("output.territory is a TerritoryId string, not a Territory object", () => {
			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				previousTerritory: tid("creative-pursuits"),
			});
			const { output } = computeGovernorOutput(input);

			expect(typeof output.territory).toBe("string");
		});
	});

	describe("bridge intent (territory change)", () => {
		it("returns BridgePromptInput when territory changed", () => {
			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("daily-rituals"),
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("bridge");
			if (output.intent === "bridge") {
				expect(output.territory).toBe(tid("creative-pursuits"));
				expect(output.previousTerritory).toBe(tid("daily-rituals"));
				expect(output.entryPressure).toBeDefined();
				expect(output.observationFocus).toBeDefined();
			}
		});

		it("returns ExplorePromptInput when territory is unchanged", () => {
			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				selectedTerritory: tid("daily-rituals"),
				previousTerritory: tid("daily-rituals"),
			});
			const { output } = computeGovernorOutput(input);

			expect(output.intent).toBe("explore");
		});

		it("returns ExplorePromptInput when previousTerritory is null", () => {
			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				previousTerritory: null,
			});
			const { output } = computeGovernorOutput(input);

			expect(output.intent).toBe("explore");
		});

		it("bridge intent computes entry pressure same as explore", () => {
			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("daily-rituals"),
				eTarget: 0.3,
				expectedEnergy: 0.7,
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("bridge");
			if (output.intent === "bridge") {
				expect(output.entryPressure).toBe("soft");
			}
			expect(debug.entryPressure.level).toBe("soft");
			expect(debug.entryPressure.gap).toBeCloseTo(0.4, 5);
		});

		it("bridge intent runs observation gating in explore mode", () => {
			const contradictionTarget: ContradictionTarget = {
				facet: "Assertiveness" as any,
				pair: [
					{ domain: "work" as LifeDomain, score: 0.8, confidence: 0.7 },
					{ domain: "relationships" as LifeDomain, score: 0.3, confidence: 0.6 },
				],
				strength: 0.3,
			};

			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("daily-rituals"),
				phase: 0.8,
				sharedFireCount: 0,
				relateStrength: 0.1,
				contradictionStrength: 0.5,
				noticingStrength: 0.0,
				convergenceStrength: 0.0,
				contradictionTarget,
			});
			const { output, debug } = computeGovernorOutput(input);

			expect(output.intent).toBe("bridge");
			if (output.intent === "bridge") {
				expect(output.observationFocus.type).toBe("contradiction");
			}
			expect(debug.observationGating.mode).toBe("explore");
		});

		it("debug shows intent=bridge on territory change", () => {
			const input = buildInput({
				turnNumber: 5,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("daily-rituals"),
			});
			const { debug } = computeGovernorOutput(input);

			expect(debug.intent).toBe("bridge");
			expect(debug.isFinalTurn).toBe(false);
		});

		it("open still takes priority over bridge on turn 1", () => {
			const input = buildInput({
				turnNumber: 1,
				isFinalTurn: false,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("daily-rituals"),
			});
			const { output } = computeGovernorOutput(input);

			expect(output.intent).toBe("open");
		});

		it("close still takes priority over bridge on final turn", () => {
			const input = buildInput({
				turnNumber: 25,
				isFinalTurn: true,
				selectedTerritory: tid("creative-pursuits"),
				previousTerritory: tid("daily-rituals"),
			});
			const { output } = computeGovernorOutput(input);

			expect(output.intent).toBe("close");
		});
	});

	describe("Governor does not read portrait readiness", () => {
		it("MoveGovernorInput has no portraitReadiness field", () => {
			const input = buildInput();
			expect("portraitReadiness" in input).toBe(false);
		});
	});
});
