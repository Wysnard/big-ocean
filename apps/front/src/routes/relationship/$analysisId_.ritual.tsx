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
import { PageMain } from "@/components/PageMain";
import { RitualScreen } from "@/components/relationship/RitualScreen";
import { makeApiClient } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import { markRelationshipLetterRitualSeen } from "@/lib/relationship-letter-ritual-storage";

export const Route = createFileRoute("/relationship/$analysisId_/ritual")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { redirectTo: undefined },
			});
		}
	},
	component: RitualRoute,
});

function RitualRoute() {
	const { analysisId } = Route.useParams();
	const navigate = useNavigate();

	const { data, isPending, isError } = useQuery<RelationshipAnalysisResponse>({
		queryKey: ["relationship", "analysis", analysisId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.getRelationshipAnalysis({
					path: { analysisId },
				});
			}).pipe(Effect.runPromise),
		staleTime: 5 * 60 * 1000,
	});

	const handleStart = useCallback(() => {
		markRelationshipLetterRitualSeen(analysisId);
		void navigate({
			to: "/relationship/$analysisId",
			params: { analysisId },
		});
	}, [navigate, analysisId]);

	if (isPending) {
		return (
			<PageMain className="min-h-screen bg-background" title="Relationship letter">
				<p className="sr-only" aria-live="polite">
					Loading…
				</p>
			</PageMain>
		);
	}

	if (isError || !data) {
		return (
			<PageMain className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
				<p className="text-center text-sm text-muted-foreground">
					This letter could not be loaded. Return to the letter from your home screen and try again.
				</p>
			</PageMain>
		);
	}

	return (
		<PageMain className="min-h-screen bg-background">
			<RitualScreen userAName={data.userAName} userBName={data.userBName} onStart={handleStart} />
		</PageMain>
	);
}
