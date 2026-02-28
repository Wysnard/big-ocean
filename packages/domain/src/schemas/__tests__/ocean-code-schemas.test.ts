import { Schema as S } from "effect";
import { describe, expect, it } from "vitest";
import { OceanCode4Schema, OceanCode5Schema } from "../ocean-code";
import { FacetResultSchema, TraitResultSchema } from "../result-schemas";

describe("OceanCode4Schema", () => {
	const decode = S.decodeUnknownSync(OceanCode4Schema);

	it("accepts valid 4-letter codes", () => {
		expect(() => decode("ODAC")).not.toThrow(); // O, D, A, C positions
		expect(() => decode("PFIW")).not.toThrow();
		expect(() => decode("GBEN")).not.toThrow();
	});

	it("rejects wrong length", () => {
		expect(() => decode("ODA")).toThrow();
		expect(() => decode("ODACR")).toThrow();
	});

	it("rejects lowercase", () => {
		expect(() => decode("odac")).toThrow();
	});

	it("rejects invalid letters per position", () => {
		expect(() => decode("XDAC")).toThrow(); // X not in [PGO]
		expect(() => decode("OXAC")).toThrow(); // X not in [FBD]
		expect(() => decode("ODXC")).toThrow(); // X not in [IAE]
		expect(() => decode("ODAX")).toThrow(); // X not in [CNW]
	});
});

describe("OceanCode5Schema", () => {
	const decode = S.decodeUnknownSync(OceanCode5Schema);

	it("accepts valid 5-letter codes", () => {
		expect(() => decode("ODACR")).not.toThrow();
		expect(() => decode("PFIWT")).not.toThrow();
		expect(() => decode("GBENS")).not.toThrow();
	});

	it("rejects wrong length", () => {
		expect(() => decode("ODAC")).toThrow();
		expect(() => decode("ODACRS")).toThrow();
	});

	it("rejects invalid 5th position letter", () => {
		expect(() => decode("ODACX")).toThrow(); // X not in [RTS]
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
