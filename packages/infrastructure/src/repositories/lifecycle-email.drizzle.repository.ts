import { DatabaseError } from "@workspace/contracts";
import { LifecycleEmailRepository } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import {
	session as authSession,
	conversation,
	purchaseEvents,
	relationshipAnalyses,
	user,
} from "../db/drizzle/schema";

export const LifecycleEmailDrizzleRepositoryLive = Layer.effect(
	LifecycleEmailRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return LifecycleEmailRepository.of({
			findSubscriptionNudgeEligibleUsers: (thresholdDays: number) =>
				Effect.gen(function* () {
					const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

					const completedConversationActivity = db
						.select({
							userId: conversation.userId,
							lastCompletedAt: sql<Date>`max(${conversation.updatedAt})`.as("last_completed_at"),
						})
						.from(conversation)
						.where(and(sql`${conversation.userId} IS NOT NULL`, eq(conversation.status, "completed")))
						.groupBy(conversation.userId)
						.as("completed_conversation_activity");

					const authSessionCounts = db
						.select({
							userId: authSession.userId,
							returnVisitCount: sql<number>`count(distinct ${authSession.id})`.as("return_visit_count"),
						})
						.from(authSession)
						.groupBy(authSession.userId)
						.as("auth_session_counts");

					const relationshipLetterCounts = db
						.select({
							userId: user.id,
							relationshipLetterCount: sql<number>`count(distinct ${relationshipAnalyses.id})`.as(
								"relationship_letter_count",
							),
						})
						.from(user)
						.leftJoin(
							relationshipAnalyses,
							or(eq(relationshipAnalyses.userAId, user.id), eq(relationshipAnalyses.userBId, user.id)),
						)
						.groupBy(user.id)
						.as("relationship_letter_counts");

					const entitlementCounts = db
						.select({
							userId: purchaseEvents.userId,
							unlockCount:
								sql<number>`sum(case when ${purchaseEvents.eventType} = 'extended_conversation_unlocked' then 1 else 0 end)`.as(
									"unlock_count",
								),
							refundCount:
								sql<number>`sum(case when ${purchaseEvents.eventType} = 'extended_conversation_refunded' then 1 else 0 end)`.as(
									"refund_count",
								),
						})
						.from(purchaseEvents)
						.where(sql`${purchaseEvents.userId} IS NOT NULL`)
						.groupBy(purchaseEvents.userId)
						.as("entitlement_counts");

					const results = yield* db
						.select({
							userId: user.id,
							userEmail: user.email,
							userName: user.name,
							returnVisitCount: sql<number>`coalesce(${authSessionCounts.returnVisitCount}, 0)`.as(
								"return_visit_count",
							),
							relationshipLetterCount:
								sql<number>`coalesce(${relationshipLetterCounts.relationshipLetterCount}, 0)`.as(
									"relationship_letter_count",
								),
						})
						.from(user)
						.innerJoin(completedConversationActivity, eq(completedConversationActivity.userId, user.id))
						.leftJoin(authSessionCounts, eq(authSessionCounts.userId, user.id))
						.leftJoin(relationshipLetterCounts, eq(relationshipLetterCounts.userId, user.id))
						.leftJoin(entitlementCounts, eq(entitlementCounts.userId, user.id))
						.where(
							and(
								lt(completedConversationActivity.lastCompletedAt, cutoff),
								isNull(user.subscriptionNudgeEmailSentAt),
								sql`(
									coalesce(${authSessionCounts.returnVisitCount}, 0) >= 3
									or coalesce(${relationshipLetterCounts.relationshipLetterCount}, 0) >= 1
								)`,
								sql`coalesce(${entitlementCounts.unlockCount}, 0) <= coalesce(${entitlementCounts.refundCount}, 0)`,
							),
						)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findSubscriptionNudgeEligibleUsers",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({
									message: "Failed to find subscription nudge eligible users",
								});
							}),
						);

					return results.map((row) => ({
						userId: row.userId,
						userEmail: row.userEmail,
						userName: row.userName,
						returnVisitCount: row.returnVisitCount,
						relationshipLetterCount: row.relationshipLetterCount,
					}));
				}),

			markSubscriptionNudgeEmailSent: (userId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(user)
						.set({ subscriptionNudgeEmailSentAt: new Date() })
						.where(and(eq(user.id, userId), isNull(user.subscriptionNudgeEmailSentAt)))
						.returning({ id: user.id })
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "markSubscriptionNudgeEmailSent",
										userId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({
									message: "Failed to mark subscription nudge email sent",
								});
							}),
						);

					if (rows.length === 0) {
						return yield* Effect.fail(
							new DatabaseError({
								message: "Subscription nudge already marked (concurrent run or duplicate)",
							}),
						);
					}
				}),
		});
	}),
);
