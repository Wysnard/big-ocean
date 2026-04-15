import { describe, expect, it } from "vitest";
import { getCurrentYearMonth, shiftYearMonth } from "./use-calendar-month";

describe("use-calendar-month helpers", () => {
	it("shifts months using local calendar math consistent with getCurrentYearMonth", () => {
		const april = getCurrentYearMonth(new Date(2026, 3, 15));
		expect(april).toBe("2026-04");
		expect(shiftYearMonth(april, -1)).toBe("2026-03");
		expect(shiftYearMonth(april, 1)).toBe("2026-05");
	});

	it("rolls year boundaries in local time", () => {
		expect(shiftYearMonth("2026-01", -1)).toBe("2025-12");
		expect(shiftYearMonth("2025-12", 1)).toBe("2026-01");
	});
});
