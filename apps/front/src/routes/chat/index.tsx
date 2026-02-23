import { createFileRoute, isRedirect, redirect, useNavigate } from "@tanstack/react-router";
import { Schema as S } from "effect";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { TherapistChat } from "@/components/TherapistChat";
import { useAuth } from "@/hooks/use-auth";
import { getSession } from "@/lib/auth-client";
import {
	clearPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ChatSearchParams = S.Struct({
	sessionId: S.optional(S.String),
	expired: S.optional(S.Boolean),
	highlightMessageId: S.optional(S.String),
	highlightQuote: S.optional(S.String),
	highlightStart: S.optional(S.Number),
	highlightEnd: S.optional(S.Number),
	highlightScore: S.optional(S.Number),
});

export const Route = createFileRoute("/chat/")({
	validateSearch: (search) => S.decodeUnknownSync(ChatSearchParams)(search),
	beforeLoad: async (context) => {
		const { search } = context;

		if (!search.sessionId) {
			// Story 7.18 AC #6: Recover pending session from localStorage (anonymous user returning)
			const pending = readPendingResultsGateSession();
			if (pending) {
				if (!pending.expired) {
					throw redirect({
						to: "/chat",
						search: { sessionId: pending.sessionId },
					});
				}
				// Expired session — show Nerin-themed message (Task 3.4)
				clearPendingResultsGateSession();
				throw redirect({
					to: "/chat",
					search: { expired: true },
				});
			}

			const response = await fetch(`${API_URL}/api/assessment/start`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: response.statusText }));

				// 409 = user already has an assessment — redirect to existing session
				if (response.status === 409 && error.existingSessionId) {
					throw redirect({
						to: "/chat",
						search: { sessionId: error.existingSessionId },
					});
				}

				throw new Error(error.message || `Failed to start assessment: ${response.status}`);
			}

			const data = await response.json();
			throw redirect({
				to: "/chat",
				search: { sessionId: data.sessionId },
			});
		}

		// Story 9.4: Verify session ownership after anonymous-to-authenticated transition.
		// When an authenticated user navigates here with a sessionId (e.g., post-auth redirect
		// from ChatAuthGate), verify the session was actually linked to their account.
		// If not (conflict — user already had a different session), redirect to their real session.
		const { data: session } = await getSession();
		if (session?.user && search.sessionId) {
			try {
				const res = await fetch(`${API_URL}/api/assessment/sessions`, {
					credentials: "include",
				});
				if (res.ok) {
					const data = await res.json();
					const linked = data.sessions?.some((s: { id: string }) => s.id === search.sessionId);
					if (!linked && data.sessions?.length > 0) {
						throw redirect({
							to: "/chat",
							search: { sessionId: data.sessions[0].id },
						});
					}
				}
			} catch (e) {
				if (isRedirect(e)) throw e;
			}
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const {
		sessionId,
		expired,
		highlightMessageId,
		highlightQuote,
		highlightStart,
		highlightEnd,
		highlightScore,
	} = Route.useSearch();
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	// Session error handling — redirect based on auth status
	// Authenticated users hitting a missing session → 404 (private session denied)
	// Unauthenticated users → /chat for recovery (start fresh)
	const handleSessionError = useCallback(
		(_error: { type: "not-found" | "session"; isResumeError: boolean }) => {
			if (isAuthenticated) {
				navigate({ to: "/404" });
			} else {
				navigate({ to: "/chat" });
			}
		},
		[isAuthenticated, navigate],
	);

	// Story 7.18: Navigate to portrait reading view when user clicks "Read what Nerin wrote"
	const handlePortraitReveal = useCallback(() => {
		if (sessionId) {
			navigate({
				to: "/results/$assessmentSessionId",
				params: { assessmentSessionId: sessionId },
				search: { view: "portrait" },
			});
		}
	}, [sessionId, navigate]);

	// Story 7.18 Task 3.4: Expired session — Nerin-themed message
	if (expired) {
		return (
			<div className="h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-background">
				<div className="text-center max-w-md px-6">
					<p className="text-lg text-foreground font-heading">This dive session has ended.</p>
					<p className="mt-2 text-muted-foreground">Sign up to start a new one.</p>
					<button
						type="button"
						onClick={() => navigate({ to: "/chat", search: {} })}
						className="mt-6 min-h-[48px] rounded-xl bg-foreground px-8 font-heading text-base font-bold text-background transition-all hover:bg-primary hover:shadow-lg"
					>
						Start a new dive
					</button>
				</div>
			</div>
		);
	}

	if (!sessionId) {
		return (
			<div className="h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-background">
				<div className="text-center">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
					<p className="text-muted-foreground">Creating assessment session...</p>
				</div>
			</div>
		);
	}

	return (
		<TherapistChat
			sessionId={sessionId}
			onSessionError={handleSessionError}
			userName={user?.name}
			userImage={user?.image}
			isAuthenticated={isAuthenticated}
			onPortraitReveal={handlePortraitReveal}
			highlightMessageId={highlightMessageId}
			highlightQuote={highlightQuote}
			highlightStart={highlightStart}
			highlightEnd={highlightEnd}
			highlightScore={highlightScore}
		/>
	);
}
