/**
 * DashboardRelationshipsCard (Story 38-3, Task 5)
 *
 * Shows relationship analyses list with version badges, or an empty state CTA.
 */

import { Link } from "@tanstack/react-router";
import type { RelationshipAnalysisListItem } from "@workspace/contracts/http/groups/relationship";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Heart, Loader2, Users } from "lucide-react";

interface DashboardRelationshipsCardProps {
	analyses: ReadonlyArray<RelationshipAnalysisListItem> | undefined;
	isLoading: boolean;
}

export function DashboardRelationshipsCard({
	analyses,
	isLoading,
}: DashboardRelationshipsCardProps) {
	const hasAnalyses = analyses && analyses.length > 0;

	return (
		<Card data-testid="dashboard-relationships-card">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Heart className="w-5 h-5 text-pink-500" />
					<CardTitle className="text-lg font-display">Relationship Analyses</CardTitle>
				</div>
			</CardHeader>

			<CardContent>
				{isLoading && (
					<div className="flex items-center justify-center py-6">
						<Loader2 className="w-5 h-5 motion-safe:animate-spin text-muted-foreground" />
					</div>
				)}

				{!isLoading && !hasAnalyses && (
					<div className="text-center py-4">
						<Users className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
						<p className="text-sm text-muted-foreground mb-1">No analyses yet</p>
						<p className="text-xs text-muted-foreground">
							Invite someone you care about to discover how your personalities flow together. Like two
							currents meeting in the open water.
						</p>
					</div>
				)}

				{!isLoading && hasAnalyses && (
					<div className="space-y-2">
						{analyses.map((analysis) => (
							<div
								key={analysis.analysisId}
								data-testid={`dashboard-analysis-${analysis.analysisId}`}
								className={`rounded-lg border p-3 ${
									analysis.isLatestVersion
										? "border-primary/30 bg-primary/5"
										: "border-border bg-card opacity-75"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium text-foreground flex items-center gap-1.5">
										<Heart className="w-3.5 h-3.5 text-primary" />
										{analysis.userAName} & {analysis.userBName}
									</span>
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
										<Button
											size="sm"
											variant={analysis.isLatestVersion ? "default" : "outline"}
											className="min-h-9"
											asChild
										>
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
				)}
			</CardContent>
		</Card>
	);
}
