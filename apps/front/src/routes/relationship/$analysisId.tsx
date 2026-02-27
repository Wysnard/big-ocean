/**
 * Relationship Analysis View Page (Story 14.4)
 *
 * Displays the full personality comparison analysis for authorized users.
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { RelationshipAnalysisResponse } from "@workspace/contracts/http/groups/relationship";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import Markdown from "react-markdown";
import { useAuth } from "@/hooks/use-auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const Route = createFileRoute("/relationship/$analysisId")({
	component: RelationshipAnalysisPage,
});

function useRelationshipAnalysis(analysisId: string, enabled: boolean) {
	return useQuery<RelationshipAnalysisResponse>({
		queryKey: ["relationship", "analysis", analysisId],
		queryFn: async () => {
			const response = await fetch(
				`${API_URL}/api/relationship/analysis/${encodeURIComponent(analysisId)}`,
				{ credentials: "include" },
			);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		},
		staleTime: 5 * 60 * 1000,
		enabled,
	});
}

function RelationshipAnalysisPage() {
	const { analysisId } = Route.useParams();
	const navigate = useNavigate();
	const { isAuthenticated, isPending: isAuthPending } = useAuth();

	const canLoad = !!isAuthenticated && !isAuthPending;
	const { data, isLoading, error } = useRelationshipAnalysis(analysisId, canLoad);

	useEffect(() => {
		if (!isAuthPending && !isAuthenticated) {
			void navigate({ to: "/" });
		}
	}, [isAuthPending, isAuthenticated, navigate]);

	if (isAuthPending || isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary" />
			</div>
		);
	}

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

	return (
		<div data-testid="relationship-analysis-page" className="min-h-screen bg-background">
			<div className="mx-auto max-w-2xl px-5 py-8">
				<Button
					variant="ghost"
					size="sm"
					className="mb-6 -ml-2 text-muted-foreground"
					onClick={() => navigate({ to: "/" })}
				>
					<ArrowLeft className="w-4 h-4 mr-1.5" />
					Back
				</Button>

				<article className="prose prose-sm dark:prose-invert max-w-none">
					<Markdown>{data.content}</Markdown>
				</article>
			</div>
		</div>
	);
}
