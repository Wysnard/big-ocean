import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, Unauthorized } from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

const LocalDateString = S.String.pipe(S.pattern(/^\d{4}-\d{2}-\d{2}$/));
const WeekIdString = S.String.pipe(S.pattern(/^\d{4}-W\d{2}$/));

export const CheckInPayloadSchema = S.Struct({
	localDate: LocalDateString,
	mood: S.Literal("great", "good", "okay", "uneasy", "rough"),
	note: S.optional(S.NullishOr(S.String)),
	visibility: S.optional(S.Literal("private", "inner_circle", "public_pulse")),
});

export const CheckInResponseSchema = S.Struct({
	id: S.String,
	localDate: S.String,
	mood: S.Literal("great", "good", "okay", "uneasy", "rough"),
	note: S.NullishOr(S.String),
	visibility: S.Literal("private", "inner_circle", "public_pulse"),
});

export const CheckInNotFoundResponseSchema = S.Struct({
	found: S.Literal(false),
});

export const WeekGridResponseSchema = S.Struct({
	weekId: S.String,
	days: S.Array(
		S.Struct({
			localDate: S.String,
			checkIn: S.NullishOr(CheckInResponseSchema),
		}),
	),
});

export const TodayGroup = HttpApiGroup.make("today")
	.add(
		HttpApiEndpoint.post("submitCheckIn", "/check-in")
			.setPayload(CheckInPayloadSchema)
			.addSuccess(CheckInResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getCheckIn", "/check-in")
			.setUrlParams(S.Struct({ localDate: LocalDateString }))
			.addSuccess(S.Union(CheckInResponseSchema, CheckInNotFoundResponseSchema))
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getWeekGrid", "/week")
			.setUrlParams(S.Struct({ weekId: WeekIdString }))
			.addSuccess(WeekGridResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/today");

export type CheckInPayload = typeof CheckInPayloadSchema.Type;
export type CheckInResponse = typeof CheckInResponseSchema.Type;
export type CheckInNotFoundResponse = typeof CheckInNotFoundResponseSchema.Type;
export type WeekGridResponse = typeof WeekGridResponseSchema.Type;
