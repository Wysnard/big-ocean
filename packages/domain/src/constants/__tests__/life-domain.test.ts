import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import { LIFE_DOMAINS, LifeDomainSchema, STEERABLE_DOMAINS } from "../life-domain";

describe("LIFE_DOMAINS", () => {
	it("includes health as a valid domain", () => {
		expect(LIFE_DOMAINS).toContain("health");
	});

	it("does not include solo (removed in Story 40-3)", () => {
		expect(LIFE_DOMAINS).not.toContain("solo");
	});

	it("contains exactly 6 domains", () => {
		expect(LIFE_DOMAINS).toHaveLength(6);
		expect([...LIFE_DOMAINS]).toEqual(
			expect.arrayContaining(["work", "relationships", "family", "leisure", "health", "other"]),
		);
	});
});

describe("LifeDomainSchema", () => {
	it("accepts health as a valid domain", () => {
		const decode = S.decodeUnknownSync(LifeDomainSchema);
		expect(decode("health")).toBe("health");
	});

	it("rejects solo (removed in Story 40-3)", () => {
		const decode = S.decodeUnknownSync(LifeDomainSchema);
		expect(() => decode("solo")).toThrow();
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

	it("does not include solo", () => {
		expect(STEERABLE_DOMAINS).not.toContain("solo");
	});

	it("includes work, relationships, family, leisure, health", () => {
		expect([...STEERABLE_DOMAINS]).toEqual(
			expect.arrayContaining(["work", "relationships", "family", "leisure", "health"]),
		);
		expect(STEERABLE_DOMAINS).toHaveLength(5);
	});
});
