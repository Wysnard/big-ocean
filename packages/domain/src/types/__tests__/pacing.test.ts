import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import type {
	BridgePromptInput,
	ContradictionTarget,
	ConvergenceTarget,
	DomainScore,
	EntryPressureDebug,
	MoveGovernorDebug,
	ObservationCandidate,
	ObservationFocus,
	ObservationGatingDebug,
	PromptBuilderInput,
	RankedTerritory,
	RelateFocus,
	TerritoryScoreBreakdown,
	TerritoryScorerOutput,
	TerritorySelectorOutput,
} from "../pacing";

import {
	CONVERSATIONAL_INTENTS,
	type ConversationalIntent,
	ENERGY_BANDS,
	ENTRY_PRESSURES,
	type EnergyBand,
	type EntryPressure,
	TELLING_BANDS,
	type TellingBand,
} from "../pacing";
import { TerritoryIdSchema } from "../territory";

describe("Pacing Pipeline Domain Types", () => {
	// ---------- Task 1: Literal union types ----------

	describe("EnergyBand", () => {
		it("has exactly 5 bands", () => {
			expect(ENERGY_BANDS).toHaveLength(5);
			expect(ENERGY_BANDS).toEqual(["minimal", "low", "steady", "high", "very_high"]);
		});

		it("type-checks all valid values", () => {
			const values: EnergyBand[] = ["minimal", "low", "steady", "high", "very_high"];
			expect(values).toHaveLength(5);
		});
	});

	describe("TellingBand", () => {
		it("has exactly 5 bands", () => {
			expect(TELLING_BANDS).toHaveLength(5);
			expect(TELLING_BANDS).toEqual([
				"fully_compliant",
				"mostly_compliant",
				"mixed",
				"mostly_self_propelled",
				"strongly_self_propelled",
			]);
		});

		it("type-checks all valid values", () => {
			const values: TellingBand[] = [
				"fully_compliant",
				"mostly_compliant",
				"mixed",
				"mostly_self_propelled",
				"strongly_self_propelled",
			];
			expect(values).toHaveLength(5);
		});
	});

	describe("EntryPressure", () => {
		it("has exactly 3 levels", () => {
			expect(ENTRY_PRESSURES).toHaveLength(3);
			expect(ENTRY_PRESSURES).toEqual(["direct", "angled", "soft"]);
		});

		it("type-checks all valid values", () => {
			const values: EntryPressure[] = ["direct", "angled", "soft"];
			expect(values).toHaveLength(3);
		});
	});

	describe("ConversationalIntent", () => {
		it("has exactly 4 intents", () => {
			expect(CONVERSATIONAL_INTENTS).toHaveLength(4);
			expect(CONVERSATIONAL_INTENTS).toEqual(["open", "explore", "bridge", "amplify"]);
		});

		it("type-checks all valid values", () => {
			const values: ConversationalIntent[] = ["open", "explore", "bridge", "amplify"];
			expect(values).toHaveLength(4);
		});
	});

	// ---------- Task 2: DomainScore and target types ----------

	describe("DomainScore", () => {
		it("constructs with correct shape", () => {
			const ds: DomainScore = {
				domain: "work" as LifeDomain,
				score: 0.75,
				confidence: 0.9,
			};
			expect(ds.domain).toBe("work");
			expect(ds.score).toBe(0.75);
			expect(ds.confidence).toBe(0.9);
		});
	});

	describe("ContradictionTarget", () => {
		it("constructs with facet, pair of 2 DomainScores, and strength", () => {
			const ds1: DomainScore = {
				domain: "work" as LifeDomain,
				score: 0.8,
				confidence: 0.9,
			};
			const ds2: DomainScore = {
				domain: "relationships" as LifeDomain,
				score: 0.2,
				confidence: 0.85,
			};
			const target: ContradictionTarget = {
				facet: "imagination" as FacetName,
				pair: [ds1, ds2],
				strength: 0.6,
			};
			expect(target.pair).toHaveLength(2);
			expect(target.strength).toBe(0.6);
		});
	});

	describe("ConvergenceTarget", () => {
		it("constructs with facet, 3+ DomainScores, and strength", () => {
			const domains: DomainScore[] = [
				{ domain: "work" as LifeDomain, score: 0.7, confidence: 0.9 },
				{
					domain: "relationships" as LifeDomain,
					score: 0.72,
					confidence: 0.85,
				},
				{ domain: "family" as LifeDomain, score: 0.68, confidence: 0.8 },
			];
			const target: ConvergenceTarget = {
				facet: "trust" as FacetName,
				domains,
				strength: 0.75,
			};
			expect(target.domains).toHaveLength(3);
			expect(target.strength).toBe(0.75);
		});
	});

	// ---------- Task 3: ObservationFocus discriminated union ----------

	describe("ObservationFocus", () => {
		it("narrows RelateFocus on type discriminant", () => {
			const focus: ObservationFocus = { type: "relate" };
			if (focus.type === "relate") {
				// TypeScript narrows to RelateFocus
				const _narrowed: RelateFocus = focus;
				expect(_narrowed.type).toBe("relate");
			}
		});

		it("narrows NoticingFocus with domain field", () => {
			const focus: ObservationFocus = {
				type: "noticing",
				domain: "work" as LifeDomain,
			};
			if (focus.type === "noticing") {
				// TypeScript narrows to NoticingFocus — domain is accessible
				expect(focus.domain).toBe("work");
			}
		});

		it("narrows ContradictionFocus with target field", () => {
			const target: ContradictionTarget = {
				facet: "imagination" as FacetName,
				pair: [
					{ domain: "work" as LifeDomain, score: 0.8, confidence: 0.9 },
					{
						domain: "relationships" as LifeDomain,
						score: 0.2,
						confidence: 0.85,
					},
				],
				strength: 0.6,
			};
			const focus: ObservationFocus = { type: "contradiction", target };
			if (focus.type === "contradiction") {
				expect(focus.target.facet).toBe("imagination");
				expect(focus.target.pair).toHaveLength(2);
			}
		});

		it("narrows ConvergenceFocus with target field", () => {
			const target: ConvergenceTarget = {
				facet: "trust" as FacetName,
				domains: [
					{ domain: "work" as LifeDomain, score: 0.7, confidence: 0.9 },
					{
						domain: "relationships" as LifeDomain,
						score: 0.72,
						confidence: 0.85,
					},
					{ domain: "family" as LifeDomain, score: 0.68, confidence: 0.8 },
				],
				strength: 0.75,
			};
			const focus: ObservationFocus = { type: "convergence", target };
			if (focus.type === "convergence") {
				expect(focus.target.domains).toHaveLength(3);
			}
		});
	});

	// ---------- Task 4: PromptBuilderInput discriminated union ----------

	describe("PromptBuilderInput", () => {
		const territoryId = Schema.decodeSync(TerritoryIdSchema)("creative-pursuits");

		it("constructs OpenPromptInput with territory only", () => {
			const input: PromptBuilderInput = {
				intent: "open",
				territory: territoryId,
			};
			expect(input.intent).toBe("open");
			if (input.intent === "open") {
				expect(input.territory).toBe("creative-pursuits");
				// Compile-time check: OpenPromptInput should NOT have entryPressure
				expect(Object.keys(input)).toEqual(["intent", "territory"]);
			}
		});

		it("constructs ExplorePromptInput with territory, entryPressure, and observationFocus", () => {
			const input: PromptBuilderInput = {
				intent: "explore",
				territory: territoryId,
				entryPressure: "angled",
				observationFocus: { type: "relate" },
			};
			if (input.intent === "explore") {
				expect(input.entryPressure).toBe("angled");
				expect(input.observationFocus.type).toBe("relate");
			}
		});

		it("constructs BridgePromptInput with territory, previousTerritory, entryPressure, and observationFocus", () => {
			const input: PromptBuilderInput = {
				intent: "bridge",
				territory: territoryId,
				previousTerritory: Schema.decodeSync(TerritoryIdSchema)("daily-routines"),
				entryPressure: "angled",
				observationFocus: { type: "relate" },
			};
			if (input.intent === "bridge") {
				const _narrowed: BridgePromptInput = input;
				expect(_narrowed.previousTerritory).toBe("daily-routines");
				expect(_narrowed.entryPressure).toBe("angled");
				expect(_narrowed.observationFocus.type).toBe("relate");
			}
		});

		it("constructs AmplifyPromptInput with territory, direct pressure, and observationFocus", () => {
			const input: PromptBuilderInput = {
				intent: "amplify",
				territory: territoryId,
				entryPressure: "direct",
				observationFocus: { type: "relate" },
			};
			if (input.intent === "amplify") {
				// AmplifyPromptInput always has entryPressure: "direct"
				expect(input.entryPressure).toBe("direct");
			}
		});

		it("type-narrowing on intent discriminant works correctly", () => {
			const inputs: PromptBuilderInput[] = [
				{ intent: "open", territory: territoryId },
				{
					intent: "explore",
					territory: territoryId,
					entryPressure: "soft",
					observationFocus: { type: "relate" },
				},
				{
					intent: "bridge",
					territory: territoryId,
					previousTerritory: Schema.decodeSync(TerritoryIdSchema)("daily-routines"),
					entryPressure: "angled",
					observationFocus: { type: "relate" },
				},
				{
					intent: "amplify",
					territory: territoryId,
					entryPressure: "direct",
					observationFocus: {
						type: "noticing",
						domain: "work" as LifeDomain,
					},
				},
			];
			for (const input of inputs) {
				switch (input.intent) {
					case "open":
						expect(input.territory).toBeDefined();
						break;
					case "explore":
						expect(input.entryPressure).toBeDefined();
						expect(input.observationFocus).toBeDefined();
						break;
					case "bridge":
						expect(input.previousTerritory).toBeDefined();
						expect(input.entryPressure).toBeDefined();
						expect(input.observationFocus).toBeDefined();
						break;
					case "amplify":
						expect(input.entryPressure).toBe("direct");
						expect(input.observationFocus).toBeDefined();
						break;
				}
			}
		});
	});

	// ---------- Task 5: Debug and scorer output types ----------

	describe("Debug types", () => {
		it("constructs ObservationCandidate", () => {
			const candidate: ObservationCandidate = {
				focus: { type: "relate" },
				strength: 0.42,
			};
			expect(candidate.strength).toBe(0.42);
		});

		it("constructs EntryPressureDebug", () => {
			const debug: EntryPressureDebug = {
				level: "angled",
				eTarget: 0.6,
				expectedEnergy: 0.5,
				gap: 0.1,
			};
			expect(debug.level).toBe("angled");
			expect(debug.gap).toBe(0.1);
		});

		it("constructs ObservationGatingDebug", () => {
			const debug: ObservationGatingDebug = {
				mode: "explore",
				phase: 0.45,
				threshold: 0.2,
				sharedFireCount: 2,
				candidates: [{ focus: { type: "relate" }, strength: 0.5 }],
				winner: { type: "relate" },
				mutualExclusionApplied: false,
			};
			expect(debug.candidates).toHaveLength(1);
			expect(debug.winner?.type).toBe("relate");
		});

		it("constructs MoveGovernorDebug", () => {
			const debug: MoveGovernorDebug = {
				intent: "explore",
				isFinalTurn: false,
				entryPressure: {
					level: "soft",
					eTarget: 0.4,
					expectedEnergy: 0.6,
					gap: -0.2,
				},
				observationGating: {
					mode: "explore",
					phase: 0.3,
					threshold: 0.16,
					sharedFireCount: 1,
					candidates: [],
					winner: null,
					mutualExclusionApplied: false,
				},
			};
			expect(debug.intent).toBe("explore");
			expect(debug.isFinalTurn).toBe(false);
		});
	});

	describe("Scorer output types", () => {
		it("constructs TerritoryScoreBreakdown", () => {
			const breakdown: TerritoryScoreBreakdown = {
				coverageGain: 0.3,
				adjacency: 0.1,
				skew: 0.05,
				malus: -0.1,
				freshness: 0.02,
			};
			expect(breakdown.coverageGain).toBe(0.3);
		});

		it("constructs RankedTerritory", () => {
			const ranked: RankedTerritory = {
				territoryId: Schema.decodeSync(TerritoryIdSchema)("creative-pursuits"),
				score: 0.72,
				breakdown: {
					coverageGain: 0.3,
					adjacency: 0.1,
					skew: 0.05,
					malus: -0.1,
					freshness: 0.02,
				},
			};
			expect(ranked.score).toBe(0.72);
		});

		it("constructs TerritoryScorerOutput", () => {
			const output: TerritoryScorerOutput = {
				ranked: [
					{
						territoryId: Schema.decodeSync(TerritoryIdSchema)("creative-pursuits"),
						score: 0.72,
						breakdown: {
							coverageGain: 0.3,
							adjacency: 0.1,
							skew: 0.05,
							malus: -0.1,
							freshness: 0.02,
						},
					},
				],
				currentTerritory: Schema.decodeSync(TerritoryIdSchema)("daily-routines"),
				turnNumber: 5,
				totalTurns: 25,
			};
			expect(output.ranked).toHaveLength(1);
			expect(output.turnNumber).toBe(5);
		});

		it("constructs TerritorySelectorOutput", () => {
			const output: TerritorySelectorOutput = {
				selectedTerritory: Schema.decodeSync(TerritoryIdSchema)("creative-pursuits"),
				selectionRule: "argmax",
				selectionSeed: undefined,
				scorerOutput: {
					ranked: [],
					currentTerritory: Schema.decodeSync(TerritoryIdSchema)("daily-routines"),
					turnNumber: 3,
					totalTurns: 25,
				},
			};
			expect(output.selectionRule).toBe("argmax");
			expect(output.selectionSeed).toBeUndefined();
		});
	});
});
