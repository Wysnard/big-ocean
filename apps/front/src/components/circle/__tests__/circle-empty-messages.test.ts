import { describe, expect, it } from "vitest";
import { CIRCLE_PAGE_EMPTY_STATE } from "../circle-empty-messages";

describe("CIRCLE_PAGE_EMPTY_STATE", () => {
	it("matches Story 6.1 intimacy copy (two sentences)", () => {
		expect(CIRCLE_PAGE_EMPTY_STATE).toBe(
			"Big Ocean is made for the few people you care about. This is where they'll live.",
		);
	});
});
