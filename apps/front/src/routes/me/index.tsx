import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBanner } from "@/components/ErrorBanner";
import { MePageSection } from "@/components/me/MePageSection";
import { PageMain } from "@/components/PageMain";
import { completeFirstVisit } from "@/hooks/use-account";
import { listConversationsQueryOptions, useGetResults } from "@/hooks/use-conversation";
import { getSession } from "@/lib/auth-client";

type MeSectionSpec = {
	key: string;
	title: string;
	isConditional?: boolean;
	hidden?: boolean;
};

const ME_SECTION_SPECS: readonly MeSectionSpec[] = [
	{ key: "identity-hero", title: "Identity Hero" },
	{ key: "portrait", title: "Your Portrait" },
	{ key: "growth", title: "Your Growth", isConditional: true, hidden: true },
	{ key: "public-face", title: "Your Public Face" },
	{ key: "circle", title: "Your Circle" },
	{ key: "subscription", title: "Subscription" },
	{ key: "account", title: "Account" },
] as const;

const INCOMPLETE_SESSION_STATUSES = new Set(["active", "paused", "finalizing"]);

function getLatestCompletedSessionId(
	sessions: ReadonlyArray<{ id: string; status: string }>,
): string | null {
	return sessions.find((session) => session.status === "completed")?.id ?? null;
}

function getLatestIncompleteSessionId(
	sessions: ReadonlyArray<{ id: string; status: string }>,
): string | null {
	return sessions.find((session) => INCOMPLETE_SESSION_STATUSES.has(session.status))?.id ?? null;
}

export const Route = createFileRoute("/me/")({
	ssr: false,
	beforeLoad: async ({ context }) => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}

		const { sessions } = await context.queryClient.fetchQuery(listConversationsQueryOptions());
		const sessionId = getLatestCompletedSessionId(sessions);

		if (sessionId) {
			return { sessionId };
		}

		const activeSessionId = getLatestIncompleteSessionId(sessions);
		if (activeSessionId) {
			throw redirect({
				to: "/chat",
				search: { sessionId: activeSessionId },
			});
		}

		throw redirect({ to: "/chat" });
	},
	loader: ({ context }) => {
		const sessionId = (context as Record<string, unknown>).sessionId;
		if (typeof sessionId !== "string" || !sessionId) {
			throw redirect({ to: "/chat" });
		}
		return { sessionId };
	},
	component: MePage,
});

function MePage() {
	const { sessionId } = Route.useLoaderData();
	const { data: results, isLoading, error, refetch } = useGetResults(sessionId);
	const [isErrorVisible, setIsErrorVisible] = useState(true);

	useEffect(() => {
		void completeFirstVisit().catch((error) => {
			console.warn("Failed to mark first visit complete", error);
		});
	}, []);

	useEffect(() => {
		if (error) {
			setIsErrorVisible(true);
		}
	}, [error]);

	const errorMessage =
		error instanceof Error
			? error.message
			: "We couldn't load your latest assessment yet. Try again.";

	return (
		<PageMain
			title="Me"
			data-slot="me-page"
			data-testid="me-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
			<BottomNav />
			<div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6 lg:px-0">
				{error && isErrorVisible ? (
					<ErrorBanner
						message={errorMessage}
						onRetry={() => {
							void refetch().then((result) => {
								setIsErrorVisible(!!result.error);
							});
						}}
						onDismiss={() => setIsErrorVisible(false)}
						autoDismissMs={0}
					/>
				) : null}

				{isLoading ? <MePageSkeleton /> : <MePageSections results={results} />}
			</div>
		</PageMain>
	);
}

function MePageSkeleton() {
	return (
		<div className="space-y-10">
			{ME_SECTION_SPECS.map((section) => (
				<MePageSection
					key={section.key}
					title={section.title}
					isConditional={section.isConditional}
					data-slot={`me-section-${section.key}`}
					data-testid={`me-section-${section.key}`}
					hidden={section.hidden}
					{...(section.hidden ? { "data-state": "hidden" } : {})}
					aria-busy="true"
				>
					<div className="animate-pulse space-y-3">
						<div className="h-4 w-28 rounded-full bg-muted" />
						<div className="h-5 w-3/4 rounded-full bg-muted" />
						<div className="h-4 w-full rounded-full bg-muted" />
						<div className="h-4 w-5/6 rounded-full bg-muted" />
					</div>
				</MePageSection>
			))}
		</div>
	);
}

