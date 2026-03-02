import { describe, expect, it } from "vitest";
import { computeDomainStreak } from "../compute-domain-streak";
import type { LifeDomain } from "../../../constants/life-domain";

const msg = (targetDomain: LifeDomain | null) => ({ targetDomain });

describe("computeDomainStreak", () => {
	it("returns 0 for empty array", () => {
		expect(computeDomainStreak([])).toBe(0);
	});

	it("returns 1 for single message with domain", () => {
		expect(computeDomainStreak([msg("work")])).toBe(1);
	});

	it("returns correct count for consecutive same-domain messages", () => {
		expect(computeDomainStreak([msg("work"), msg("work"), msg("work")])).toBe(3);
	});

	it("counts only from the most recent domain", () => {
		expect(computeDomainStreak([msg("work"), msg("work"), msg("relationships")])).toBe(1);
	});

	it("returns 0 when last message has null targetDomain", () => {
		expect(computeDomainStreak([msg("work"), msg(null)])).toBe(0);
	});

	it("breaks streak on null in the middle", () => {
		expect(computeDomainStreak([msg("work"), msg(null), msg("work")])).toBe(1);
	});

	it("handles long streak correctly", () => {
		expect(
			computeDomainStreak([
				msg("relationships"),
				msg("work"),
				msg("leisure"),
				msg("leisure"),
				msg("leisure"),
				msg("leisure"),
			]),
		).toBe(4);
	});
});
