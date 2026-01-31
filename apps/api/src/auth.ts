/**
 * Better Auth Server Configuration
 *
 * Official pattern: Separate auth.ts file for server-side configuration
 * Reference: https://www.better-auth.com/docs/basic-usage
 */

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "./setup.js"
import * as authSchema from "@workspace/infrastructure/auth-schema"

/**
 * Better Auth instance with NIST 2025 password validation
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
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
        return await bcrypt.hash(password, 12)
      },
      verify: async (data: { hash: string; password: string }) => {
        return await bcrypt.compare(data.password, data.hash)
      },
    },
  },

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET || "placeholder-secret-for-development-only",

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
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https") ?? false,
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          console.info(`User created: ${user.id} (${user.email})`)

          // Link anonymous session to new user account
          const body = context?.body
          const anonymousSessionId = typeof body === "object" && body !== null && "anonymousSessionId" in body
            ? (body as Record<string, unknown>).anonymousSessionId
            : undefined

          if (typeof anonymousSessionId === "string") {
            try {
              await db
                .update(authSchema.session)
                .set({ userId: user.id, updatedAt: new Date() })
                .where(eq(authSchema.session.id, anonymousSessionId))

              console.info(
                `Linked anonymous session ${anonymousSessionId} to user ${user.id}`
              )
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              console.error(
                `Failed to link anonymous session: ${errorMessage}`
              )
            }
          }
        },
      },
    },
  },
})

export type Auth = typeof auth
