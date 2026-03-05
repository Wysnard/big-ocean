import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { SteeringOutput } from "../steering";
import { TerritoryIdSchema } from "../territory";

describe("SteeringOutput", () => {
	it("contains only territoryId field", () => {
		const output: SteeringOutput = {
			territoryId: Schema.decodeSync(TerritoryIdSchema)("creative-pursuits"),
		};
		expect(output.territoryId).toBe("creative-pursuits");
		expect(Object.keys(output)).toEqual(["territoryId"]);
	});
});
