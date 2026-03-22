/**
 * Ritual Suggestion Route (Story 35-1)
 *
 * Route: /relationship/$analysisId/ritual
 *
 * Auth-gated route that displays the ritual suggestion screen
 * before users view their relationship analysis. Both users see
 * this independently after QR acceptance. Participant names are
 * fetched from the analysis endpoint.
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { RelationshipAnalysisResponse } from "@workspace/contracts/http/groups/relationship";
import { Effect } from "effect";
import { useCallback } from "react";
import { RitualScreen } from "@/components/relationship/RitualScreen";
import { makeApiClient } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/relationship/$analysisId_/ritual")({
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { sessionId: undefined, redirectTo: undefined },
			});
		}
	},
	component: RitualRoute,
});

function RitualRoute() {
	const { analysisId } = Route.useParams();
	const navigate = useNavigate();

	const { data } = useQuery<RelationshipAnalysisResponse>({
		queryKey: ["relationship", "analysis", analysisId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.getRelationshipAnalysis({ path: { analysisId } });
			}).pipe(Effect.runPromise),
		staleTime: 5 * 60 * 1000,
	});

	const handleStart = useCallback(() => {
		void navigate({
			to: "/relationship/$analysisId",
			params: { analysisId },
		});
	}, [navigate, analysisId]);

	return (
		<RitualScreen userAName={data?.userAName} userBName={data?.userBName} onStart={handleStart} />
	);
}
