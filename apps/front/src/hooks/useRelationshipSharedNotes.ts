/**
 * Relationship shared notes (Story 7.3 — Section D1)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RelationshipSharedNoteItem } from "@workspace/contracts/http/groups/relationship";
import { Effect } from "effect";
import { makeApiClient } from "@/lib/api-client";

export function useRelationshipSharedNotes(analysisId: string, enabled: boolean) {
	return useQuery<ReadonlyArray<RelationshipSharedNoteItem>>({
		queryKey: ["relationship", "shared-notes", analysisId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.listRelationshipSharedNotes({
					path: { analysisId },
				});
			}).pipe(Effect.runPromise),
		enabled: enabled && !!analysisId,
		staleTime: 30_000,
	});
}

export function useCreateRelationshipSharedNote(analysisId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["relationship", "shared-notes", analysisId, "create"],
		mutationFn: (body: string) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.createRelationshipSharedNote({
					path: { analysisId },
					payload: { body },
				});
			}).pipe(Effect.runPromise),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ["relationship", "shared-notes", analysisId],
			});
		},
	});
}
