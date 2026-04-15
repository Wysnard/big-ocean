import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "@/lib/api-client";

export const todayHasCheckInsQueryKey = ["today", "has-check-ins"] as const;

export function useHasCheckIns() {
	return useQuery({
		queryKey: todayHasCheckInsQueryKey,
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.today.getHasCheckIns({});
			}).pipe(Effect.runPromise),
	});
}
