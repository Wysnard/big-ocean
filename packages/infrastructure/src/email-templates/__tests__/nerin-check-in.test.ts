/**
 * Nerin Check-in Email Template Tests (Story 38-1)
 */
import { describe, expect, it } from "vitest";
import { renderCheckInEmail } from "../nerin-check-in";

describe("renderCheckInEmail", () => {
	it("renders HTML with user name and territory description", () => {
		const html = renderCheckInEmail({
			userName: "Alice",
			territoryDescription: "what you make or imagine when nobody's watching",
			resultsUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("what you make or imagine when nobody&#39;s watching");
		expect(html).toContain("https://bigocean.dev/me");
		expect(html).toContain("Continue with Nerin");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses Nerin's warm, curious voice with second-person territory description", () => {
		const html = renderCheckInEmail({
			userName: "Bob",
			territoryDescription: "how you read your own internal weather",
			resultsUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("I've been thinking about our conversation");
		expect(html).toContain("how you read your own internal weather");
		expect(html).toContain("There's more to explore there if you're curious");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderCheckInEmail({
			userName: "",
			territoryDescription: "what gets under your skin & how you handle it",
			resultsUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("Hey there,");
		expect(html).toContain("what gets under your skin &amp; how you handle it");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderCheckInEmail({
			userName: '<script>alert("xss")</script>',
			territoryDescription: "Test & <Territory>",
			resultsUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("Test &amp; &lt;Territory&gt;");
	});

	it("includes one-time notice in footer", () => {
		const html = renderCheckInEmail({
			userName: "Charlie",
			territoryDescription: "how you move through rooms and what that takes from you",
			resultsUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("one-time check-in");
	});

	it("has correct email subject in title", () => {
		const html = renderCheckInEmail({
			userName: "Dana",
			territoryDescription: "what drives you and whether you trust it",
			resultsUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("<title>I've been thinking about something you said</title>");
	});
});
