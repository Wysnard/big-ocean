import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { GetResultsResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { IdentityHeroSection } from "@/components/me/IdentityHeroSection";
import { MePageSection } from "@/components/me/MePageSection";
import { SubscriptionPitchSection } from "@/components/me/SubscriptionPitchSection";
import { SubscriptionValueSummary } from "@/components/me/SubscriptionValueSummary";
import { YourCirclePreviewSection } from "@/components/me/YourCirclePreviewSection";
import { YourGrowthSection } from "@/components/me/YourGrowthSection";
import { YourPublicFaceSection } from "@/components/me/YourPublicFaceSection";
import { ThreeSpaceLayout } from "@/components/ThreeSpaceLayout";
import { listConversationsQueryOptions, useGetResults } from "@/hooks/use-conversation";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { getSession } from "@/lib/auth-client";
import {
	clearPendingResultsGateSession,
	readPendingResultsGateSession,
} from "@/lib/results-auth-gate-storage";

type MeSectionSpec = {
	key: string;
	title: string;
	isConditional?: boolean;
	hidden?: boolean;
};

const ME_SECTION_SPECS: readonly MeSectionSpec[] = [
	{ key: "identity-hero", title: "Your identity" },
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
		// Replaces former `/results` index: 24h pending session pointer in localStorage
		if (typeof window !== "undefined") {
			const pending = readPendingResultsGateSession();
			if (pending?.expired) {
				clearPendingResultsGateSession();
			} else if (pending && !pending.expired) {
				throw redirect({
					to: "/me/$conversationSessionId",
					params: { conversationSessionId: pending.sessionId },
					replace: true,
				});
			}
		}

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
	const subscriptionQuery = useSubscriptionState();
	const [isErrorVisible, setIsErrorVisible] = useState(true);

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
		<ThreeSpaceLayout
			title="Me"
			data-slot="me-page"
			data-testid="me-page"
			className="min-h-[calc(100dvh-3.5rem)] bg-background pb-28 lg:pb-0"
		>
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

			{isLoading ? (
				<MePageSkeleton />
			) : (
				<MePageSections results={results} subscriptionQuery={subscriptionQuery} />
			)}
		</ThreeSpaceLayout>
	);
}

function IdentityHeroSkeleton() {
	return (
		<div className="animate-pulse space-y-5">
			{/* Archetype name placeholder */}
			<div className="h-10 w-3/4 rounded-full bg-muted" />
			{/* OCEAN code — 5 circle placeholders */}
			<div className="flex gap-3">
				{Array.from({ length: 5 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
					<div key={i} className="h-8 w-8 rounded-full bg-muted" />
				))}
			</div>
			{/* Radar chart circle + confidence ring side-by-side */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
				<div className="aspect-square max-h-[200px] w-full rounded-full bg-muted" />
				<div className="aspect-square max-h-[200px] w-full rounded-full bg-muted" />
			</div>
		</div>
	);
}

function MePageSkeleton() {
	return (
		<div className="space-y-10">
			{ME_SECTION_SPECS.map((section) =>
				section.key === "account" ? (
					<div
						key={section.key}
						data-slot="me-section-account"
						data-testid="me-section-account"
						aria-busy="true"
						className="flex items-center justify-end border-t border-border/60 pt-4"
					>
						<div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
					</div>
				) : (
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
						{section.key === "identity-hero" ? (
							<IdentityHeroSkeleton />
						) : (
							<div className="animate-pulse space-y-3">
								<div className="h-4 w-28 rounded-full bg-muted" />
								<div className="h-5 w-3/4 rounded-full bg-muted" />
								<div className="h-4 w-full rounded-full bg-muted" />
								<div className="h-4 w-5/6 rounded-full bg-muted" />
							</div>
						)}
					</MePageSection>
				),
			)}
		</div>
	);
}

function MePageSections({
	results,
	subscriptionQuery,
}: {
	results: GetResultsResponse | undefined;
	subscriptionQuery: ReturnType<typeof useSubscriptionState>;
}) {
	return (
		<div className="space-y-10">
			<MePageSection
				title="Your identity"
				data-slot="me-section-identity-hero"
				data-testid="me-section-identity-hero"
			>
				{results ? (
					<IdentityHeroSection results={results} />
				) : (
					<p className="text-base leading-7 text-muted-foreground">
						Your identity — archetype, OCEAN code, and personality shape — will appear here once results
						load.
					</p>
				)}
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

			<YourGrowthSection />

			<MePageSection
				title="Your Public Face"
				data-slot="me-section-public-face"
				data-testid="me-section-public-face"
			>
				{results ? (
					<YourPublicFaceSection results={results} />
				) : (
					<p className="text-base leading-7 text-muted-foreground">
						Sharing controls and your public profile preview will appear here once results load.
					</p>
				)}
			</MePageSection>

			<MePageSection title="Your Circle" data-slot="me-section-circle" data-testid="me-section-circle">
				<YourCirclePreviewSection />
			</MePageSection>

			<MePageSection
				title="Subscription"
				data-slot="me-section-subscription"
				data-testid="me-section-subscription"
			>
				{subscriptionQuery.isPending ? (
					<p
						className="text-sm leading-6 text-muted-foreground"
						data-testid="subscription-section-loading"
						aria-busy="true"
					>
						Checking your subscription status…
					</p>
				) : subscriptionQuery.isError ? (
					<div className="space-y-3" data-testid="subscription-section-error">
						<p className="text-sm leading-6 text-muted-foreground">
							We couldn&apos;t load subscription status right now. You can try again or refresh the page.
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-full"
							data-testid="subscription-section-retry"
							disabled={subscriptionQuery.isFetching}
							onClick={() => {
								void subscriptionQuery.refetch();
							}}
						>
							Try again
						</Button>
					</div>
				) : subscriptionQuery.data?.isEntitledToConversationExtension ? (
					<SubscriptionValueSummary subscribedSince={subscriptionQuery.data.subscribedSince} />
				) : (
					<SubscriptionPitchSection />
				)}
			</MePageSection>

			<footer
				data-slot="me-section-account"
				data-testid="me-section-account"
				className="flex items-center justify-end border-t border-border/60 pt-4"
			>
				<Link
					to="/settings"
					data-testid="me-settings-link"
					className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border/70 bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					aria-label="Open settings"
				>
					<Settings className="size-4" aria-hidden="true" />
				</Link>
			</footer>
		</div>
	);
}
