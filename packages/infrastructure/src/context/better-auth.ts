/**
 * Better Auth Service with Effect
 *
 * Receives database through dependency injection (not hardcoded import).
 * This allows tests to inject mock database.
 *
 * Official Effect Services pattern:
 * https://effect.website/docs/requirements-management/services/
 */

import { Context, Layer, Effect } from "effect";
import { Database } from "./database.js";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { betterAuth, type Auth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
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
 * Layer type: Layer<BetterAuthService, never, Database | LoggerRepository>
 * Dependencies (Database, LoggerRepository) resolved during construction.
 *
 * CRITICAL: The Drizzle adapter receives the database through DI.
 */
export const BetterAuthLive = Layer.effect(
  BetterAuthService,
  Effect.gen(function* () {
    // Receive dependencies through DI during layer construction
    const database = yield* Database;
    const logger = yield* LoggerRepository;

    // Create Better Auth with injected database
    const auth = betterAuth({
      database: drizzleAdapter(database, {
        provider: "pg",
        schema: authSchema,
      }),

      trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4000",
        process.env.FRONTEND_URL,
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

      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
      secret:
        process.env.BETTER_AUTH_SECRET ||
        "placeholder-secret-for-development-only",

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
          secure: process.env.BETTER_AUTH_URL?.startsWith("https") ?? false,
          sameSite: "lax" as const,
        },
        useSecureCookies:
          process.env.BETTER_AUTH_URL?.startsWith("https") ?? false,
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
                    `Linked anonymous session ${anonymousSessionId} to user ${user.id}`,
                  );
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);
                  logger.error(
                    `Failed to link anonymous session: ${errorMessage}`,
                  );
                }
              }
            },
          },
        },
      },
    });

    return auth;
  }),
);
