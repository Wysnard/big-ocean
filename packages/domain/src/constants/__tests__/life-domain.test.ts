import { describe, expect, it } from "vitest";
import {
	LIFE_DOMAINS,
	STEERABLE_DOMAINS,
	LifeDomainSchema,
} from "../life-domain";
import * as S from "effect/Schema";

describe("LIFE_DOMAINS", () => {
	it("includes health as a valid domain", () => {
		expect(LIFE_DOMAINS).toContain("health");
	});

	it("contains exactly 7 domains (including solo for backward compat)", () => {
		expect(LIFE_DOMAINS).toHaveLength(7);
		expect([...LIFE_DOMAINS]).toEqual(
			expect.arrayContaining([
				"work",
				"relationships",
				"family",
				"leisure",
				"solo",
				"health",
				"other",
			]),
		);
	});
});

describe("LifeDomainSchema", () => {
	it("accepts health as a valid domain", () => {
		const decode = S.decodeUnknownSync(LifeDomainSchema);
		expect(decode("health")).toBe("health");
	});

	it("still accepts solo for backward compatibility", () => {
		const decode = S.decodeUnknownSync(LifeDomainSchema);
		expect(decode("solo")).toBe("solo");
	});

	it("rejects invalid domains", () => {
		const decode = S.decodeUnknownSync(LifeDomainSchema);
		expect(() => decode("invalid")).toThrow();
	});
});

describe("STEERABLE_DOMAINS", () => {
	it("includes health", () => {
		expect(STEERABLE_DOMAINS).toContain("health");
	});

	it("excludes other", () => {
		expect(STEERABLE_DOMAINS).not.toContain("other");
	});

	it("excludes solo (deprecated)", () => {
		expect(STEERABLE_DOMAINS).not.toContain("solo");
	});

	it("includes work, relationships, family, leisure, health", () => {
		expect([...STEERABLE_DOMAINS]).toEqual(
			expect.arrayContaining([
				"work",
				"relationships",
				"family",
				"leisure",
				"health",
			]),
		);
		expect(STEERABLE_DOMAINS).toHaveLength(5);
	});
});
