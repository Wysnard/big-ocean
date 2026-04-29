import {
	createFileRoute,
	isNotFound,
	isRedirect,
	Link,
	notFound,
	redirect,
} from "@tanstack/react-router";
import { OceanSpinner } from "@workspace/ui/components/ocean-spinner";
import { DateTime, Effect, Schema as S } from "effect";
import { useCallback, useState } from "react";
import { NotFound } from "@/components/NotFound";
import { PageMain } from "@/components/PageMain";
import { TherapistChat } from "@/components/TherapistChat";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { useAuth } from "@/hooks/use-auth";
import { makeApiClient } from "@/lib/api-client";
import { getSession } from "@/lib/auth-client";

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
	waitlist: S.optional(BooleanFromSearch),
	/** Story 11-1 — cost circuit breaker / cost guard hold (distinct from global-assessment waitlist). */
	serviceBusy: S.optional(BooleanFromSearch),
	/** Epoch ms when the user may retry (from server `resumeAfter`). */
	resumeAt: S.optional(S.Union(S.Number, S.NumberFromString)),
	highlightMessageId: S.optional(S.String),
	highlightQuote: S.optional(S.String),
	highlightStart: S.optional(S.Number),
	highlightEnd: S.optional(S.Number),
	highlightScore: S.optional(S.Number),
});

export const Route = createFileRoute("/chat/")({
	ssr: false,
	validateSearch: (search) => S.decodeUnknownSync(ChatSearchParams)(search),
	notFoundComponent: () => (
		<PageMain className="bg-background">
			<NotFound
				title="Session not found"
				description="This conversation doesn't exist or doesn't belong to your account."
			/>
		</PageMain>
	),
	beforeLoad: async (context) => {
		const { search } = context;

		// Redirect unauthenticated users to sign-in
		const { data: sessionData } = await getSession();
		if (!sessionData?.user) {
			throw redirect({ to: "/login", search: { redirectTo: undefined } });
		}

		if (!search.sessionId && !search.waitlist && !search.serviceBusy) {
			const result = await Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.start({ payload: {} });
			}).pipe(
				Effect.catchTag("GlobalAssessmentLimitReached", () =>
					Effect.succeed({ _tag: "waitlist" as const }),
				),
				Effect.catchTag("RateLimitExceeded", () => Effect.succeed({ _tag: "waitlist" as const })),
				Effect.catchTag("CostLimitExceeded", (e) =>
					Effect.succeed(
						e.reason === "circuit_breaker"
							? {
									_tag: "serviceBusy" as const,
									resumeAt: DateTime.toDateUtc(e.resumeAfter).getTime(),
								}
							: { _tag: "waitlist" as const },
					),
				),
				Effect.catchTag("ConversationAlreadyExists", (e) =>
					// Story 31-5: The listSessions check below will redirect completed sessions to results
					Effect.succeed({ _tag: "existing" as const, sessionId: e.existingSessionId }),
				),
				Effect.runPromise,
			);

			if ("_tag" in result && result._tag === "waitlist") {
				throw redirect({ to: "/chat", search: { waitlist: true } });
			}
			if ("_tag" in result && result._tag === "serviceBusy") {
				throw redirect({
					to: "/chat",
					search: { serviceBusy: true, resumeAt: result.resumeAt },
				});
			}
			if ("_tag" in result && result._tag === "existing") {
				throw redirect({ to: "/chat", search: { sessionId: result.sessionId } });
			}

			throw redirect({
				to: "/chat",
				search: { sessionId: result.sessionId },
			});
		}

		// Verify the requested session belongs to the authenticated account.
		// If not, redirect to the user's real session when one exists.
		if (search.sessionId) {
			try {
				const data = await Effect.gen(function* () {
					const client = yield* makeApiClient;
					return yield* client.conversation.listSessions();
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
		waitlist,
		serviceBusy,
		resumeAt,
		highlightMessageId,
		highlightQuote,
		highlightStart,
		highlightEnd,
		highlightScore,
	} = Route.useSearch();
	const { user, isAuthenticated } = useAuth();
	const [sessionNotFound, setSessionNotFound] = useState(false);

	// Authenticated users hitting a missing session → show NotFound
	const handleSessionError = useCallback(
		(_error: { type: "not-found" | "session"; isResumeError: boolean }) => {
			setSessionNotFound(true);
		},
		[],
	);

	if (sessionNotFound) {
		return (
			<PageMain className="bg-background">
				<NotFound
					title="Assessment not found"
					description={`The assessment session ${sessionId} doesn't exist or you don't have access to it.`}
				/>
			</PageMain>
		);
	}

	// Story 15.3: Global assessment limit — show waitlist form
	if (waitlist) {
		return (
			<PageMain title="Assessment waitlist" className="bg-background">
				<WaitlistForm />
			</PageMain>
		);
	}

	// Story 11-1: Cost guard / free-tier LLM pause — distinct copy from waitlist
	if (serviceBusy) {
		const resumeLabel =
			typeof resumeAt === "number" && !Number.isNaN(resumeAt)
				? new Date(resumeAt).toLocaleString(undefined, {
						dateStyle: "medium",
						timeStyle: "short",
					})
				: "in a few minutes";
		return (
			<PageMain title="Temporarily unavailable" className="bg-background max-w-md mx-auto px-4 py-8">
				<p className="text-foreground mb-2">
					Nerin is temporarily unavailable while we catch our breath. This usually clears quickly.
				</p>
				<p className="text-muted-foreground text-sm mb-6">
					You can try again after <span className="font-medium text-foreground">{resumeLabel}</span>.
				</p>
				<Link
					to="/chat"
					search={{
						sessionId: undefined,
						waitlist: undefined,
						serviceBusy: undefined,
						resumeAt: undefined,
					}}
					className="text-primary underline underline-offset-4 text-sm"
				>
					Try starting your assessment again
				</Link>
			</PageMain>
		);
	}

	if (!sessionId) {
		return (
			<PageMain
				title="Creating assessment conversation"
				className="h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-background"
			>
				<div className="text-center">
					<OceanSpinner size={48} className="mx-auto mb-4" />
					<p className="text-muted-foreground">Creating assessment session...</p>
				</div>
			</PageMain>
		);
	}

	return (
		<PageMain title="Conversation with Nerin" className="bg-background">
			<TherapistChat
				sessionId={sessionId}
				onSessionError={handleSessionError}
				userName={user?.name}
				userImage={user?.image}
				isAuthenticated={isAuthenticated}
				highlightMessageId={highlightMessageId}
				highlightQuote={highlightQuote}
				highlightStart={highlightStart}
				highlightEnd={highlightEnd}
				highlightScore={highlightScore}
			/>
		</PageMain>
	);
}
