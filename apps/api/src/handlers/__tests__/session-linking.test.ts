/**
 * Session Linking Verification Tests (Story 9.4)
 *
 * Verifies the anonymous-to-authenticated session linking implementation
 * by reading source file contents. Tests confirm:
 * - linkAnonymousAssessmentSession() handles linking, backfill, token clearing
 * - Database hooks fire correctly for signup and signin
 * - Sign-in hook skips for sign-up paths (prevents double-linking)
 * - assignUserId() clears session_token
 * - Error handling is graceful (no auth crash on linking failure)
 * - Idempotent relinking is supported
 * - Conflict resolution rejects sessions owned by other users
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * NOTE: These are source-reading verification tests, NOT behavioral tests.
 * They confirm code patterns exist in source files but do not execute the code.
 * Behavioral coverage is provided by session-linking.use-case.test.ts.
 * If refactoring changes string patterns without changing behavior, update these assertions.
 */

const betterAuthSource = readFileSync(
	resolve(__dirname, "../../../../../packages/infrastructure/src/context/better-auth.ts"),
	"utf-8",
);

const sessionRepoSource = readFileSync(
	resolve(
		__dirname,
		"../../../../../packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts",
	),
	"utf-8",
);

const schemaSource = readFileSync(
	resolve(__dirname, "../../../../../packages/infrastructure/src/db/drizzle/schema.ts"),
	"utf-8",
);

describe("Session Linking (Story 9.4)", () => {
	describe("Task 1: linkAnonymousAssessmentSession() hardening", () => {
		it("uses a database transaction for atomicity", () => {
			expect(betterAuthSource).toContain("plainDb.transaction(async (tx)");
		});

		it("updates assessment_session.userId within the transaction", () => {
			expect(betterAuthSource).toMatch(/tx\s*\n?\s*\.update\(authSchema\.assessmentSession\)/);
		});

		it("clears session_token on link (AC #2)", () => {
			expect(betterAuthSource).toContain("sessionToken: null, updatedAt: new Date()");
		});

		it("backfills assessment_message.userId for user-role messages", () => {
			expect(betterAuthSource).toContain('eq(authSchema.assessmentMessage.role, "user")');
			expect(betterAuthSource).toContain("isNull(authSchema.assessmentMessage.userId)");
		});

		it("only backfills messages with null userId", () => {
			// Ensures we don't overwrite already-linked messages
			expect(betterAuthSource).toContain("isNull(authSchema.assessmentMessage.userId)");
		});

		it("supports idempotent relinking (same user can relink same session)", () => {
			expect(betterAuthSource).toContain("eq(authSchema.assessmentSession.userId, userId)");
			expect(betterAuthSource).toContain("isNull(authSchema.assessmentSession.userId)");
		});

		it("rejects sessions owned by another user (conflict resolution)", () => {
			// The WHERE clause only matches: userId IS NULL OR userId = currentUser
			// If another user owns the session, the update returns no rows
			expect(betterAuthSource).toContain("isNull(authSchema.assessmentSession.userId)");
			expect(betterAuthSource).toContain("eq(authSchema.assessmentSession.userId, userId)");
			// Both conditions are wrapped in or()
			expect(betterAuthSource).toMatch(/or\(\s*isNull\(authSchema\.assessmentSession\.userId\)/s);
		});

		it("logs warning when session not linked (missing or owned by another user)", () => {
			expect(betterAuthSource).toContain(
				"not linked during ${source} (missing or owned by another user)",
			);
		});

		it("catches errors gracefully without crashing auth flow", () => {
			expect(betterAuthSource).toContain("} catch (error) {");
			expect(betterAuthSource).toContain("logger.error(");
			expect(betterAuthSource).toContain("Failed to link anonymous assessment session");
		});
	});

	describe("Task 1.2: assignUserId() token clearing", () => {
		it("sets sessionToken to null when assigning user", () => {
			expect(sessionRepoSource).toContain("{ userId, sessionToken: null, updatedAt: new Date() }");
		});

		it("returns the updated session after assignment", () => {
			expect(sessionRepoSource).toContain(
				"Schema.decodeUnknown(AssessmentSessionEntitySchema)(updated)",
			);
		});
	});

	describe("Task 1.4: Database hooks", () => {
		it("user.create.after hook calls linkAnonymousAssessmentSession for signup", () => {
			expect(betterAuthSource).toContain(
				'linkAnonymousAssessmentSession(user.id, anonymousSessionId, "signup")',
			);
		});

		it("session.create.after hook calls linkAnonymousAssessmentSession for signin", () => {
			expect(betterAuthSource).toContain(
				'linkAnonymousAssessmentSession(userId, anonymousSessionId, "signin")',
			);
		});

		it("user.create.after logs user creation", () => {
			expect(betterAuthSource).toContain("User created: ${user.id} (${user.email})");
		});
	});

	describe("Task 1.5: Sign-in hook skips sign-up path", () => {
		it("session.create.after skips when path includes 'sign-up'", () => {
			expect(betterAuthSource).toContain('context.path.includes("sign-up")');
		});

		it("returns early without calling linking function on sign-up path", () => {
			// The sign-up check must appear BEFORE the signin linking call in the source.
			// This ensures it acts as an early return guard.
			const signUpCheckIndex = betterAuthSource.indexOf('context.path.includes("sign-up")');
			const signinLinkIndex = betterAuthSource.indexOf(
				'linkAnonymousAssessmentSession(userId, anonymousSessionId, "signin")',
			);
			expect(signUpCheckIndex).toBeGreaterThan(-1);
			expect(signinLinkIndex).toBeGreaterThan(-1);
			expect(signUpCheckIndex).toBeLessThan(signinLinkIndex);
		});
	});

	describe("Task 2: Conflict resolution (one-session-per-user)", () => {
		it("partial unique index exists in schema (user_id WHERE NOT NULL)", () => {
			// The database schema enforces one session per user via partial unique index
			// This is the ultimate enforcement — even if linking logic has bugs, DB prevents duplicate assignments
			expect(schemaSource).toContain("assessment_session_user_lifetime_unique");
			expect(schemaSource).toContain("user_id IS NOT NULL");
		});

		it("linking function handles constraint violation via try-catch", () => {
			// When the partial unique index is violated (user already has a session),
			// the DB throws a constraint error which is caught by the try-catch block
			expect(betterAuthSource).toContain("} catch (error) {");
			expect(betterAuthSource).toContain("logger.error(");
		});
	});
});
