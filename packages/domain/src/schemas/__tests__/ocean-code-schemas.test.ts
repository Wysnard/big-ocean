import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";
import { OceanCode4Schema, OceanCode5Schema } from "../ocean-code";
import { FacetResultSchema, TraitResultSchema } from "../result-schemas";

describe("OceanCode4Schema", () => {
	const decode = S.decodeUnknownSync(OceanCode4Schema);

	it("accepts valid 4-letter codes", () => {
		expect(() => decode("OCBD")).not.toThrow(); // O, C, B, D positions
		expect(() => decode("TFIA")).not.toThrow();
		expect(() => decode("MSEP")).not.toThrow();
	});

	it("rejects wrong length", () => {
		expect(() => decode("OCB")).toThrow();
		expect(() => decode("OCBDR")).toThrow();
	});

	it("rejects lowercase", () => {
		expect(() => decode("ocbd")).toThrow();
	});

	it("rejects invalid letters per position", () => {
		expect(() => decode("XCBD")).toThrow(); // X not in [TMO]
		expect(() => decode("OXBD")).toThrow(); // X not in [FSC]
		expect(() => decode("OCXD")).toThrow(); // X not in [IBE]
		expect(() => decode("OCBX")).toThrow(); // X not in [DPA]
	});
});

describe("OceanCode5Schema", () => {
	const decode = S.decodeUnknownSync(OceanCode5Schema);

	it("accepts valid 5-letter codes", () => {
		expect(() => decode("OCBDR")).not.toThrow();
		expect(() => decode("TFIAV")).not.toThrow();
		expect(() => decode("MSEPN")).not.toThrow();
	});

	it("rejects wrong length", () => {
		expect(() => decode("OCBD")).toThrow();
		expect(() => decode("OCBDRS")).toThrow();
	});

	it("rejects invalid 5th position letter", () => {
		expect(() => decode("OCBDX")).toThrow(); // X not in [RVN]
	});
});

describe("FacetResultSchema", () => {
	const decode = S.decodeUnknownSync(FacetResultSchema);

	const validFacet = {
		name: "imagination",
		traitName: "openness",
		score: 15.5,
		confidence: 0.8,
		level: "OV",
		levelLabel: "Visionary",
		levelDescription: "High imagination",
	};

	it("accepts valid facet result", () => {
		expect(() => decode(validFacet)).not.toThrow();
	});

	it("rejects missing fields", () => {
		const { score: _, ...missing } = validFacet;
		expect(() => decode(missing)).toThrow();
	});

	it("rejects invalid facet name", () => {
		expect(() => decode({ ...validFacet, name: "not-a-facet" })).toThrow();
	});

	it("rejects invalid trait name", () => {
		expect(() => decode({ ...validFacet, traitName: "not-a-trait" })).toThrow();
	});
});

describe("TraitResultSchema", () => {
	const decode = S.decodeUnknownSync(TraitResultSchema);

	const validTrait = {
		name: "openness",
		score: 75.0,
		level: "H",
		confidence: 0.9,
	};

	it("accepts valid trait result", () => {
		expect(() => decode(validTrait)).not.toThrow();
	});

	it("rejects missing fields", () => {
		const { confidence: _, ...missing } = validTrait;
		expect(() => decode(missing)).toThrow();
	});

	it("rejects invalid trait name", () => {
		expect(() => decode({ ...validTrait, name: "not-a-trait" })).toThrow();
	});
});
