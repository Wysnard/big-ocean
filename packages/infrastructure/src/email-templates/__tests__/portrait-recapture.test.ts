/**
 * Portrait Recapture Email Template Tests (Story 38-2)
 */
import { describe, expect, it } from "vitest";
import { renderRecaptureEmail } from "../portrait-recapture";

describe("renderRecaptureEmail", () => {
	it("renders HTML with user name and results URL", () => {
		const html = renderRecaptureEmail({
			userName: "Alice",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("https://bigocean.dev/results");
		expect(html).toContain("Unlock your portrait");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses warm, inviting Nerin voice", () => {
		const html = renderRecaptureEmail({
			userName: "Bob",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("I wrote something for you");
		expect(html).toContain("It's still here whenever you're ready");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderRecaptureEmail({
			userName: "",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("Hey there,");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderRecaptureEmail({
			userName: '<script>alert("xss")</script>',
			resultsUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("includes one-time notice in footer", () => {
		const html = renderRecaptureEmail({
			userName: "Charlie",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("one-time reminder");
	});

	it("has correct email subject in title", () => {
		const html = renderRecaptureEmail({
			userName: "Dana",
			resultsUrl: "https://bigocean.dev/results",
		});

		expect(html).toContain("<title>Nerin's portrait is waiting for you</title>");
	});

	it("does not expose personality data in the email body", () => {
		const html = renderRecaptureEmail({
			userName: "Eve",
			resultsUrl: "https://bigocean.dev/results",
		});

		// Should not contain score-related terms
		expect(html).not.toContain("OCEAN");
		expect(html).not.toContain("facet");
		expect(html).not.toContain("score");
		// Note: "portrait" contains "trait" so we don't check that substring
	});
});
