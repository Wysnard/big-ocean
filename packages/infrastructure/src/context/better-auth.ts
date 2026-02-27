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
import { haveIBeenPwned } from "better-auth/plugins";
import { and, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
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

		const getAnonymousSessionId = (
			context: { body?: unknown } | null | undefined,
		): string | undefined => {
			const body = context?.body;

			if (typeof body !== "object" || body === null || !("anonymousSessionId" in body)) {
				return undefined;
			}

			const anonymousSessionId = (body as Record<string, unknown>).anonymousSessionId;
			return typeof anonymousSessionId === "string" ? anonymousSessionId : undefined;
		};

		/**
		 * Read invite_token from request cookie header (Story 14.3)
		 */
		const getInviteToken = (context: Record<string, unknown> | undefined): string | undefined => {
			if (!context) return undefined;
			const headers = context.headers as Headers | undefined;
			if (!headers) return undefined;
			const cookieHeader = typeof headers.get === "function" ? headers.get("cookie") : undefined;
			if (!cookieHeader) return undefined;
			const match = cookieHeader.match(/(?:^|;\s*)invite_token=([^;]+)/);
			return match?.[1];
		};

		/**
		 * Accept invitation via raw Drizzle if invite_token cookie present (Story 14.3)
		 * Silently swallows errors — the user retains their assessment regardless.
		 */
		const tryAcceptInvitationFromCookie = async (
			userId: string,
			context: Record<string, unknown> | undefined,
		): Promise<void> => {
			const inviteToken = getInviteToken(context);
			if (!inviteToken) return;

			try {
				// Atomic accept: only updates if status=pending, not expired, not self
				const result = await plainDb
					.update(authSchema.relationshipInvitations)
					.set({ inviteeUserId: userId, status: "accepted", updatedAt: new Date() })
					.where(
						and(
							eq(authSchema.relationshipInvitations.invitationToken, inviteToken),
							eq(authSchema.relationshipInvitations.status, "pending"),
							gt(authSchema.relationshipInvitations.expiresAt, sql`NOW()`),
							ne(authSchema.relationshipInvitations.inviterUserId, userId),
						),
					)
					.returning({ id: authSchema.relationshipInvitations.id });

				if (result.length > 0) {
					logger.info(`Accepted invitation via cookie for user ${userId}`);
				}
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error);
				logger.error(`Failed to accept invitation from cookie for user ${userId}: ${msg}`);
			}

			// Clear the invite_token cookie via response headers
			// Note: Better Auth hooks don't provide direct response header access,
			// so the cookie will be cleared on the next claim or accept endpoint call.
			// The frontend should call the accept endpoint explicitly for the AC5 path.
		};

		const linkAnonymousAssessmentSession = async (
			userId: string,
			anonymousSessionId: string,
			source: "signup" | "signin",
		): Promise<void> => {
			try {
				await plainDb.transaction(async (tx) => {
					// Allow first-time linking and idempotent relinking by the same user only.
					const [linkedSession] = await tx
						.update(authSchema.assessmentSession)
						.set({ userId, sessionToken: null, updatedAt: new Date() })
						.where(
							and(
								eq(authSchema.assessmentSession.id, anonymousSessionId),
								or(
									isNull(authSchema.assessmentSession.userId),
									eq(authSchema.assessmentSession.userId, userId),
								),
							),
						)
						.returning({ id: authSchema.assessmentSession.id });

					if (!linkedSession) {
						logger.warn(
							`Anonymous assessment session ${anonymousSessionId} not linked during ${source} (missing or owned by another user)`,
						);
						return;
					}

					// Backfill historical user-authored messages in that session.
					await tx
						.update(authSchema.assessmentMessage)
						.set({ userId })
						.where(
							and(
								eq(authSchema.assessmentMessage.sessionId, anonymousSessionId),
								eq(authSchema.assessmentMessage.role, "user"),
								isNull(authSchema.assessmentMessage.userId),
							),
						);
				});

				logger.info(
					`Linked anonymous assessment session ${anonymousSessionId} to user ${userId} during ${source}`,
				);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				logger.error(
					`Failed to link anonymous assessment session ${anonymousSessionId} during ${source}: ${errorMessage}`,
				);
			}
		};

		// Create Better Auth with plain node-postgres drizzle instance
		const auth = betterAuth({
			database: drizzleAdapter(plainDb, {
				provider: "pg",
				schema: authSchema,
			}),

			plugins: [
				haveIBeenPwned({
					customPasswordCompromisedMessage:
						"This password has appeared in a data breach. Please choose a different password.",
				}),
			],

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

							// Grant 1 free relationship credit (Story 14.1)
							// Idempotent: deterministic polarCheckoutId + onConflictDoNothing
							try {
								await plainDb
									.insert(authSchema.purchaseEvents)
									.values({
										id: crypto.randomUUID(),
										userId: user.id,
										eventType: "free_credit_granted",
										polarCheckoutId: `free-credit-${user.id}`,
									})
									.onConflictDoNothing();
							} catch (error) {
								const msg = error instanceof Error ? error.message : String(error);
								logger.error(`Failed to grant free credit for user ${user.id}: ${msg}`);
							}

							const anonymousSessionId = getAnonymousSessionId(context);
							if (anonymousSessionId) {
								await linkAnonymousAssessmentSession(user.id, anonymousSessionId, "signup");
							}

							// Story 14.3: Accept invitation if invite_token cookie present
							await tryAcceptInvitationFromCookie(user.id, context ?? undefined);
						},
					},
				},
				session: {
					create: {
						after: async (session, context) => {
							if (typeof context?.path === "string" && context.path.includes("sign-up")) {
								return;
							}

							const anonymousSessionId = getAnonymousSessionId(context);
							const userId = typeof session.userId === "string" ? session.userId : undefined;

							if (!anonymousSessionId || !userId) return;

							await linkAnonymousAssessmentSession(userId, anonymousSessionId, "signin");

							// Story 14.3: Accept invitation if invite_token cookie present
							await tryAcceptInvitationFromCookie(userId, context ?? undefined);
						},
					},
				},
			},
		});

		return auth as unknown as BetterAuthInstance;
	}),
);
