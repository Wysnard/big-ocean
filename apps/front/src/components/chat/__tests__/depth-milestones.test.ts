import { describe, expect, it } from "vitest";
import {
	ASSESSMENT_MILESTONES,
	DEFAULT_MILESTONES,
	getMilestoneLabel,
	getMilestonePositionPercent,
	getMilestoneTurn,
	isMilestoneReached,
} from "../depth-milestones";

describe("depth-milestones", () => {
	describe("DEFAULT_MILESTONES", () => {
		it("exports [0.25, 0.5, 0.75]", () => {
			expect(DEFAULT_MILESTONES).toEqual([0.25, 0.5, 0.75]);
		});
	});

	describe("ASSESSMENT_MILESTONES", () => {
		it("defines the shared 15-turn milestone contract once", () => {
			expect(
				ASSESSMENT_MILESTONES.map((milestone) => ({
					label: milestone.label,
					turnAt15: milestone.turnAt15,
				})),
			).toEqual([
				{ label: 25, turnAt15: 4 },
				{ label: 50, turnAt15: 8 },
				{ label: 75, turnAt15: 11 },
			]);
		});
	});

	describe("getMilestoneLabel", () => {
		it("converts decimal to integer percentage", () => {
			expect(getMilestoneLabel(0.25)).toBe(25);
			expect(getMilestoneLabel(0.5)).toBe(50);
			expect(getMilestoneLabel(0.75)).toBe(75);
		});
	});

	describe("getMilestoneTurn", () => {
		it("returns hardcoded turns for 15-turn assessment", () => {
			expect(getMilestoneTurn(15, 0.25)).toBe(4);
			expect(getMilestoneTurn(15, 0.5)).toBe(8);
			expect(getMilestoneTurn(15, 0.75)).toBe(11);
		});

		it("returns null for totalTurns <= 0", () => {
			expect(getMilestoneTurn(0, 0.25)).toBeNull();
			expect(getMilestoneTurn(-1, 0.5)).toBeNull();
		});

		it("returns null for unknown milestone label at totalTurns=15", () => {
			expect(getMilestoneTurn(15, 0.33)).toBeNull();
		});

		it("uses Math.ceil fallback for non-15 totals", () => {
			expect(getMilestoneTurn(20, 0.25)).toBe(5);
			expect(getMilestoneTurn(20, 0.5)).toBe(10);
			expect(getMilestoneTurn(20, 0.75)).toBe(15);
		});

		it("rounds up fractional turn boundaries", () => {
			// 14 * 0.25 = 3.5 → ceil = 4
			expect(getMilestoneTurn(14, 0.25)).toBe(4);
			// 14 * 0.75 = 10.5 → ceil = 11
			expect(getMilestoneTurn(14, 0.75)).toBe(11);
		});
	});

	describe("getMilestonePositionPercent", () => {
		it("positions ticks based on turn/totalTurns for 15-turn assessment", () => {
			// turn 4 / 15 = 26.67%
			expect(getMilestonePositionPercent(15, 0.25)).toBeCloseTo(26.67, 1);
			// turn 8 / 15 = 53.33%
			expect(getMilestonePositionPercent(15, 0.5)).toBeCloseTo(53.33, 1);
			// turn 11 / 15 = 73.33%
			expect(getMilestonePositionPercent(15, 0.75)).toBeCloseTo(73.33, 1);
		});

		it("falls back to label percentage when totalTurns <= 0", () => {
			expect(getMilestonePositionPercent(0, 0.25)).toBe(25);
			expect(getMilestonePositionPercent(0, 0.75)).toBe(75);
		});

		it("positions ticks for non-15 totals using ceil-based turn", () => {
			// 20 * 0.25 = 5, position = 5/20 * 100 = 25%
			expect(getMilestonePositionPercent(20, 0.25)).toBe(25);
		});
	});

	describe("isMilestoneReached", () => {
		it("uses hardcoded thresholds for 15-turn assessment", () => {
			expect(isMilestoneReached(3, 15, 0.25)).toBe(false);
			expect(isMilestoneReached(4, 15, 0.25)).toBe(true);
			expect(isMilestoneReached(7, 15, 0.5)).toBe(false);
			expect(isMilestoneReached(8, 15, 0.5)).toBe(true);
			expect(isMilestoneReached(10, 15, 0.75)).toBe(false);
			expect(isMilestoneReached(11, 15, 0.75)).toBe(true);
		});

		it("returns false when totalTurns <= 0", () => {
			expect(isMilestoneReached(5, 0, 0.25)).toBe(false);
		});

		it("uses ratio comparison for non-15 totals", () => {
			// 5/20 = 0.25 → reached
			expect(isMilestoneReached(5, 20, 0.25)).toBe(true);
			expect(isMilestoneReached(4, 20, 0.25)).toBe(false);
		});
	});
});
