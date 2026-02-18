import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Schema as S } from "effect";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { TherapistChat } from "@/components/TherapistChat";
import { useAuth } from "@/hooks/use-auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ChatSearchParams = S.Struct({
	sessionId: S.optional(S.String),
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
	},
	component: RouteComponent,
});

function RouteComponent() {
	const {
		sessionId,
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
			highlightMessageId={highlightMessageId}
			highlightQuote={highlightQuote}
			highlightStart={highlightStart}
			highlightEnd={highlightEnd}
			highlightScore={highlightScore}
		/>
	);
}
