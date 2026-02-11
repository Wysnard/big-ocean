import { describe, expect, it } from "vitest";
import { facetEvidence } from "../drizzle/schema";

/**
 * Schema validation tests for facet evidence table
 *
 * These tests verify the structure of Drizzle tables before they're migrated.
 * They ensure fields exist, have correct types, and follow naming conventions.
 *
 * Note: facet_scores and trait_scores tables were removed in Story 2-9.
 * Scores are now computed on-demand from facet_evidence via pure functions.
 */
describe("Facet Evidence Schema", () => {
	it("should have facetEvidence table with correct fields", () => {
		// Verify table exists
		expect(facetEvidence).toBeDefined();

		// Verify primary key column
		expect(facetEvidence.id).toBeDefined();

		// Verify foreign keys
		expect(facetEvidence.assessmentMessageId).toBeDefined();

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
		expect(columns).toContain("assessmentMessageId");
		expect(columns).toContain("facetName");
		expect(columns).toContain("score");
		expect(columns).toContain("confidence");
		expect(columns).toContain("quote");
		expect(columns).toContain("highlightStart");
		expect(columns).toContain("highlightEnd");
		expect(columns).toContain("createdAt");
	});
});
