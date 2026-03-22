/**
 * Ritual Suggestion Route (Story 35-1)
 *
 * Route: /relationship/$analysisId/ritual
 *
 * Auth-gated route that displays the ritual suggestion screen
 * before users view their relationship analysis. Both users see
 * this independently after QR acceptance.
 */

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { RitualScreen } from "@/components/relationship/RitualScreen";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/relationship/$analysisId/ritual")({
	validateSearch: (search: Record<string, unknown>) => ({
		userAName: typeof search.userAName === "string" ? search.userAName : undefined,
		userBName: typeof search.userBName === "string" ? search.userBName : undefined,
	}),
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
	const { userAName, userBName } = Route.useSearch();
	const navigate = useNavigate();

	const handleStart = useCallback(() => {
		void navigate({
			to: "/relationship/$analysisId",
			params: { analysisId },
		});
	}, [navigate, analysisId]);

	return <RitualScreen userAName={userAName} userBName={userBName} onStart={handleStart} />;
}
