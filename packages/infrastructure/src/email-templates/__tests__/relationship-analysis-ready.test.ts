/**
 * Relationship Analysis Ready Email Template Tests (Story 35-5)
 */
import { describe, expect, it } from "vitest";
import { renderRelationshipAnalysisReadyEmail } from "../relationship-analysis-ready";

describe("renderRelationshipAnalysisReadyEmail", () => {
	it("renders HTML with user name and partner name", () => {
		const html = renderRelationshipAnalysisReadyEmail({
			userName: "Alice",
			partnerName: "Bob",
			analysisUrl: "https://bigocean.dev/relationship/abc-123",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("Bob");
		expect(html).toContain("https://bigocean.dev/relationship/abc-123");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("includes a CTA to view the analysis", () => {
		const html = renderRelationshipAnalysisReadyEmail({
			userName: "Alice",
			partnerName: "Bob",
			analysisUrl: "https://bigocean.dev/relationship/abc-123",
		});

		expect(html).toContain("View your analysis");
	});

	it("does NOT expose personality data or analysis content", () => {
		const html = renderRelationshipAnalysisReadyEmail({
			userName: "Alice",
			partnerName: "Bob",
			analysisUrl: "https://bigocean.dev/relationship/abc-123",
		});

		// Should not contain score-related terms
		expect(html).not.toContain("OCEAN");
		expect(html).not.toContain("trait");
		expect(html).not.toContain("facet");
		expect(html).not.toContain("score");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderRelationshipAnalysisReadyEmail({
			userName: "",
			partnerName: "Bob",
			analysisUrl: "https://bigocean.dev/relationship/abc-123",
		});

		expect(html).toContain("Hey there,");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderRelationshipAnalysisReadyEmail({
			userName: '<script>alert("xss")</script>',
			partnerName: "Test & <Partner>",
			analysisUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("Test &amp; &lt;Partner&gt;");
	});

	it("includes footer explaining why user received this email", () => {
		const html = renderRelationshipAnalysisReadyEmail({
			userName: "Charlie",
			partnerName: "Dana",
			analysisUrl: "https://bigocean.dev/relationship/abc-123",
		});

		expect(html).toContain("relationship analysis");
	});
});