function MePageSections({
	results,
}: {
	results:
		| {
				archetypeName: string;
				archetypeDescription: string;
				oceanCode5: string;
				overallConfidence: number;
				messageCount: number;
				isPublic: boolean | null;
		  }
		| undefined;
}) {
	return (
		<div className="space-y-10">
			<MePageSection
				title="Identity Hero"
				data-slot="me-section-identity-hero"
				data-testid="me-section-identity-hero"
			>
				<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
					Space Two
				</p>
				<p className="mt-3 font-heading text-3xl font-bold text-foreground">
					{results?.archetypeName ?? "Me is your identity sanctuary."}
				</p>
				<p className="mt-4 text-base leading-7 text-muted-foreground">
					{results?.archetypeDescription ??
						"Your portrait, archetype, and long-form identity details now live together in one place."}
				</p>
				<div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
					<div className="rounded-full border border-border px-4 py-2">
						OCEAN code:{" "}
						<span className="font-medium text-foreground">{results?.oceanCode5 ?? "-----"}</span>
					</div>
					<div className="rounded-full border border-border px-4 py-2">
						Confidence:{" "}
						<span className="font-medium text-foreground">
							{results ? `${Math.round(results.overallConfidence)}%` : "Pending"}
						</span>
					</div>
				</div>
			</MePageSection>

			<MePageSection
				title="Your Portrait"
				data-slot="me-section-portrait"
				data-testid="me-section-portrait"
			>
				<p className="text-base leading-7 text-muted-foreground">
					{results
						? `Your latest completed assessment is ready to revisit. Built from ${results.messageCount} conversation turns, this section will become the home for your full portrait reading.`
						: "Your latest portrait will appear here once the results load again."}
				</p>
			</MePageSection>

			<MePageSection
				title="Your Growth"
				isConditional
				data-slot="me-section-growth"
				data-testid="me-section-growth"
				data-state="hidden"
				hidden
			>
				<p className="text-base leading-7 text-muted-foreground">
					Growth history will unlock here once the daily journal and mood calendar ship in Epic 4.
				</p>
			</MePageSection>

			<MePageSection
				title="Your Public Face"
				data-slot="me-section-public-face"
				data-testid="me-section-public-face"
			>
				<p className="text-base leading-7 text-muted-foreground">
					{results?.isPublic === true
						? "Your profile is currently public. Story 3.4 will bring the full controls and presentation here."
						: "Sharing controls and your public profile preview will land here in Story 3.4."}
				</p>
			</MePageSection>

			<MePageSection title="Your Circle" data-slot="me-section-circle" data-testid="me-section-circle">
				<p className="text-base leading-7 text-muted-foreground">
					Relationship space, invites, and your circle preview will gather here once Epic 6 begins.
				</p>
			</MePageSection>

			<MePageSection
				title="Subscription"
				data-slot="me-section-subscription"
				data-testid="me-section-subscription"
			>
				<p className="text-base leading-7 text-muted-foreground">
					Membership, extensions, and renewal decisions will appear here when subscription flows are
					added.
				</p>
			</MePageSection>

			<MePageSection title="Account" data-slot="me-section-account" data-testid="me-section-account">
				<div className="flex items-center justify-between gap-4">
					<p className="text-base leading-7 text-muted-foreground">
						Settings, account controls, and privacy preferences stay close at hand from the bottom of Me.
					</p>
					<Link
						to="/settings"
						data-testid="me-settings-link"
						className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
						aria-label="Open settings"
					>
						<Settings className="size-4" aria-hidden="true" />
					</Link>
				</div>
			</MePageSection>
		</div>
	);
}
