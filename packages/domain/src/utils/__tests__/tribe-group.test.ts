import { describe, expect, it } from "vitest";
import { getTribeGroup } from "../tribe-group";

describe("getTribeGroup", () => {
	it("returns O-Group for Open-minded Openness level (O)", () => {
		const result = getTribeGroup("O");
		expect(result).toEqual({
			code: "O-Group",
			label: "Open-Minded",
			fullLabel: "O-Group: Open-Minded",
		});
	});

	it("returns G-Group for Moderate Openness level (M)", () => {
		const result = getTribeGroup("M");
		expect(result).toEqual({
			code: "G-Group",
			label: "Grounded",
			fullLabel: "G-Group: Grounded",
		});
	});

	it("returns P-Group for Traditional Openness level (T)", () => {
		const result = getTribeGroup("T");
		expect(result).toEqual({
			code: "P-Group",
			label: "Practical",
			fullLabel: "P-Group: Practical",
		});
	});

	it("derives tribe group from first letter of a 5-letter OCEAN code", () => {
		expect(getTribeGroup("O").code).toBe("O-Group");
		expect(getTribeGroup("M").code).toBe("G-Group");
		expect(getTribeGroup("T").code).toBe("P-Group");
	});

	it("throws for invalid openness letter", () => {
		expect(() => getTribeGroup("X")).toThrow("Invalid Openness level letter");
	});
});
