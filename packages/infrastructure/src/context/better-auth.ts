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
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import type { AppConfigService, PortraitJob, PurchaseEventType } from "@workspace/domain";
import { AppConfig, PortraitJobQueue } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { haveIBeenPwned } from "better-auth/plugins";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer, Queue, Redacted } from "effect";
import pg from "pg";
import { Resend } from "resend";
import * as authSchema from "../db/drizzle/schema";
import { renderEmailVerificationEmail } from "../email-templates/email-verification";
import { renderPasswordResetEmail } from "../email-templates/password-reset";
import {
	getLifecycleEventFromSubscriptionUpdate,
	shouldRecordSubscriptionRenewal,
} from "./polar-subscription-events";

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
 * Maps a Polar product ID to our internal purchase event type.
 */
const mapPolarProductToEventType = (
	productId: string,
	config: Pick<
		AppConfigService,
		| "polarProductPortraitUnlock"
		| "polarProductRelationshipSingle"
		| "polarProductRelationship5Pack"
		| "polarProductExtendedConversation"
	>,
): PurchaseEventType | null => {
	if (productId === config.polarProductPortraitUnlock) return "portrait_unlocked";
	if (productId === config.polarProductRelationshipSingle) return "credit_purchased";
	if (productId === config.polarProductRelationship5Pack) return "credit_purchased";
	if (productId === config.polarProductExtendedConversation) return "extended_conversation_unlocked";
	return null;
};

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
		const portraitQueue = yield* PortraitJobQueue;

		// Bridge Promise→Effect: Queue.offer is self-contained, no runtime needed
		const offerPortraitJob = (job: PortraitJob): Promise<boolean> =>
			Effect.runPromise(Queue.offer(portraitQueue, job));

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

		const linkAnonymousAssessmentSession = async (
			userId: string,
			anonymousSessionId: string,
			source: "signup" | "signin",
		): Promise<void> => {
			try {
				await plainDb.transaction(async (tx) => {
					// Allow first-time linking and idempotent relinking by the same user only.
					const [linkedSession] = await tx
						.update(authSchema.conversation)
						.set({ userId, sessionToken: null, updatedAt: new Date() })
						.where(
							and(
								eq(authSchema.conversation.id, anonymousSessionId),
								or(isNull(authSchema.conversation.userId), eq(authSchema.conversation.userId, userId)),
							),
						)
						.returning({ id: authSchema.conversation.id });

					if (!linkedSession) {
						logger.warn(
							`Anonymous assessment session ${anonymousSessionId} not linked during ${source} (missing or owned by another user)`,
						);
						return;
					}

					// Story 23-3: userId column removed from assessment_message.
					// User ownership is now derived from the session, not the message.
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

		// Create Resend SDK client for auth emails (verification + password reset)
		// Same Promise-based pattern as Polar — Better Auth callbacks are async, not Effect
		const resendApiKey = Redacted.value(config.resendApiKey);
		const resend = new Resend(resendApiKey);
		const emailFrom = config.emailFromAddress;

		// Create Polar SDK client for the Better Auth plugin
		const polarToken = Redacted.value(config.polarAccessToken);
		const polarClient = new Polar({
			accessToken: polarToken,
			server:
				config.betterAuthUrl.includes("localhost") || config.betterAuthUrl.includes("127.0.0.1")
					? "sandbox"
					: "production",
		});

		const isTrackedSubscriptionProduct = (productId: string): boolean =>
			productId === config.polarProductSubscription;

		const userIdFromSubscription = (sub: Subscription): string | undefined => {
			const externalId = sub.customer?.externalId;
			return typeof externalId === "string" && externalId.length > 0 ? externalId : undefined;
		};

		const toMetadataRecord = (value: unknown): Record<string, unknown> => {
			if (typeof value === "object" && value !== null && !Array.isArray(value)) {
				return value as Record<string, unknown>;
			}
			return {};
		};

		const insertSubscriptionPurchaseEvent = async (params: {
			readonly userId: string;
			readonly eventType:
				| "subscription_started"
				| "subscription_renewed"
				| "subscription_cancelled"
				| "subscription_expired";
			readonly polarSubscriptionId: string;
			readonly polarProductId: string;
			readonly amountCents?: number | null;
			readonly currency?: string | null;
			readonly metadata: unknown;
		}): Promise<void> => {
			try {
				await plainDb
					.insert(authSchema.purchaseEvents)
					.values({
						id: crypto.randomUUID(),
						userId: params.userId,
						eventType: params.eventType,
						polarCheckoutId: null,
						polarSubscriptionId: params.polarSubscriptionId,
						polarProductId: params.polarProductId,
						amountCents: params.amountCents ?? null,
						currency: params.currency ?? null,
						metadata: params.metadata,
						assessmentResultId: null,
					})
					.onConflictDoNothing();
				logger.info("Polar webhook: subscription lifecycle event recorded", {
					userId: params.userId,
					eventType: params.eventType,
					polarSubscriptionId: params.polarSubscriptionId,
				});
			} catch (error) {
				const msg = error instanceof Error ? error.message : String(error);
				logger.error(`Polar webhook: failed to record subscription event: ${msg}`);
			}
		};

		const recordSubscriptionStarted = async (sub: Subscription): Promise<void> => {
			if (!isTrackedSubscriptionProduct(sub.productId)) return;
			const userId = userIdFromSubscription(sub);
			if (!userId) {
				logger.warn("Polar webhook: subscription missing customer.externalId", {
					subscriptionId: sub.id,
				});
				return;
			}
			const periodEnd = sub.currentPeriodEnd?.toISOString() ?? null;
			await insertSubscriptionPurchaseEvent({
				userId,
				eventType: "subscription_started",
				polarSubscriptionId: sub.id,
				polarProductId: sub.productId,
				amountCents: sub.amount,
				currency: sub.currency,
				metadata: { periodEnd },
			});
		};

		const recordSubscriptionCancelled = async (sub: Subscription): Promise<void> => {
			if (!isTrackedSubscriptionProduct(sub.productId)) return;
			const userId = userIdFromSubscription(sub);
			if (!userId) {
				logger.warn("Polar webhook: subscription.canceled missing externalId", {
					subscriptionId: sub.id,
				});
				return;
			}
			await insertSubscriptionPurchaseEvent({
				userId,
				eventType: "subscription_cancelled",
				polarSubscriptionId: sub.id,
				polarProductId: sub.productId,
				amountCents: sub.amount,
				currency: sub.currency,
				metadata: {
					cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
					canceledAt: sub.canceledAt?.toISOString() ?? null,
				},
			});
		};

		const recordSubscriptionExpired = async (sub: Subscription): Promise<void> => {
			if (!isTrackedSubscriptionProduct(sub.productId)) return;
			const userId = userIdFromSubscription(sub);
			if (!userId) {
				logger.warn("Polar webhook: subscription.revoked missing externalId", {
					subscriptionId: sub.id,
				});
				return;
			}
			await insertSubscriptionPurchaseEvent({
				userId,
				eventType: "subscription_expired",
				polarSubscriptionId: sub.id,
				polarProductId: sub.productId,
				amountCents: sub.amount,
				currency: sub.currency,
				metadata: {
					endedAt: sub.endedAt?.toISOString() ?? null,
					status: sub.status,
				},
			});
		};

		const recordSubscriptionRenewedIfNeeded = async (sub: Subscription): Promise<void> => {
			if (!isTrackedSubscriptionProduct(sub.productId)) return;
			const userId = userIdFromSubscription(sub);
			if (!userId) {
				logger.warn("Polar webhook: subscription.updated missing customer.externalId", {
					subscriptionId: sub.id,
				});
				return;
			}
			const newPeriodEnd = sub.currentPeriodEnd?.toISOString();
			if (!newPeriodEnd) return;

			const startedRows = await plainDb
				.select()
				.from(authSchema.purchaseEvents)
				.where(
					and(
						eq(authSchema.purchaseEvents.polarSubscriptionId, sub.id),
						eq(authSchema.purchaseEvents.eventType, "subscription_started"),
					),
				)
				.limit(1);

			if (startedRows.length === 0) {
				await recordSubscriptionStarted(sub);
				return;
			}

			const started = startedRows[0];
			if (!started) {
				await recordSubscriptionStarted(sub);
				return;
			}
			const startedMeta = toMetadataRecord(started.metadata);
			const startedPeriodEnd =
				typeof startedMeta.periodEnd === "string" ? startedMeta.periodEnd : null;

			if (startedPeriodEnd === newPeriodEnd) return;

			const lastRenewedRows = await plainDb
				.select()
				.from(authSchema.purchaseEvents)
				.where(
					and(
						eq(authSchema.purchaseEvents.polarSubscriptionId, sub.id),
						eq(authSchema.purchaseEvents.eventType, "subscription_renewed"),
					),
				)
				.orderBy(desc(authSchema.purchaseEvents.createdAt))
				.limit(1);

			const lastRenewed = lastRenewedRows[0];
			const latestRenewalPeriodEnd = (() => {
				const lrMeta = toMetadataRecord(lastRenewed?.metadata);
				return typeof lrMeta.renewalPeriodEnd === "string" ? lrMeta.renewalPeriodEnd : null;
			})();

			if (
				!shouldRecordSubscriptionRenewal({
					startedPeriodEnd,
					latestRenewalPeriodEnd,
					currentPeriodEnd: newPeriodEnd,
				})
			) {
				return;
			}

			await insertSubscriptionPurchaseEvent({
				userId,
				eventType: "subscription_renewed",
				polarSubscriptionId: sub.id,
				polarProductId: sub.productId,
				amountCents: sub.amount,
				currency: sub.currency,
				metadata: { renewalPeriodEnd: newPeriodEnd },
			});
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
				polar({
					client: polarClient,
					createCustomerOnSignUp: polarToken !== "not-configured" && polarToken.length > 0,
					use: [
						checkout({
							products: [
								{ productId: config.polarProductPortraitUnlock, slug: "portrait-unlock" },
								{ productId: config.polarProductRelationshipSingle, slug: "relationship-single" },
								{ productId: config.polarProductRelationship5Pack, slug: "relationship-5pack" },
								{
									productId: config.polarProductExtendedConversation,
									slug: "extended-conversation",
								},
								{ productId: config.polarProductSubscription, slug: "subscription" },
							],

							authenticatedUsersOnly: true,
						}),
						webhooks({
							secret: Redacted.value(config.polarWebhookSecret),
							onSubscriptionCreated: async (payload) => {
								await recordSubscriptionStarted(payload.data);
							},
							onSubscriptionActive: async (payload) => {
								await recordSubscriptionStarted(payload.data);
							},
							onSubscriptionCanceled: async (payload) => {
								await recordSubscriptionCancelled(payload.data);
							},
							onSubscriptionRevoked: async (payload) => {
								await recordSubscriptionExpired(payload.data);
							},
							onSubscriptionUpdated: async (payload) => {
								const sub = payload.data;
								const lifecycleEvent = getLifecycleEventFromSubscriptionUpdate(sub);
								if (lifecycleEvent === "subscription_expired") {
									await recordSubscriptionExpired(sub);
									return;
								}
								if (lifecycleEvent === "subscription_cancelled") {
									await recordSubscriptionCancelled(sub);
									return;
								}
								if (lifecycleEvent === "subscription_started") {
									await recordSubscriptionStarted(sub);
								}
								await recordSubscriptionRenewedIfNeeded(sub);
							},
							onOrderPaid: async (payload) => {
								const order = payload.data;
								const userId = order.customer?.externalId;
								if (!userId) {
									logger.warn("Polar webhook: order.paid missing customer externalId", {
										orderId: order.id,
									});
									return;
								}

								// Map Polar product ID to internal event type
								const productId = order.productId ?? "";
								if (productId === config.polarProductSubscription) {
									logger.info(
										"Polar webhook: order.paid for subscription product — lifecycle handled by subscription webhooks",
										{ orderId: order.id, productId },
									);
									return;
								}
								const eventType = mapPolarProductToEventType(productId, config);
								if (!eventType) {
									logger.warn("Polar webhook: unknown product", { productId });
									return;
								}

								const is5Pack = productId === config.polarProductRelationship5Pack;
								const checkoutId = order.checkoutId ?? order.id;

								try {
									// Read sessionId from checkout metadata (scopes portrait to specific result)
									const orderMetadata = order.metadata as Record<string, unknown> | null;
									const sessionId =
										typeof orderMetadata?.sessionId === "string" ? orderMetadata.sessionId : null;

									// Look up assessmentResultId from session (if sessionId provided)
									let assessmentResultId: string | null = null;
									if (sessionId) {
										const results = await plainDb
											.select()
											.from(authSchema.assessmentResults)
											.where(eq(authSchema.assessmentResults.conversationId, sessionId))
											.limit(1);
										assessmentResultId = results[0]?.id ?? null;
									}

									// Insert purchase event (idempotent via unique checkout ID)
									await plainDb
										.insert(authSchema.purchaseEvents)
										.values({
											id: crypto.randomUUID(),
											userId,
											eventType,
											polarCheckoutId: checkoutId,
											polarProductId: productId,
											amountCents: order.totalAmount,
											currency: order.currency,
											metadata: is5Pack ? { units: 5 } : null,
											assessmentResultId,
										})
										.onConflictDoNothing();

									// Only portrait purchases queue full portrait generation in MVP.
									if (eventType === "portrait_unlocked" && sessionId) {
										await offerPortraitJob({ sessionId, userId });
										logger.info("Polar webhook: queued portrait generation", {
											sessionId,
											userId,
											assessmentResultId,
										});
									}

									if (eventType === "extended_conversation_unlocked") {
										logger.info(
											"Polar webhook: recorded extension purchase while extension remains disabled in MVP",
											{
												userId,
												assessmentResultId,
											},
										);
									}

									logger.info("Polar webhook: purchase event recorded", {
										userId,
										productId,
										eventType,
										assessmentResultId,
									});
								} catch (error) {
									const msg = error instanceof Error ? error.message : String(error);
									logger.error(`Polar webhook: failed to record purchase event: ${msg}`);
								}
							},
						}),
						portal({
							returnUrl: `${config.frontendUrl}/me`,
						}),
					],
				}),
			],

			trustedOrigins: [
				"http://localhost:3000",
				"http://localhost:3001",
				"http://127.0.0.1:3001",
				"http://localhost:4000",
				config.frontendUrl,
			].filter(Boolean) as string[],

			emailAndPassword: {
				enabled: true,
				requireEmailVerification: true,

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

				// Fire-and-forget password reset email via Resend (Story 31-7b)
				// Avoid awaiting to prevent timing attacks (Better Auth docs recommendation)
				sendResetPassword: async ({ user, url }) => {
					void resend.emails
						.send({
							from: emailFrom,
							to: user.email,
							subject: "Reset your password \u2014 big ocean",
							html: renderPasswordResetEmail({
								userName: user.name || "",
								resetUrl: url,
							}),
						})
						.catch((e: unknown) => {
							const msg = e instanceof Error ? e.message : String(e);
							logger.error(`Failed to send password reset email to ${user.email}: ${msg}`);
						});
				},
			},

			// Email verification via Resend (Story 31-7b)
			emailVerification: {
				sendOnSignUp: true,
				sendOnSignIn: true,
				autoSignInAfterVerification: true,
				sendVerificationEmail: async ({ user, url }) => {
					logger.info(`Sending verification email to ${user.email} with URL: ${url}`);
					try {
						const result = await resend.emails.send({
							from: emailFrom,
							to: user.email,
							subject: "Verify your email \u2014 big ocean",
							html: renderEmailVerificationEmail({
								userName: user.name || "",
								verifyUrl: url,
							}),
						});
						logger.info(`Verification email result for ${user.email}: ${JSON.stringify(result)}`);
					} catch (e: unknown) {
						const msg = e instanceof Error ? e.message : String(e);
						logger.error(`Failed to send verification email to ${user.email}: ${msg}`);
					}
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
					// HTTPS deployments (prod) host front and api on different hostnames
					// (e.g. front-*.up.railway.app vs api-*.up.railway.app), so the session
					// cookie has to ride cross-site fetches. SameSite=None requires Secure,
					// which we already have under HTTPS. Local dev keeps SameSite=Lax since
					// front+api share localhost and we can't set Secure over plain HTTP.
					sameSite: isHttps ? ("none" as const) : ("lax" as const),
				},
				useSecureCookies: isHttps,
			},

			databaseHooks: {
				user: {
					create: {
						before: async (user) => {
							// Fix stale Polar customers whose externalId points to a user that
							// no longer exists in our DB (e.g. previously deleted account).
							// The Polar plugin's onAfterUserCreate will fail if it tries to
							// update an externalId that is already set — Polar rejects this.
							// We detect the stale state here and delete + recreate the Polar
							// customer (without externalId) so the after-hook succeeds.
							if (!polarToken || polarToken === "not-configured" || polarToken.length === 0) {
								return { data: user };
							}
							try {
								const email =
									typeof user === "object" && user !== null && "email" in user
										? (user as { email?: string }).email
										: undefined;
								if (!email) return { data: user };

								const { result: existing } = await polarClient.customers.list({ email });
								const customer = existing.items[0];
								if (!customer?.externalId) return { data: user };

								// Only recycle if the externalId points to a user that no longer exists
								const [dbUser] = await plainDb
									.select({ id: authSchema.user.id })
									.from(authSchema.user)
									.where(eq(authSchema.user.id, customer.externalId))
									.limit(1);

								if (!dbUser) {
									await polarClient.customers.delete({ id: customer.id });
									await polarClient.customers.create({
										email,
										name: (user as { name?: string }).name ?? "",
									});
									logger.info(
										`Recycled stale Polar customer for ${email} (old externalId: ${customer.externalId})`,
									);
								}
							} catch (error) {
								const msg = error instanceof Error ? error.message : String(error);
								logger.error(`Failed to recycle stale Polar customer: ${msg}`);
								// Don't block signup — Polar after-hook will surface its own error
							}
							return { data: user };
						},
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
						},
					},
				},
			},
		});

		return auth as unknown as BetterAuthInstance;
	}),
);
