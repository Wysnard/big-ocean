/**
 * Drop-off Re-engagement Email Template Tests (Story 31-7)
 */
import { describe, expect, it } from "vitest";
import { renderDropOffEmail } from "../drop-off-re-engagement";

describe("renderDropOffEmail", () => {
	it("renders HTML with user name and territory", () => {
		const html = renderDropOffEmail({
			userName: "Alice",
			territoryName: "Creative Expression",
			resumeUrl: "https://bigocean.dev/chat?sessionId=abc-123",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("Creative Expression");
		expect(html).toContain("https://bigocean.dev/chat?sessionId=abc-123");
		expect(html).toContain("Continue with Nerin");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderDropOffEmail({
			userName: "",
			territoryName: "Risk & Adventure",
			resumeUrl: "https://bigocean.dev/chat",
		});

		expect(html).toContain("Hey there,");
		expect(html).toContain("Risk &amp; Adventure");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderDropOffEmail({
			userName: '<script>alert("xss")</script>',
			territoryName: "Test & <Territory>",
			resumeUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("Test &amp; &lt;Territory&gt;");
	});

	it("includes one-time notice in footer", () => {
		const html = renderDropOffEmail({
			userName: "Bob",
			territoryName: "Emotional Landscape",
			resumeUrl: "https://bigocean.dev/chat",
		});

		expect(html).toContain("one-time reminder");
	});
});
