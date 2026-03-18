/**
 * Password Reset Email Template Tests (Story 31-7b)
 */
import { describe, expect, it } from "vitest";
import { renderPasswordResetEmail } from "../password-reset";

describe("renderPasswordResetEmail", () => {
	it("renders HTML with user name and reset URL", () => {
		const html = renderPasswordResetEmail({
			userName: "Alice",
			resetUrl: "https://bigocean.dev/reset-password?token=abc-123",
		});

		expect(html).toContain("Hey Alice,");
		expect(html).toContain("https://bigocean.dev/reset-password?token=abc-123");
		expect(html).toContain("Reset Your Password");
		expect(html).toContain("<!DOCTYPE html>");
	});

	it("uses 'there' as fallback when userName is empty", () => {
		const html = renderPasswordResetEmail({
			userName: "",
			resetUrl: "https://bigocean.dev/reset",
		});

		expect(html).toContain("Hey there,");
	});

	it("escapes HTML special characters to prevent XSS", () => {
		const html = renderPasswordResetEmail({
			userName: '<script>alert("xss")</script>',
			resetUrl: 'https://example.com?a=1&b=2"',
		});

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("includes security notice in footer", () => {
		const html = renderPasswordResetEmail({
			userName: "Bob",
			resetUrl: "https://bigocean.dev/reset",
		});

		expect(html).toContain("didn't request");
		expect(html).toContain("big ocean");
	});
});
