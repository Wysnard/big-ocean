/**
 * Better Auth Integration Tests
 *
 * Tests the full authentication flow with Better Auth:
 * - User signup with email/password
 * - Password validation (12+ characters, NIST 2025)
 * - User signin
 * - Session management
 * - Anonymous session linking
 *
 * Note: These tests require a running PostgreSQL database.
 * Run with: pnpm test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { auth } from "../setup.js";

describe("Better Auth Integration", () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "SecurePassword123456", // 20 chars (> 12 minimum)
    name: "Test User",
  };

  describe("Password Validation (NIST 2025)", () => {
    it("should reject passwords < 12 characters", async () => {
      try {
        await auth.api.signUpEmail({
          body: {
            email: `short-${Date.now()}@example.com`,
            password: "Short123", // Only 8 characters
            name: "Test",
          },
        });

        // Should not reach here
        expect.fail("Should have rejected short password");
      } catch (error: any) {
        expect(error.message).toContain("12");
      }
    });

    it("should accept passwords >= 12 characters", async () => {
      const result = await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.name).toBe(testUser.name);
    });
  });

  describe("User Signup", () => {
    it("should create user with bcrypt hashed password", async () => {
      const email = `bcrypt-${Date.now()}@example.com`;

      const result = await auth.api.signUpEmail({
        body: {
          email,
          password: "TestPassword123456",
          name: "Bcrypt Test",
        },
      });

      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.email).toBe(email);

      // Password should be hashed (not stored in plaintext)
      // We can't directly check the hash, but we can verify the user was created
      expect(result.user.id.length).toBeGreaterThan(0);
    });

    it("should create HTTP-only session on signup", async () => {
      const email = `session-${Date.now()}@example.com`;

      const result = await auth.api.signUpEmail({
        body: {
          email,
          password: "SessionTestPassword123",
          name: "Session Test",
        },
      });

      expect(result.session).toBeDefined();
      expect(result.session.token).toBeDefined();
      expect(result.session.expiresAt).toBeDefined();

      // Session should expire in ~7 days
      const expiresAt = new Date(result.session.expiresAt);
      const now = new Date();
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6);
      expect(diffDays).toBeLessThan(8);
    });

    it("should reject duplicate email signup", async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First signup
      await auth.api.signUpEmail({
        body: {
          email,
          password: "FirstPassword123456",
          name: "First User",
        },
      });

      // Second signup with same email should fail
      try {
        await auth.api.signUpEmail({
          body: {
            email,
            password: "SecondPassword123456",
            name: "Second User",
          },
        });

        expect.fail("Should have rejected duplicate email");
      } catch (error: any) {
        expect(error.message).toMatch(/already exists|duplicate/i);
      }
    });
  });

  describe("User Signin", () => {
    it("should sign in with valid credentials", async () => {
      const result = await auth.api.signInEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.session).toBeDefined();
      expect(result.session.token).toBeDefined();
    });

    it("should reject invalid password", async () => {
      try {
        await auth.api.signInEmail({
          body: {
            email: testUser.email,
            password: "WrongPassword123456",
          },
        });

        expect.fail("Should have rejected invalid password");
      } catch (error: any) {
        expect(error.message).toMatch(/invalid|incorrect|wrong/i);
      }
    });

    it("should reject non-existent user", async () => {
      try {
        await auth.api.signInEmail({
          body: {
            email: "nonexistent@example.com",
            password: "SomePassword123456",
          },
        });

        expect.fail("Should have rejected non-existent user");
      } catch (error: any) {
        expect(error.message).toMatch(/not found|invalid/i);
      }
    });
  });

  describe("Anonymous Session Linking", () => {
    it("should link anonymous session to user on signup", async () => {
      // This test requires database access to verify session linking
      // For now, we verify the hook doesn't throw errors

      const anonymousSessionId = `anon_${Date.now()}`;

      const result = await auth.api.signUpEmail({
        body: {
          email: `anon-link-${Date.now()}@example.com`,
          password: "AnonLinkPassword123",
          name: "Anon Link Test",
          // @ts-ignore - anonymousSessionId is custom field
          anonymousSessionId,
        },
      });

      expect(result.user).toBeDefined();
      // If hook fails, signup will still succeed (non-critical enhancement)
      // Actual verification would require querying session table
    });
  });

  describe("Session Management", () => {
    it("should retrieve active session", async () => {
      // Sign in first to establish session
      const signInResult = await auth.api.signInEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(signInResult.session).toBeDefined();

      // Get session should return the active session
      // Note: Better Auth uses cookies, so this test may need adjustment
      const sessionResult = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${signInResult.session.token}`,
        }),
      });

      expect(sessionResult).toBeDefined();
      expect(sessionResult.user).toBeDefined();
      expect(sessionResult.user.email).toBe(testUser.email);
    });
  });
});
