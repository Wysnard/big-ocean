/**
 * Finalization Wait Screen Route (Story 11.1)
 *
 * Shows progress while assessment results are being generated.
 * On mount: POST /generate-results, then polls GET /finalization-status every 2s.
 * On completion: navigates to /results/$sessionId.
 */

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FinalizationWaitScreen } from "@/components/finalization-wait-screen";
import { useFinalizationStatus } from "@/hooks/useFinalizationStatus";
import { useGenerateResults } from "@/hooks/useGenerateResults";
import { getSession } from "@/lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const Route = createFileRoute("/finalize/$assessmentSessionId")({
	beforeLoad: async ({ params }) => {
		const { data: session } = await getSession();

		// Must be authenticated to view finalization
		if (!session?.user) {
			throw redirect({ to: "/chat" });
		}

		// Verify session ownership and status
		try {
			const res = await fetch(`${API_URL}/api/assessment/sessions`, {
				credentials: "include",
			});
			if (res.ok) {
				const data = await res.json();
				const currentSession = data.sessions?.find(
					(s: { id: string }) => s.id === params.assessmentSessionId,
				);

				if (!currentSession) {
					throw redirect({ to: "/chat" });
				}

				// Guard: active/paused sessions should be on /chat, not the wait screen
				if (currentSession.status === "active" || currentSession.status === "paused") {
					throw redirect({
						to: "/chat",
						search: { sessionId: params.assessmentSessionId },
					});
				}

				// If already completed, go straight to results
				if (currentSession.status === "completed") {
					throw redirect({
						to: "/results/$assessmentSessionId",
						params: { assessmentSessionId: params.assessmentSessionId },
					});
				}
			}
		} catch (e) {
			if (e instanceof Response || (e && typeof e === "object" && "to" in e)) throw e;
			// Fail-open
			console.warn("[finalize/beforeLoad] Session check failed:", e);
		}
	},
	component: FinalizeRouteComponent,
});

function FinalizeRouteComponent() {
	const { assessmentSessionId } = Route.useParams();
	const navigate = useNavigate();

	const { mutate: triggerGenerate } = useGenerateResults();
	const { data: statusData, error: statusError } = useFinalizationStatus(assessmentSessionId);

	// Trigger generate-results on mount
	useEffect(() => {
		triggerGenerate(
			{ sessionId: assessmentSessionId },
			{
				onError: (err) => {
					// SessionNotFinalizing (409) or SessionNotFound (404) — redirect appropriately
					if (err.message.includes("409") || err.message.includes("404")) {
						navigate({
							to: "/results/$assessmentSessionId",
							params: { assessmentSessionId },
						});
					} else if (err.message.includes("401")) {
						navigate({ to: "/chat" });
					}
				},
			},
		);
	}, [assessmentSessionId, triggerGenerate, navigate]);

	// Redirect on polling errors (e.g., 401, 404, 500) instead of spinning forever
	useEffect(() => {
		if (statusError) {
			navigate({
				to: "/chat",
			});
		}
	}, [statusError, navigate]);

	// Navigate to results when completed
	useEffect(() => {
		if (statusData?.status === "completed") {
			navigate({
				to: "/results/$assessmentSessionId",
				params: { assessmentSessionId },
			});
		}
	}, [statusData?.status, assessmentSessionId, navigate]);

	return (
		<FinalizationWaitScreen
			status={statusData?.status ?? "analyzing"}
			progress={statusData?.progress ?? 0}
		/>
	);
}
