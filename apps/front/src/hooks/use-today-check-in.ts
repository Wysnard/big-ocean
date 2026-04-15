import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	CheckInNotFoundResponse,
	CheckInPayload,
	CheckInResponse,
	WeekGridResponse,
} from "@workspace/contracts";
import { Effect } from "effect";
import { toast } from "sonner";
import { makeApiClient } from "@/lib/api-client";

const pad = (value: number) => String(value).padStart(2, "0");

const parseLocalDate = (localDate: string) => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
	if (!match) {
		throw new Error(`Invalid localDate: ${localDate}`);
	}

	return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

const toIsoWeekParts = (date: Date) => {
	const working = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const weekday = working.getUTCDay() || 7;

	working.setUTCDate(working.getUTCDate() + 4 - weekday);

	const yearStart = new Date(Date.UTC(working.getUTCFullYear(), 0, 1));
	const dayOfYear = Math.floor((working.getTime() - yearStart.getTime()) / 86_400_000) + 1;

	return {
		year: working.getUTCFullYear(),
		week: Math.ceil(dayOfYear / 7),
	};
};

const createOptimisticCheckIn = (payload: CheckInPayload): CheckInResponse => ({
	id: `optimistic-${payload.localDate}`,
	localDate: payload.localDate,
	mood: payload.mood,
	note: payload.note ?? null,
	visibility: payload.visibility ?? "private",
});

const updateWeekGrid = (
	weekGrid: WeekGridResponse | undefined,
	checkIn: CheckInResponse,
): WeekGridResponse | undefined => {
	if (!weekGrid) {
		return weekGrid;
	}

	return {
		...weekGrid,
		days: weekGrid.days.map((day) =>
			day.localDate === checkIn.localDate ? { ...day, checkIn } : day,
		),
	};
};

export const todayCheckInQueryKey = (localDate: string) =>
	["today", "check-in", localDate] as const;

export const todayWeekQueryKey = (weekId: string) => ["today", "week", weekId] as const;

export const getTodayLocalDate = (date = new Date()) =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getWeekIdForLocalDate = (localDate: string) => {
	const { year, week } = toIsoWeekParts(parseLocalDate(localDate));
	return `${year}-W${pad(week)}`;
};

export const hasCheckInRecord = (
	value: CheckInResponse | CheckInNotFoundResponse | undefined,
): value is CheckInResponse => Boolean(value && "id" in value);

export function useTodayCheckIn(localDate = getTodayLocalDate()) {
	const queryClient = useQueryClient();
	const weekId = getWeekIdForLocalDate(localDate);

	const todayQuery = useQuery({
		queryKey: todayCheckInQueryKey(localDate),
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.today.getCheckIn({
					urlParams: { localDate },
				});
			}).pipe(Effect.runPromise),
	});

	const weekQuery = useQuery({
		queryKey: todayWeekQueryKey(weekId),
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.today.getWeekGrid({
					urlParams: { weekId },
				});
			}).pipe(Effect.runPromise),
	});

	const submitCheckIn = useMutation({
		mutationKey: ["today", "submit-check-in"],
		mutationFn: (payload: CheckInPayload) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.today.submitCheckIn({ payload });
			}).pipe(Effect.runPromise),
		onMutate: async (payload) => {
			const payloadWeekId = getWeekIdForLocalDate(payload.localDate);
			const optimisticCheckIn = createOptimisticCheckIn(payload);

			await Promise.all([
				queryClient.cancelQueries({ queryKey: todayCheckInQueryKey(payload.localDate) }),
				queryClient.cancelQueries({ queryKey: todayWeekQueryKey(payloadWeekId) }),
			]);

			const previousToday = queryClient.getQueryData<CheckInResponse | CheckInNotFoundResponse>(
				todayCheckInQueryKey(payload.localDate),
			);
			const previousWeek = queryClient.getQueryData<WeekGridResponse>(
				todayWeekQueryKey(payloadWeekId),
			);

			queryClient.setQueryData(todayCheckInQueryKey(payload.localDate), optimisticCheckIn);
			queryClient.setQueryData(
				todayWeekQueryKey(payloadWeekId),
				(current: WeekGridResponse | undefined) => updateWeekGrid(current, optimisticCheckIn),
			);

			return {
				localDate: payload.localDate,
				weekId: payloadWeekId,
				previousToday,
				previousWeek,
			};
		},
		onError: (_error, _payload, context) => {
			if (context) {
				queryClient.setQueryData(todayCheckInQueryKey(context.localDate), context.previousToday);
				queryClient.setQueryData(todayWeekQueryKey(context.weekId), context.previousWeek);
			}

			toast.error("Couldn't save your check-in. Try again?");
		},
		onSuccess: (data, payload) => {
			const payloadWeekId = getWeekIdForLocalDate(payload.localDate);

			queryClient.setQueryData(todayCheckInQueryKey(payload.localDate), data);
			queryClient.setQueryData(
				todayWeekQueryKey(payloadWeekId),
				(current: WeekGridResponse | undefined) => updateWeekGrid(current, data),
			);
		},
		onSettled: (_data, _error, payload) => {
			if (!payload) {
				return;
			}

			const payloadWeekId = getWeekIdForLocalDate(payload.localDate);

			void queryClient.invalidateQueries({
				queryKey: todayCheckInQueryKey(payload.localDate),
			});
			void queryClient.invalidateQueries({
				queryKey: todayWeekQueryKey(payloadWeekId),
			});
		},
	});

	return {
		localDate,
		weekId,
		todayQuery,
		weekQuery,
		submitCheckIn,
	};
}
