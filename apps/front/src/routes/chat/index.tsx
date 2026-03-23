import {
	createFileRoute,
	isNotFound,
	isRedirect,
	notFound,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { Effect, Schema as S } from "effect";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { NotFound } from "@/components/NotFound";
import { TherapistChat } from "@/components/TherapistChat";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { useAuth } from "@/hooks/use-auth";
import { makeApiClient } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";
import {
	clearPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

// URL search params arrive as strings; accept both "true"/"false" and native booleans
const BooleanFromSearch = S.Union(
	S.Boolean,
	S.transform(S.Literal("true", "false"), S.Boolean, {
		decode: (s) => s === "true",
		encode: (b) => (b ? ("true" as const) : ("false" as const)),
	}),
);

const ChatSearchParams = S.Struct({
	sessionId: S.optional(S.String),
	expired: S.optional(BooleanFromSearch),
	waitlist: S.optional(BooleanFromSearch),
	highlightMessageId: S.optional(S.String),
	highlightQuote: S.optional(S.String),
	highlightStart: S.optional(S.Number),
	highlightEnd: S.optional(S.Number),
	highlightScore: S.optional(S.Number),
});

export const Route = createFileRoute("/chat/")({
	ssr: false,
	validateSearch: (search) => S.decodeUnknownSync(ChatSearchParams)(search),
	beforeLoad: async (context) => {
		const { search } = context;

		// Redirect unauthenticated users to sign-in
		const { data: sessionData } = await getSession();
		if (!sessionData?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}

		if (!search.sessionId && !search.waitlist && !search.expired) {
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

			const result = await Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.start({ payload: {} });
			}).pipe(
				Effect.catchTag("GlobalAssessmentLimitReached", () =>
					Effect.succeed({ _tag: "waitlist" as const }),
				),
				Effect.catchTag("AssessmentAlreadyExists", (e) =>
					// Story 31-5: The listSessions check below will redirect completed sessions to results
					Effect.succeed({ _tag: "existing" as const, sessionId: e.existingSessionId }),
				),
				Effect.runPromise,
			);

			if ("_tag" in result && result._tag === "waitlist") {
				throw redirect({ to: "/chat", search: { waitlist: true } });
			}
			if ("_tag" in result && result._tag === "existing") {
				throw redirect({ to: "/chat", search: { sessionId: result.sessionId } });
			}

			throw redirect({
				to: "/chat",
				search: { sessionId: result.sessionId },
			});
		}

		// Story 9.4: Verify session ownership after anonymous-to-authenticated transition.
		// When an authenticated user navigates here with a sessionId (e.g., post-auth redirect
		// from ChatAuthGate), verify the session was actually linked to their account.
		// If not (conflict — user already had a different session), redirect to their real session.
		if (search.sessionId) {
			try {
				const data = await Effect.gen(function* () {
					const client = yield* makeApiClient;
					return yield* client.assessment.listSessions();
				}).pipe(Effect.runPromise);

				const linked = data.sessions.some((s) => s.id === search.sessionId);
				if (!linked) {
					if (data.sessions.length > 0) {
						throw redirect({
							to: "/chat",
							search: { sessionId: data.sessions[0].id },
						});
					}
					throw notFound();
				}
			} catch (e) {
				if (isRedirect(e)) throw e;
				if (isNotFound(e)) throw e;
				// Fail-open: if ownership check fails (network error, API down), allow through.
				// The session itself validates ownership server-side on each message send.
				console.warn("[chat/beforeLoad] Session ownership check failed, allowing through:", e);
			}
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const {
		sessionId,
		expired,
		waitlist,
		highlightMessageId,
		highlightQuote,
		highlightStart,
		highlightEnd,
		highlightScore,
	} = Route.useSearch();
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const [sessionNotFound, setSessionNotFound] = useState(false);

	// Session error handling — render NotFound or redirect based on auth status
	// Authenticated users hitting a missing session → show NotFound (private session denied)
	// Unauthenticated users → /chat for recovery (start fresh)
	const handleSessionError = useCallback(
		(_error: { type: "not-found" | "session"; isResumeError: boolean }) => {
			if (isAuthenticated) {
				setSessionNotFound(true);
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

	if (sessionNotFound) {
		return (
			<NotFound
				title="Assessment not found"
				description={`The assessment session ${sessionId} doesn't exist or you don't have access to it.`}
			/>
		);
	}

	// Story 15.3: Circuit breaker active — show waitlist form
	if (waitlist) {
		return <WaitlistForm />;
	}

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
