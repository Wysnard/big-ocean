/**
 * Better Auth Service with Effect
 *
 * Receives config and logger through dependency injection.
 *
 * IMPORTANT: Better Auth's drizzle adapter uses `await db.insert().returning()`,
 * which requires a Promise-based drizzle instance (node-postgres driver).
 * The app's main database uses drizzle-orm/effect-postgres which returns Effect monads.
 * We create a separate plain pg.Pool-backed drizzle instance specifically for Better Auth.
 *
 * Official Effect Services pattern:
 * https://effect.website/docs/requirements-management/services/
 */

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { AppConfig } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer, Redacted } from "effect";
import pg from "pg";
import * as authSchema from "../db/drizzle/schema";

/**
 * Better Auth instance type — inferred from betterAuth() return.
 * Using ReturnType avoids invariance issues with Auth<SpecificOptions> vs Auth<BetterAuthOptions>.
 */
type BetterAuthInstance = ReturnType<typeof betterAuth>;

/**
 * Better Auth Service Tag
 *
 * CRITICAL: Service interface has NO requirements parameter.
 * Dependencies managed during layer construction, not at service level.
 */
export class BetterAuthService extends Context.Tag("BetterAuthService")<
	BetterAuthService,
	BetterAuthInstance
>() {}

/**
 * Extract service shape
 */
export type BetterAuthShape = Context.Tag.Service<BetterAuthService>;

/**
 * Better Auth Layer
 *
 * Layer type: Layer<BetterAuthService, never, AppConfig | LoggerRepository>
 * Dependencies resolved during construction via Effect DI.
 *
 * CRITICAL: All configuration comes from AppConfig - no process.env usage.
 */
export const BetterAuthLive = Layer.effect(
	BetterAuthService,
	Effect.gen(function* () {
		// Receive dependencies through DI during layer construction
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// Create a plain node-postgres pool for Better Auth
		// Better Auth's drizzle adapter calls `await db.insert().returning()` which
		// requires Promise-based queries (incompatible with drizzle-orm/effect-postgres)
		const pool = new pg.Pool({ connectionString: config.databaseUrl });
		const plainDb = drizzleNodePg({ client: pool, schema: authSchema });

		// Determine if using HTTPS for secure cookies
		const isHttps = config.betterAuthUrl.startsWith("https");

		// Create Better Auth with plain node-postgres drizzle instance
		const auth = betterAuth({
			database: drizzleAdapter(plainDb, {
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
								typeof body === "object" && body !== null && "anonymousSessionId" in body
									? (body as Record<string, unknown>).anonymousSessionId
									: undefined;

							if (typeof anonymousSessionId === "string") {
								try {
									// Use plain drizzle instance for session linking
									await plainDb
										.update(authSchema.session)
										.set({ userId: user.id, updatedAt: new Date() })
										.where(eq(authSchema.session.id, anonymousSessionId));

									logger.info(`Linked anonymous session ${anonymousSessionId} to user ${user.id}`);
								} catch (error) {
									const errorMessage = error instanceof Error ? error.message : String(error);
									logger.error(`Failed to link anonymous session: ${errorMessage}`);
								}
							}
						},
					},
				},
			},
		});

		return auth as BetterAuthInstance;
	}),
);
