/**
 * Relationship Analysis View Page (Story 14.4, updated Story 35-1, Story 35-3)
 *
 * Displays the full personality comparison analysis for authorized users.
 * - Polls every 5s while content is null (generating)
 * - Renders analysis via RelationshipPortrait (Portrait Spine Renderer pattern)
 * - Retry button for failed generation
 * - Version badge for non-latest analyses
 * - Auth guard via beforeLoad
 */

import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { PageMain } from "@/components/PageMain";
import { RelationshipPortrait } from "@/components/relationship/RelationshipPortrait";
import {
	useRelationshipAnalysis,
	useRetryRelationshipAnalysis,
} from "@/hooks/useRelationshipAnalysis";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/relationship/$analysisId")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { sessionId: undefined, redirectTo: undefined },
			});
		}
	},
	component: RelationshipAnalysisPage,
});

function RelationshipAnalysisPage() {
	const { analysisId } = Route.useParams();
	const navigate = useNavigate();

	// Auth is guaranteed by beforeLoad — no client-side auth gating needed
	const { data, isLoading, error, isFetching } = useRelationshipAnalysis(analysisId);
	const retryMutation = useRetryRelationshipAnalysis(analysisId);

	// Track poll count to detect stalled generation (AC-3)
	const pollCountRef = useRef(0);
	useEffect(() => {
		if (!isLoading && data?.content === null && !isFetching) {
			pollCountRef.current += 1;
		}
	}, [isLoading, data?.content, isFetching]);

	// Loading state (initial fetch) — skeleton pulse per AC-1
	if (isLoading) {
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="loading"
				title="Loading relationship analysis"
				className="min-h-screen bg-background"
			>
				<output
					className="block mx-auto max-w-2xl px-5 py-8 space-y-6"
					aria-label="Loading relationship analysis"
				>
					<div className="h-8 w-32 animate-pulse rounded bg-muted" />
					<div className="rounded-xl border border-border bg-card p-6 space-y-4">
						<div className="h-6 w-48 animate-pulse rounded bg-muted" />
						<div className="h-4 w-full animate-pulse rounded bg-muted" />
						<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
						<div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
						<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
					</div>
				</output>
			</PageMain>
		);
	}

	// Error state (404, 403, network error)
	if (error || !data) {
		const isUnauthorized =
			(error as unknown as Record<string, unknown> | null)?._tag ===
			"RelationshipAnalysisUnauthorizedError";
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="error"
				className="min-h-screen bg-background flex items-center justify-center px-6"
				role="alert"
			>
				<div className="text-center space-y-4">
					<h1 className="text-xl font-bold text-foreground">Analysis Not Found</h1>
					<p className="text-sm text-muted-foreground">
						{isUnauthorized
							? "You are not authorized to view this analysis."
							: "This analysis could not be found."}
					</p>
					<Button asChild variant="outline" className="min-h-11">
						<Link to="/">Go Home</Link>
					</Button>
				</div>
			</PageMain>
		);
	}

	// Generating / failed state (content is null, polling every 5s)
	// After several polls without content, show failure messaging (AC-3)
	if (data.content === null) {
		const hasPolledEnough = pollCountRef.current > 3;
		return (
			<PageMain
				data-testid="relationship-analysis-page"
				data-testid-state="generating"
				title="Generating relationship analysis"
				className="min-h-screen bg-background"
			>
				<div className="mx-auto max-w-2xl px-5 py-8 space-y-6">
					{/* Skeleton pulse placeholder per AC-1 */}
					<div className="rounded-xl border border-border bg-card p-6 space-y-4">
						<div className="flex items-center gap-3">
							<div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
							<div className="h-5 w-40 animate-pulse rounded bg-muted" />
						</div>
						<div className="h-4 w-full animate-pulse rounded bg-muted" />
						<div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
						<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
						<div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
						<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
					</div>
					<output className="block text-center space-y-2">
						<p className="text-sm font-medium text-foreground">
							{hasPolledEnough
								? "Generation may have stalled."
								: "Your relationship analysis is being generated..."}
						</p>
						<p className="text-xs text-muted-foreground">
							{hasPolledEnough ? "Try regenerating your analysis." : "This may take a minute"}
						</p>
					</output>
					<div className="flex justify-center">
						<Button
							data-testid="relationship-retry-button"
							variant="outline"
							size="sm"
							className="gap-2 min-h-11"
							onClick={() => retryMutation.mutate()}
							disabled={retryMutation.isPending}
							aria-label="Retry relationship analysis generation"
						>
							<RefreshCw className="w-4 h-4" />
							{retryMutation.isPending ? "Retrying..." : "Retry"}
						</Button>
					</div>
				</div>
			</PageMain>
		);
	}

	// Ready state — display analysis content
	return (
		<PageMain
			data-testid="relationship-analysis-page"
			data-testid-state="ready"
			title={`Relationship analysis: ${data.userAName} and ${data.userBName}`}
			className="min-h-screen bg-background"
		>
			<div className="mx-auto max-w-2xl px-5 py-8">
				<Button
					variant="ghost"
					size="sm"
					className="mb-6 -ml-2 text-muted-foreground min-h-11"
					onClick={() => navigate({ to: "/" })}
				>
					<ArrowLeft className="w-4 h-4 mr-1.5" />
					Back
				</Button>

				<RelationshipPortrait
					content={data.content}
					userAName={data.userAName}
					userBName={data.userBName}
					isLatestVersion={data.isLatestVersion}
				/>
			</div>
		</PageMain>
	);
}
