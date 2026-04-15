/**
 * Weekly letter reading (Story 5.2) — typed HttpApiClient + TanStack Query.
 */

import { queryOptions, useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

export class WeeklyLetterApiError extends Error {
	readonly status: number;
	readonly details: unknown;

	constructor(status: number, message: string, details: unknown) {
		super(message);
		this.name = "WeeklyLetterApiError";
		this.status = status;
		this.details = details;
	}
}

export const isWeeklyLetterApiError = (error: unknown): error is WeeklyLetterApiError =>
	error instanceof WeeklyLetterApiError;

export const weeklyLetterQueryKey = (weekId: string) => ["today", "weekly-letter", weekId] as const;

export function fetchWeeklyLetter(weekId: string) {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.today.getWeeklyLetter({ path: { weekId } });
	})
		.pipe(Effect.runPromise)
		.catch((e: unknown) => {
			const str = String(e);
			const msg = e instanceof Error ? e.message : str;
			const status = str.includes("WeeklyLetterNotFound")
				? 404
				: str.includes("Unauthorized")
					? 401
					: 500;
			throw new WeeklyLetterApiError(status, msg, e);
		});
}

export function getWeeklyLetterQueryOptions(weekId: string) {
	return queryOptions({
		queryKey: weeklyLetterQueryKey(weekId),
		queryFn: () => fetchWeeklyLetter(weekId),
		staleTime: 2 * 60 * 1000,
	});
}

export function useWeeklyLetter(weekId: string, enabled = true) {
	return useQuery({
		...getWeeklyLetterQueryOptions(weekId),
		enabled: enabled && !!weekId,
	});
}
