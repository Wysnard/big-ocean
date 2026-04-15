/**
 * Account HTTP API Group (Story 30-2)
 *
 * Defines account management endpoints.
 * Currently: account deletion with cascade cleanup.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { AccountNotFound, DatabaseError, Unauthorized } from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

/**
 * Delete Account Response Schema
 */
export const DeleteAccountResponseSchema = S.Struct({
	success: S.Boolean,
});

export const FirstVisitStateResponseSchema = S.Struct({
	firstVisitCompleted: S.Boolean,
});

const ISO_8601_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const IsoTimestampSchema = S.String.pipe(
	S.filter((value) => ISO_8601_UTC_RE.test(value) && !Number.isNaN(Date.parse(value)), {
		message: () =>
			"scheduledFor must be a valid ISO 8601 UTC timestamp (e.g. 2026-04-15T19:00:00.000Z)",
	}),
	S.filter((value) => Date.parse(value) > Date.now(), {
		message: () => "scheduledFor must be in the future",
	}),
);

export const PushSubscriptionPayloadSchema = S.Struct({
	endpoint: S.String.pipe(
		S.filter(
			(s) => {
				try {
					return new URL(s).protocol === "https:";
				} catch {
					return false;
				}
			},
			{ message: () => "endpoint must be a valid HTTPS URL" },
		),
	),
	keys: S.Struct({
		p256dh: S.String,
		auth: S.String,
	}),
});

export const RemovePushSubscriptionPayloadSchema = S.Struct({
	endpoint: S.optional(S.String),
});

export const PushSubscriptionResponseSchema = S.Struct({
	success: S.Boolean,
});

export const ScheduleFirstDailyPromptPayloadSchema = S.Struct({
	scheduledFor: IsoTimestampSchema,
});

export const ScheduleFirstDailyPromptResponseSchema = S.Struct({
	success: S.Boolean,
	scheduledFor: IsoTimestampSchema,
});

export const ConsumePushNotificationsResponseSchema = S.Struct({
	notifications: S.Array(
		S.Struct({
			id: S.String,
			title: S.String,
			body: S.String,
			url: S.String,
			tag: S.optional(S.String),
		}),
	),
});

/**
 * Account API Group
 *
 * Routes:
 * - GET /api/account/first-visit - Read authenticated user's first-visit flag
 * - POST /api/account/first-visit/complete - Mark first visit complete
 * - POST /api/account/daily-prompt/first-schedule - Persist the first daily prompt schedule
 * - DELETE /api/account - Delete authenticated user's account
 */
export const AccountGroup = HttpApiGroup.make("account")
	.add(
		HttpApiEndpoint.get("getFirstVisitState", "/first-visit")
			.addSuccess(FirstVisitStateResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("completeFirstVisit", "/first-visit/complete")
			.addSuccess(FirstVisitStateResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("scheduleFirstDailyPrompt", "/daily-prompt/first-schedule")
			.setPayload(ScheduleFirstDailyPromptPayloadSchema)
			.addSuccess(ScheduleFirstDailyPromptResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.del("deleteAccount", "/")
			.addSuccess(DeleteAccountResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("savePushSubscription", "/push-subscription")
			.setPayload(PushSubscriptionPayloadSchema)
			.addSuccess(PushSubscriptionResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("removePushSubscription", "/push-subscription/remove")
			.setPayload(RemovePushSubscriptionPayloadSchema)
			.addSuccess(PushSubscriptionResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("consumePushNotifications", "/push-notifications/consume")
			.addSuccess(ConsumePushNotificationsResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/account");

// Export TypeScript types for frontend use
export type DeleteAccountResponse = typeof DeleteAccountResponseSchema.Type;
export type FirstVisitStateResponse = typeof FirstVisitStateResponseSchema.Type;
export type ConsumePushNotificationsResponse = typeof ConsumePushNotificationsResponseSchema.Type;
export type PushSubscriptionPayload = typeof PushSubscriptionPayloadSchema.Type;
export type ScheduleFirstDailyPromptPayload = typeof ScheduleFirstDailyPromptPayloadSchema.Type;
