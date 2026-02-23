/**
 * Better Auth Configuration Verification Tests (Story 9.3)
 *
 * Verifies password security settings, session cookie config,
 * trusted origins, and HaveIBeenPwned plugin by reading the source
 * file contents. This avoids the complexity of mocking Better Auth's
 * database adapter initialization.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Read the Better Auth config source to verify settings
const betterAuthSource = readFileSync(
	resolve(__dirname, "../../../../../packages/infrastructure/src/context/better-auth.ts"),
	"utf-8",
);

describe("Better Auth Configuration Verification (Story 9.3)", () => {
	describe("Password Security (Task 1.1)", () => {
		it("configures minPasswordLength: 12 (NIST 2025)", () => {
			expect(betterAuthSource).toContain("minPasswordLength: 12");
		});

		it("configures maxPasswordLength: 128", () => {
			expect(betterAuthSource).toContain("maxPasswordLength: 128");
		});

		it("uses bcrypt with cost factor 12", () => {
			expect(betterAuthSource).toContain("bcrypt.hash(password, 12)");
		});
	});

	describe("Compromised Credential Check (Task 1.2)", () => {
		it("imports haveIBeenPwned plugin", () => {
			expect(betterAuthSource).toContain('import { haveIBeenPwned } from "better-auth/plugins"');
		});

		it("includes haveIBeenPwned in plugins array", () => {
			expect(betterAuthSource).toContain("haveIBeenPwned(");
		});

		it("configures custom compromised password message", () => {
			expect(betterAuthSource).toContain("customPasswordCompromisedMessage");
			expect(betterAuthSource).toContain("appeared in a data breach");
		});
	});

	describe("Session Cookie Config (Task 1.3)", () => {
		it("sets httpOnly: true", () => {
			expect(betterAuthSource).toContain("httpOnly: true");
		});

		it("sets secure based on HTTPS", () => {
			expect(betterAuthSource).toContain("secure: isHttps");
		});

		it("sets sameSite: lax", () => {
			expect(betterAuthSource).toContain('sameSite: "lax"');
		});

		it("sets session expiry to 7 days", () => {
			expect(betterAuthSource).toContain("expiresIn: 60 * 60 * 24 * 7");
		});
	});

	describe("Trusted Origins (Task 1.4)", () => {
		it("includes config.frontendUrl", () => {
			expect(betterAuthSource).toContain("config.frontendUrl");
		});

		it("includes localhost development URLs", () => {
			expect(betterAuthSource).toContain("http://localhost:3000");
			expect(betterAuthSource).toContain("http://localhost:4000");
		});
	});

	describe("Session Linking Hooks", () => {
		it("has user.create.after hook", () => {
			expect(betterAuthSource).toMatch(/databaseHooks.*user.*create.*after/s);
		});

		it("has session.create.after hook", () => {
			expect(betterAuthSource).toMatch(/databaseHooks.*session.*create.*after/s);
		});

		it("links anonymous assessment sessions on signup", () => {
			expect(betterAuthSource).toContain(
				'linkAnonymousAssessmentSession(user.id, anonymousSessionId, "signup")',
			);
		});

		it("links anonymous assessment sessions on signin", () => {
			expect(betterAuthSource).toContain(
				'linkAnonymousAssessmentSession(userId, anonymousSessionId, "signin")',
			);
		});
	});
});
