/**
 * Better Auth Service Layer Tests
 *
 * Tests Effect-based Better Auth service with test implementation.
 * Pattern adapted from: https://github.com/better-auth/better-auth/blob/canary/packages/better-auth/src/test-utils/test-instance.ts
 */

import { describe, it, expect } from "vitest";
import { Effect, Layer } from "effect";
import { betterAuth, type Auth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/effect-postgres";
import bcrypt from "bcryptjs";
import { BetterAuthService, BetterAuthShape } from "../context/better-auth.js";
import { Database } from "../context/database.js";
import { DatabaseTest } from "./database.test.js";
import * as authSchema from "../auth-schema.js";

/**
 * Test Better Auth Service
 *
 * Creates a real Better Auth instance with mock database and test configuration.
 * Follows the pattern from Better Auth's own test utilities.
 */
const createTestBetterAuth = (): Auth<BetterAuthOptions> => {
  // Use Drizzle mock database with Effect Postgres client interface
  const mockDb = drizzle.mock({ schema: authSchema });

  // Create mock client with unsafe method and empty session
  const mockClient = {
    unsafe: (_sql: string, ..._params: any[]) =>
      Effect.succeed({ rows: [], fields: [] }),
    session: {}, // Add empty session if needed by client
  };

  // Override $client with our mock that has unsafe() method
  // @ts-expect-error - Mock client doesn't implement full PgClient interface
  mockDb.$client = mockClient;

  // Create Better Auth instance with test configuration
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-secret-that-is-long-enough-for-validation",

    database: drizzleAdapter(mockDb, {
      provider: "pg",
      schema: authSchema,
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      password: {
        hash: async (password: string) => await bcrypt.hash(password, 12),
        verify: async (data: { hash: string; password: string }) =>
          await bcrypt.compare(data.password, data.hash),
      },
    },

    rateLimit: {
      enabled: false, // Disable for testing
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,
    },

    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        secure: false, // Test environment
        sameSite: "lax" as const,
      },
      useSecureCookies: false,
    },
  });

  return auth;
};

/**
 * Test Better Auth Layer
 *
 * Provides test Better Auth implementation without requiring Database.
 */
export const BetterAuthTest = Layer.succeed(
  BetterAuthService,
  createTestBetterAuth(),
);

/**
 * Complete Test Stack
 *
 * Combines test Database and BetterAuth for integration testing.
 */
export const TestServiceStack = Layer.mergeAll(DatabaseTest, BetterAuthTest);

describe("BetterAuth Service", () => {
  it("should create BetterAuthService tag", () => {
    expect(BetterAuthService).toBeDefined();
    expect(BetterAuthService.key).toBe("BetterAuthService");
  });

  it("should resolve BetterAuthService from test layer", async () => {
    const program = Effect.gen(function* () {
      const auth = yield* BetterAuthService;
      expect(auth).toBeDefined();
      expect(auth.api).toBeDefined();
      expect(auth.handler).toBeDefined();
      return auth;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(BetterAuthTest)),
    );

    expect(result.api).toBeDefined();
  });

  it("should provide Better Auth instance with required methods", async () => {
    const program = Effect.gen(function* () {
      const auth = yield* BetterAuthService;

      // Verify auth has expected API methods (not calling them)
      expect(auth.api).toBeDefined();
      expect(auth.handler).toBeDefined();
      expect(auth.api.getSession).toBeDefined();
      expect(auth.api.signUpEmail).toBeDefined();
      expect(auth.api.signInEmail).toBeDefined();
      expect(auth.api.signOut).toBeDefined();

      return true;
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(BetterAuthTest)),
    );

    expect(result).toBe(true);
  });

  it("should work with both Database and BetterAuth test layers", async () => {
    const program = Effect.gen(function* () {
      const db = yield* Database;
      const auth = yield* BetterAuthService;

      expect(db).toBeDefined();
      expect(auth).toBeDefined();

      return { db, auth };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestServiceStack)),
    );

    expect(result.db).toBeDefined();
    expect(result.auth).toBeDefined();
  });

  it("should be injectable via Layer.succeed for custom test scenarios", async () => {
    const customAuth = createTestBetterAuth();
    const CustomAuthTest = Layer.succeed(BetterAuthService, customAuth);

    const program = Effect.gen(function* () {
      const auth = yield* BetterAuthService;
      return auth === customAuth;
    });

    const isSameInstance = await Effect.runPromise(
      program.pipe(Effect.provide(CustomAuthTest)),
    );

    expect(isSameInstance).toBe(true);
  });

  it("should have proper BetterAuthShape type", () => {
    const testAuth = createTestBetterAuth();

    // Type assertion - if this compiles, BetterAuthShape is correct
    const _typed: BetterAuthShape = testAuth;
    expect(_typed).toBeDefined();
  });
});
