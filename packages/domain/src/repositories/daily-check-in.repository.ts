import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export type DailyCheckInMood = "great" | "good" | "okay" | "uneasy" | "rough";
export type DailyCheckInVisibility = "private" | "inner_circle" | "public_pulse";

export interface UpsertDailyCheckIn {
	readonly userId: string;
	readonly localDate: string;
	readonly mood: DailyCheckInMood;
	readonly note?: string | null;
	readonly visibility: DailyCheckInVisibility;
}

export interface DailyCheckIn {
	readonly id: string;
	readonly userId: string;
	readonly localDate: string;
	readonly mood: DailyCheckInMood;
	readonly note: string | null;
	readonly visibility: DailyCheckInVisibility;
	readonly createdAt: Date;
}

export class DailyCheckInRepository extends Context.Tag("DailyCheckInRepository")<
	DailyCheckInRepository,
	{
		readonly upsert: (input: UpsertDailyCheckIn) => Effect.Effect<DailyCheckIn, DatabaseError>;
		readonly getByDate: (
			userId: string,
			localDate: string,
		) => Effect.Effect<DailyCheckIn | null, DatabaseError>;
		readonly listForWeek: (
			userId: string,
			weekStartLocal: string,
			weekEndLocal: string,
		) => Effect.Effect<DailyCheckIn[], DatabaseError>;
		readonly listForMonth: (
			userId: string,
			monthStartLocal: string,
			monthEndLocal: string,
		) => Effect.Effect<DailyCheckIn[], DatabaseError>;
	}
>() {}
