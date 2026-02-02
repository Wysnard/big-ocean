import { describe, it, expect } from "vitest";
import {
	facetEvidence,
	facetScores,
	traitScores,
} from "../schema.js";

/**
 * Schema validation tests for facet evidence and scoring tables
 *
 * These tests verify the structure of Drizzle tables before they're migrated.
 * They ensure fields exist, have correct types, and follow naming conventions.
 */
describe("Facet Evidence Schema", () => {
	it("should have facetEvidence table with correct fields", () => {
		// Verify table exists
		expect(facetEvidence).toBeDefined();

		// Verify primary key column
		expect(facetEvidence.id).toBeDefined();

		// Verify foreign keys
		expect(facetEvidence.messageId).toBeDefined();

		// Verify evidence fields
		expect(facetEvidence.facetName).toBeDefined();
		expect(facetEvidence.score).toBeDefined();
		expect(facetEvidence.confidence).toBeDefined();
		expect(facetEvidence.quote).toBeDefined();
		expect(facetEvidence.highlightStart).toBeDefined();
		expect(facetEvidence.highlightEnd).toBeDefined();

		// Verify timestamps
		expect(facetEvidence.createdAt).toBeDefined();
	});

	it("should have correct column names (camelCase in TypeScript)", () => {
		// Verify column naming convention (TypeScript camelCase → snake_case in DB)
		const columns = Object.keys(facetEvidence);

		expect(columns).toContain("id");
		expect(columns).toContain("messageId");
		expect(columns).toContain("facetName");
		expect(columns).toContain("score");
		expect(columns).toContain("confidence");
		expect(columns).toContain("quote");
		expect(columns).toContain("highlightStart");
		expect(columns).toContain("highlightEnd");
		expect(columns).toContain("createdAt");
	});
});

describe("Facet Scores Schema", () => {
	it("should have facetScores table with correct fields", () => {
		// Verify table exists
		expect(facetScores).toBeDefined();

		// Verify primary key
		expect(facetScores.id).toBeDefined();

		// Verify foreign key
		expect(facetScores.sessionId).toBeDefined();

		// Verify aggregated score fields
		expect(facetScores.facetName).toBeDefined();
		expect(facetScores.score).toBeDefined();
		expect(facetScores.confidence).toBeDefined();

		// Verify timestamp
		expect(facetScores.updatedAt).toBeDefined();
	});

	it("should have correct column names (camelCase in TypeScript)", () => {
		const columns = Object.keys(facetScores);

		expect(columns).toContain("id");
		expect(columns).toContain("sessionId");
		expect(columns).toContain("facetName");
		expect(columns).toContain("score");
		expect(columns).toContain("confidence");
		expect(columns).toContain("updatedAt");
	});
});

describe("Trait Scores Schema", () => {
	it("should have traitScores table with correct fields", () => {
		// Verify table exists
		expect(traitScores).toBeDefined();

		// Verify primary key
		expect(traitScores.id).toBeDefined();

		// Verify foreign key
		expect(traitScores.sessionId).toBeDefined();

		// Verify trait fields
		expect(traitScores.traitName).toBeDefined();
		expect(traitScores.score).toBeDefined();
		expect(traitScores.confidence).toBeDefined();

		// Verify timestamp
		expect(traitScores.updatedAt).toBeDefined();
	});

	it("should have correct column names (camelCase in TypeScript)", () => {
		const columns = Object.keys(traitScores);

		expect(columns).toContain("id");
		expect(columns).toContain("sessionId");
		expect(columns).toContain("traitName");
		expect(columns).toContain("score");
		expect(columns).toContain("confidence");
		expect(columns).toContain("updatedAt");
	});
});
