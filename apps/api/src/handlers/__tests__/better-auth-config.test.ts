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

	describe("Invite Token Cookie Acceptance (Story 14.3)", () => {
		it("defines getInviteToken helper to read invite_token from cookie header", () => {
			expect(betterAuthSource).toContain("getInviteToken");
			expect(betterAuthSource).toContain("invite_token=");
		});

		it("defines tryAcceptInvitationFromCookie function", () => {
			expect(betterAuthSource).toContain("tryAcceptInvitationFromCookie");
		});

		it("performs atomic UPDATE with status=pending guard", () => {
			expect(betterAuthSource).toContain('eq(authSchema.relationshipInvitations.status, "pending")');
		});

		it("checks invitation not expired (gt expiresAt NOW)", () => {
			expect(betterAuthSource).toContain("gt(authSchema.relationshipInvitations.expiresAt");
		});

		it("rejects self-invitations (ne inviterUserId userId)", () => {
			expect(betterAuthSource).toContain(
				"ne(authSchema.relationshipInvitations.inviterUserId, userId)",
			);
		});

		it("sets inviteeUserId and status=accepted atomically", () => {
			expect(betterAuthSource).toContain("inviteeUserId: userId");
			expect(betterAuthSource).toContain('status: "accepted"');
		});

		it("silently swallows errors and logs them", () => {
			expect(betterAuthSource).toContain("Failed to accept invitation from cookie");
		});

		it("logs success when invitation accepted via cookie", () => {
			expect(betterAuthSource).toContain("Accepted invitation via cookie");
		});

		it("calls tryAcceptInvitationFromCookie in user.create.after hook (signup)", () => {
			// Verify the cookie accept is called in the signup hook
			expect(betterAuthSource).toContain("tryAcceptInvitationFromCookie(user.id, context)");
		});

		it("calls tryAcceptInvitationFromCookie in session.create.after hook (signin)", () => {
			// Verify the cookie accept is called in the signin hook
			expect(betterAuthSource).toContain("tryAcceptInvitationFromCookie(userId, context)");
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
