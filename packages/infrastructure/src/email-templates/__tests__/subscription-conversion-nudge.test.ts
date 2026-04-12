import { describe, expect, it } from "vitest";
import { renderSubscriptionNudgeEmail } from "../subscription-conversion-nudge";

describe("renderSubscriptionNudgeEmail", () => {
	it("renders HTML with user name and subscription URL", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: "Alice",
			subscriptionUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("https://bigocean.dev/me");
		expect(html).toContain("Explore subscription");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses Nerin's voice without reviving portrait-paywall copy", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: "Bob",
			subscriptionUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("deeper weekly letters");
		expect(html).toContain("next conversation");
		expect(html).not.toContain("portrait");
		expect(html).not.toContain("unlock");
	});

	it("does not leak sensitive personality data", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: "Eve",
			subscriptionUrl: "https://bigocean.dev/me",
		});

		expect(html).not.toContain("OCEAN");
		expect(html).not.toContain("facet");
		expect(html).not.toContain("score");
		expect(html).not.toContain("neuroticism");
		expect(html).not.toContain("openness");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: "",
			subscriptionUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("Hey there,");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: '<script>alert("xss")</script>',
			subscriptionUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("includes one-time notice in footer", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: "Charlie",
			subscriptionUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("one-time note");
	});

	it("has the correct email subject in the title", () => {
		const html = renderSubscriptionNudgeEmail({
			userName: "Dana",
			subscriptionUrl: "https://bigocean.dev/me",
		});

		expect(html).toContain("<title>I have more I want to say about what comes next</title>");
	});
});
