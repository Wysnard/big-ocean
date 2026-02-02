/**
 * Better Auth Service with Effect
 *
 * Receives config, database, and logger through dependency injection.
 * This allows tests to inject mocks and ensures type-safe configuration.
 *
 * Official Effect Services pattern:
 * https://effect.website/docs/requirements-management/services/
 */

import { AppConfig } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Context, Effect, Layer, Redacted } from "effect";
import { betterAuth, type Auth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Database } from "./database.js";
import * as authSchema from "../infrastructure/db/schema.js";

/**
 * Better Auth Service Tag
 *
 * CRITICAL: Service interface has NO requirements parameter.
 * Dependencies managed during layer construction, not at service level.
 */
export class BetterAuthService extends Context.Tag("BetterAuthService")<
  BetterAuthService,
  Auth<BetterAuthOptions>
>() {}

/**
 * Extract service shape
 */
export type BetterAuthShape = Context.Tag.Service<BetterAuthService>;

/**
 * Better Auth Layer
 *
 * Layer type: Layer<BetterAuthService, never, AppConfig | Database | LoggerRepository>
 * Dependencies resolved during construction via Effect DI.
 *
 * CRITICAL: All configuration comes from AppConfig - no process.env usage.
 */
export const BetterAuthLive = Layer.effect(
  BetterAuthService,
  Effect.gen(function* () {
    // Receive dependencies through DI during layer construction
    const config = yield* AppConfig;
    const database = yield* Database;
    const logger = yield* LoggerRepository;

    // Determine if using HTTPS for secure cookies
    const isHttps = config.betterAuthUrl.startsWith("https");

    // Create Better Auth with injected dependencies
    const auth = betterAuth({
      database: drizzleAdapter(database, {
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
          secure: isHttps,
          sameSite: "lax" as const,
        },
        useSecureCookies: isHttps,
      },

      databaseHooks: {
        user: {
          create: {
            after: async (user, context) => {
              logger.info(`User created: ${user.id} (${user.email})`);

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
                  // Use injected database for session linking
                  await database
                    .update(authSchema.session)
                    .set({ userId: user.id, updatedAt: new Date() })
                    .where(eq(authSchema.session.id, anonymousSessionId));

                  logger.info(
                    `Linked anonymous session ${anonymousSessionId} to user ${user.id}`
                  );
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);
                  logger.error(
                    `Failed to link anonymous session: ${errorMessage}`
                  );
                }
              }
            },
          },
        },
      },
    });

    return auth;
  })
);
