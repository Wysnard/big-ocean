/**
 * Nerin Check-in Email Template Tests (Story 38-1)
 */
import { describe, expect, it } from "vitest";
import { renderCheckInEmail } from "../nerin-check-in";

describe("renderCheckInEmail", () => {
	it("renders HTML with user name and territory", () => {
		const html = renderCheckInEmail({
			userName: "Alice",
			territoryName: "Creative Expression",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("Creative Expression");
		expect(html).toContain("https://bigocean.dev/results");
		expect(html).toContain("Continue with Nerin");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses Nerin's warm, curious voice", () => {
		const html = renderCheckInEmail({
			userName: "Bob",
			territoryName: "Emotional Landscape",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("I've been thinking about our conversation");
		expect(html).toContain("There's more to explore there if you're curious");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderCheckInEmail({
			userName: "",
			territoryName: "Risk & Adventure",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("Hey there,");
		expect(html).toContain("Risk &amp; Adventure");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderCheckInEmail({
			userName: '<script>alert("xss")</script>',
			territoryName: "Test & <Territory>",
			resultsUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("Test &amp; &lt;Territory&gt;");
	});

	it("includes one-time notice in footer", () => {
		const html = renderCheckInEmail({
			userName: "Charlie",
			territoryName: "Social Dynamics",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("one-time check-in");
	});

	it("has correct email subject in title", () => {
		const html = renderCheckInEmail({
			userName: "Dana",
			territoryName: "Work Ethic",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("<title>I've been thinking about something you said</title>");
	});
});
