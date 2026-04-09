/**
 * RelationshipAnalysesList (Story 35-4)
 *
 * Displays all relationship analyses for the current user.
 * Latest versions are visually primary, previous versions are muted.
 */

import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRelationshipAnalysesList } from "@/hooks/useRelationshipAnalysesList";

export function RelationshipAnalysesList() {
	const { isAuthenticated, isPending: isAuthPending } = useAuth();
	const canLoad = !!isAuthenticated && !isAuthPending;
	const { data: analyses, isLoading } = useRelationshipAnalysesList(canLoad);

	if (!isAuthenticated || isAuthPending || isLoading) return null;

	if (!analyses || analyses.length === 0) return null;

	return (
		<div
			data-testid="relationship-analyses-list"
			role="region"
			aria-label="Relationship analyses"
			className="space-y-3"
		>
			<h3 className="text-sm font-medium text-foreground">Relationship Analyses</h3>
			{analyses.map((analysis) => (
				<div
					key={analysis.analysisId}
					data-testid={`relationship-analysis-item-${analysis.analysisId}`}
					className={`rounded-xl border p-4 space-y-2 ${
						analysis.isLatestVersion
							? "border-primary/30 bg-primary/5"
							: "border-border bg-card opacity-75"
					}`}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm font-medium text-foreground">
							<Heart className="w-4 h-4 text-primary" />
							{analysis.userAName} & {analysis.userBName}
						</div>
						{!analysis.isLatestVersion && (
							<span
								data-testid="previous-version-badge"
								className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
							>
								Previous version
							</span>
						)}
					</div>

					<div className="flex items-center justify-between">
						{analysis.hasContent ? (
							<Button size="sm" variant={analysis.isLatestVersion ? "default" : "outline"} asChild>
								<Link to="/relationship/$analysisId" params={{ analysisId: analysis.analysisId }}>
									Read Analysis
								</Link>
							</Button>
						) : (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Loader2 className="w-3 h-3 motion-safe:animate-spin" />
								Generating...
							</div>
						)}
						<span className="text-xs text-muted-foreground">
							{new Date(analysis.createdAt).toLocaleDateString()}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
