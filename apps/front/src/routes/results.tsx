/**
 * Results Route Shell
 *
 * Canonical behavior:
 * - /results?sessionId=... -> /results/$sessionId
 * - /results -> attempts 24h local resume from localStorage
 */

import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	clearPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

export const Route = createFileRoute("/results")({
	validateSearch: (search: Record<string, unknown>) => {
		return {
			sessionId: (search.sessionId as string) || "",
			scrollToFacet: (search.scrollToFacet as string) || undefined,
		};
	},
	beforeLoad: ({ search }) => {
		if (search.sessionId) {
			throw redirect({
				to: "/results/$sessionId",
				params: { sessionId: search.sessionId },
				search: { scrollToFacet: search.scrollToFacet },
				replace: true,
			});
		}
	},
	component: ResultsRouteShell,
});

function ResultsRouteShell() {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const [entryState, setEntryState] = useState<"checking" | "none" | "expired">("checking");

	const isResultsIndex = pathname === "/results" || pathname === "/results/";

	useEffect(() => {
		if (!isResultsIndex) {
			return;
		}

		const pending = readPendingResultsGateSession();
		if (pending && !pending.expired) {
			void navigate({
				to: "/results/$sessionId",
				params: { sessionId: pending.sessionId },
				replace: true,
			});
			return;
		}

		if (pending?.expired) {
			setEntryState("expired");
			return;
		}

		setEntryState("none");
	}, [isResultsIndex, navigate]);

	if (!isResultsIndex) {
		return <Outlet />;
	}

	if (entryState === "checking") {
		return (
			<div className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6">
				<div className="text-center">
					<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary mx-auto mb-3" />
					<p className="text-sm text-muted-foreground">Checking for your pending results...</p>
				</div>
			</div>
		);
	}

	if (entryState === "expired") {
		return (
			<div className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6">
				<div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
					<h1 className="font-heading text-2xl text-foreground">Your previous results unlock expired</h1>
					<p className="mt-2 text-muted-foreground">
						For privacy, gated result sessions are kept for 24 hours on this device.
					</p>
					<div className="mt-6 flex flex-col gap-3">
						<Button
							onClick={() => {
								clearPendingResultsGateSession();
								void navigate({ to: "/chat", search: { sessionId: undefined } });
							}}
							className="min-h-11"
						>
							Start New Assessment
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6">
			<div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
				<h1 className="font-heading text-2xl text-foreground">No Session Found</h1>
				<p className="mt-2 text-muted-foreground">
					Start an assessment to unlock your personality results.
				</p>
				<div className="mt-6">
					<Button
						onClick={() => navigate({ to: "/chat", search: { sessionId: undefined } })}
						className="min-h-11"
					>
						Start Assessment
					</Button>
				</div>
			</div>
		</div>
	);
}
