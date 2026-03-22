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
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { RelationshipPortrait } from "@/components/relationship/RelationshipPortrait";
import { useAuth } from "@/hooks/use-auth";
import {
	useRelationshipAnalysis,
	useRetryRelationshipAnalysis,
} from "@/hooks/useRelationshipAnalysis";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/relationship/$analysisId")({
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
	const { isAuthenticated, isPending: isAuthPending } = useAuth();

	const canLoad = !!isAuthenticated && !isAuthPending;
	const { data, isLoading, error } = useRelationshipAnalysis(analysisId, canLoad);
	const retryMutation = useRetryRelationshipAnalysis(analysisId);

	// Loading state (initial fetch or auth pending)
	if (isAuthPending || isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary" />
			</div>
		);
	}

	// Error state (404, 403, network error)
	if (error || !data) {
		return (
			<div
				data-testid="relationship-analysis-page"
				className="min-h-screen bg-background flex items-center justify-center px-6"
			>
				<div className="text-center space-y-4">
					<h1 className="text-xl font-bold text-foreground">Analysis Not Found</h1>
					<p className="text-sm text-muted-foreground">
						{error?.message?.includes("403")
							? "You are not authorized to view this analysis."
							: "This analysis could not be found."}
					</p>
					<Button asChild variant="outline">
						<Link to="/">Go Home</Link>
					</Button>
				</div>
			</div>
		);
	}

	// Generating state (content is null, polling every 5s)
	if (data.content === null) {
		return (
			<div
				data-testid="relationship-analysis-page"
				className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6"
			>
				<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary" />
				<div className="text-center space-y-2">
					<p className="text-sm font-medium text-foreground">
						Your relationship analysis is being generated...
					</p>
					<p className="text-xs text-muted-foreground">This may take a minute</p>
				</div>
				{/* Retry button — available in case generation stalls */}
				<Button
					data-testid="relationship-retry-button"
					variant="outline"
					size="sm"
					className="mt-4 gap-2 min-h-11"
					onClick={() => retryMutation.mutate()}
					disabled={retryMutation.isPending}
					aria-label="Retry relationship analysis generation"
				>
					<RefreshCw className="w-4 h-4" />
					{retryMutation.isPending ? "Retrying..." : "Retry"}
				</Button>
			</div>
		);
	}

	// Ready state — display analysis content
	return (
		<div data-testid="relationship-analysis-page" className="min-h-screen bg-background">
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
		</div>
	);
}
