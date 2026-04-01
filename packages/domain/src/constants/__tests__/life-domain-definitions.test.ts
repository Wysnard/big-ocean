/**
 * Life Domain Definitions Tests (Story 40-2)
 *
 * Verifies that LIFE_DOMAIN_DEFINITIONS contains the correct 6 active domains
 * with accurate descriptions matching the scoring-confidence-v2-spec.
 */

import { describe, expect, it } from "vitest";
import { LIFE_DOMAIN_DEFINITIONS } from "../life-domain";

describe("LIFE_DOMAIN_DEFINITIONS (Story 40-2)", () => {
	it("has entries for exactly 6 active domains", () => {
		const keys = Object.keys(LIFE_DOMAIN_DEFINITIONS);
		expect(keys).toHaveLength(6);
		expect(keys).toEqual(
			expect.arrayContaining(["work", "relationships", "family", "leisure", "health", "other"]),
		);
	});

	it("does NOT have a 'solo' entry", () => {
		expect(LIFE_DOMAIN_DEFINITIONS).not.toHaveProperty("solo");
	});

	it("leisure definition includes introspection and daydreaming", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.leisure).toContain("introspection");
		expect(LIFE_DOMAIN_DEFINITIONS.leisure).toContain("daydreaming");
	});

	it("leisure definition includes alone-time hobbies", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.leisure).toContain("alone-time hobbies");
	});

	it("health definition includes Exercise and stress management", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.health).toContain("Exercise");
		expect(LIFE_DOMAIN_DEFINITIONS.health).toContain("stress management");
	});

	it("health definition includes self-care routines and sleep", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.health).toContain("self-care routines");
		expect(LIFE_DOMAIN_DEFINITIONS.health).toContain("sleep");
	});

	it("work definition includes education and studying", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.work).toContain("education");
		expect(LIFE_DOMAIN_DEFINITIONS.work).toContain("studying");
	});

	it("other definition includes Target <5%", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.other).toContain("Target <5%");
	});

	it("other definition includes guidance about last resort", () => {
		expect(LIFE_DOMAIN_DEFINITIONS.other).toContain("ONLY when truly doesn't fit above");
	});
});
