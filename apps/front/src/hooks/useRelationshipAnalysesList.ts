/**
 * Hook: useRelationshipAnalysesList (Story 35-4)
 *
 * Fetches all relationship analyses for the current user with version info.
 * Uses the typed Effect HttpApiClient per CLAUDE.md conventions.
 */

import { useQuery } from "@tanstack/react-query";
import type { RelationshipAnalysisListItem } from "@workspace/contracts/http/groups/relationship";
import { Effect } from "effect";
import { makeApiClient } from "@/lib/api-client";

export function useRelationshipAnalysesList(enabled: boolean) {
	return useQuery<ReadonlyArray<RelationshipAnalysisListItem>>({
		queryKey: ["relationship", "analyses", "list"],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.listRelationshipAnalyses();
			}).pipe(Effect.runPromise),
		staleTime: 30 * 1000,
		enabled,
	});
}
