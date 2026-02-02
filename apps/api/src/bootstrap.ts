/**
 * Application Bootstrap
 *
 * Loads configuration and initializes services within Effect context.
 * All initialization is done as Effects, ensuring fail-fast behavior
 * and proper error handling.
 */

import { ConfigError, Effect, Redacted } from "effect";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { AppConfigService } from "@workspace/domain";
import { loadConfig, dbSchema as authSchema } from "@workspace/infrastructure";

/**
 * Database type
 */
export type Database = PostgresJsDatabase<typeof authSchema>;

/**
 * Auth type
 */
export type Auth = ReturnType<typeof betterAuth>;

/**
 * Bootstrap result containing initialized services
 */
export interface BootstrapResult {
  readonly config: AppConfigService;
  readonly db: Database;
  readonly auth: Auth;
}

/**
 * Create database connection from config
 */
const createDatabase = (config: AppConfigService): Database =>
  drizzle(config.databaseUrl, { schema: authSchema });

/**
 * Create Better Auth instance from config and database
 */
const createAuth = (config: AppConfigService, db: Database): Auth =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),

    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:4000",
      config.frontendUrl,
    ].filter(Boolean) as string[],

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,

      // NIST 2025: Length-based validation
      minPasswordLength: 12,
      maxPasswordLength: 128,

      // Bcrypt hashing (cost factor: 12)
      password: {
        hash: async (password: string) => {
          return await bcrypt.hash(password, 12);
        },
        verify: async (data: { hash: string; password: string }) => {
          return await bcrypt.compare(data.password, data.hash);
        },
      },
    },

    baseURL: config.betterAuthUrl,
    secret: Redacted.value(config.betterAuthSecret),

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },

    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        secure: config.betterAuthUrl.startsWith("https"),
        sameSite: "lax" as const,
      },
      useSecureCookies: config.betterAuthUrl.startsWith("https"),
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user, context) => {
            console.info(`User created: ${user.id} (${user.email})`);

            // Link anonymous session to new user account
            const body = context?.body;
            const anonymousSessionId =
              typeof body === "object" &&
              body !== null &&
              "anonymousSessionId" in body
                ? (body as Record<string, unknown>).anonymousSessionId
                : undefined;

            if (typeof anonymousSessionId === "string") {
              try {
                await db
                  .update(authSchema.session)
                  .set({ userId: user.id, updatedAt: new Date() })
                  .where(eq(authSchema.session.id, anonymousSessionId));

                console.info(
                  `Linked anonymous session ${anonymousSessionId} to user ${user.id}`,
                );
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                console.error(
                  `Failed to link anonymous session: ${errorMessage}`,
                );
              }
            }
          },
        },
      },
    },
  });

/**
 * Bootstrap Effect
 *
 * Loads configuration and initializes all services.
 * Fails fast if required environment variables are missing.
 *
 * @returns Effect that yields BootstrapResult with initialized services
 */
export const bootstrap: Effect.Effect<BootstrapResult, ConfigError.ConfigError> = Effect.gen(
  function* () {
    // Load configuration (fails fast if required vars missing)
    const config = yield* loadConfig;

    // Initialize database
    const db = createDatabase(config);
    console.info("Database initialized");

    // Initialize Better Auth
    const auth = createAuth(config, db);
    console.info("Better Auth initialized");

    return { config, db, auth };
  }
);
