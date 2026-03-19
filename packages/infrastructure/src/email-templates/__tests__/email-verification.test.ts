/**
 * Email Verification Template Tests (Story 31-7b)
 */
import { describe, expect, it } from "vitest";
import { renderEmailVerificationEmail } from "../email-verification";

describe("renderEmailVerificationEmail", () => {
	it("renders HTML with user name and verify URL", () => {
		const html = renderEmailVerificationEmail({
			userName: "Alice",
			verifyUrl: "https://bigocean.dev/api/auth/verify-email?token=abc-123&callbackURL=/profile",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain(
			"https://bigocean.dev/api/auth/verify-email?token=abc-123&amp;callbackURL=/profile",
		);
		expect(html).toContain("Verify Your Email");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderEmailVerificationEmail({
			userName: "",
			verifyUrl: "https://bigocean.dev/verify",
		});

		expect(html).toContain("Hey there,");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderEmailVerificationEmail({
			userName: '<script>alert("xss")</script>',
			verifyUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("includes welcome/verification messaging", () => {
		const html = renderEmailVerificationEmail({
			userName: "Bob",
			verifyUrl: "https://bigocean.dev/verify",
		});

		expect(html).toContain("verify");
		expect(html).toContain("big ocean");
	});
});
