/**
 * Better Auth Configuration
 *
 * Initializes Better Auth with PostgreSQL/Drizzle adapter and email/password authentication.
 * Implements NIST 2025 password guidelines (12+ character minimum).
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Database } from "./database.js";
import * as authSchema from "./auth-schema.js";

/**
 * Create Better Auth instance
 */
export function createAuth(
  db: Database,
  options: {
    baseURL: string;
    secret: string;
    trustedOrigins?: string[];
  }
) {
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    trustedOrigins: options.trustedOrigins || [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:4000",
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Disable for initial setup

      // NIST 2025: Length-based, not complexity-based
      minPasswordLength: 12,
      maxPasswordLength: 128,

      // Industry-standard bcrypt hashing (cost factor: 12)
      password: {
        hash: async (password: string) => {
          return await bcrypt.hash(password, 12);
        },
        verify: async (data: { hash: string; password: string }) => {
          return await bcrypt.compare(data.password, data.hash);
        },
      },
    },
    baseURL: options.baseURL,
    secret: options.secret,
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    advanced: {
      // HTTP-only cookies for XSS protection
      defaultCookieAttributes: {
        httpOnly: true,
        secure: options.baseURL.startsWith("https"),
        sameSite: "lax" as const,
      },
      // Use secure cookies when using HTTPS
      useSecureCookies: options.baseURL.startsWith("https"),
    },
    databaseHooks: {
      user: {
        create: {
          // Hook: Link anonymous session to new user account on signup
          after: async (user, context) => {
            console.info(`User created: ${user.id} (${user.email})`);

            // Check if request body contains anonymousSessionId
            const body = context?.body as any;
            const anonymousSessionId = body?.anonymousSessionId;

            if (anonymousSessionId) {
              try {
                // Link anonymous session to new user account
                // This updates the session's userId field in the database
                await db
                  .update(authSchema.session)
                  .set({
                    userId: user.id,
                    updatedAt: new Date(),
                  })
                  .where(eq(authSchema.session.id, anonymousSessionId));

                console.info(
                  `Linked anonymous session ${anonymousSessionId} to user ${user.id}`
                );
              } catch (error: any) {
                console.error(
                  `Failed to link anonymous session ${anonymousSessionId}:`,
                  error.message
                );
                // Don't fail the signup - this is a non-critical enhancement
              }
            }
          },
        },
      },
    },
  });

  return auth;
}

/**
 * Type for Better Auth instance
 */
export type Auth = ReturnType<typeof createAuth>;
