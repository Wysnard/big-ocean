/**
 * Dashboard Route (Story 38-3)
 *
 * Centralized view of user's results, relationship analyses, and credits.
 * Merges previous /profile route — single authenticated home base.
 * Requires authentication.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import type { TraitName } from "@workspace/domain";
import { Loader2 } from "lucide-react";
import { DashboardCreditsCard } from "@/components/dashboard/DashboardCreditsCard";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardIdentityCard } from "@/components/dashboard/DashboardIdentityCard";
import { DashboardInProgressCard } from "@/components/dashboard/DashboardInProgressCard";
import { DashboardRelationshipsCard } from "@/components/dashboard/DashboardRelationshipsCard";
import { useAuth } from "@/hooks/use-auth";
import { useGetResults, useListConversations } from "@/hooks/use-conversation";
import { useCredits } from "@/hooks/useCredits";
import { useRelationshipAnalysesList } from "@/hooks/useRelationshipAnalysesList";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	ssr: false,
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}
	},
	component: DashboardPage,
});

/** Determine the dominant (highest-scoring) trait from results */
function getDominantTrait(traits: readonly { name: TraitName; score: number }[]): TraitName {
	if (traits.length === 0) return "openness";
	const sorted = [...traits].sort((a, b) => b.score - a.score);
	return sorted[0].name;
}

function DashboardPage() {
	const { user, isAuthenticated, isPending: isAuthPending } = useAuth();
	const canLoad = !!isAuthenticated && !isAuthPending;

	// Fetch user's assessments
	const { data: conversationData, isLoading: isConversationsLoading } =
		useListConversations(canLoad);

	// Get the latest completed session
	const latestSession = conversationData?.sessions.find((s) => s.status === "completed");
	const sessionId = latestSession?.id ?? "";

	// Fetch results for the latest completed session
	const { data: results, isLoading: isResultsLoading } = useGetResults(
		sessionId,
		canLoad && !!sessionId,
	);

	// Check for in-progress session (not completed)
	const inProgressSession = conversationData?.sessions.find((s) => s.status !== "completed");

	// Relationship analyses
	const { data: analyses, isLoading: isAnalysesLoading } = useRelationshipAnalysesList(canLoad);

	// Credits
	const { data: credits, isLoading: isCreditsLoading } = useCredits(canLoad);

	if (isAuthPending || isConversationsLoading) {
		return (
			<div className="min-h-[calc(100dvh-3.5rem)] bg-background flex items-center justify-center px-6">
				<div className="text-center">
					<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary mx-auto mb-3" />
					<p className="text-sm text-muted-foreground">Loading your dashboard...</p>
				</div>
			</div>
		);
	}

	const hasCompletedAssessment = !!latestSession;

	return (
		<div data-testid="dashboard-page" className="min-h-[calc(100dvh-3.5rem)] bg-background">
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-2xl font-heading font-bold text-foreground">Your Dashboard</h1>
					<p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name || user?.email}</p>
				</div>

				{!hasCompletedAssessment && !inProgressSession ? (
					<DashboardEmptyState />
				) : !hasCompletedAssessment && inProgressSession ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{/* In-progress assessment card */}
						<DashboardInProgressCard
							sessionId={inProgressSession.id}
							messageCount={inProgressSession.messageCount}
							freeTierMessageThreshold={conversationData?.freeTierMessageThreshold ?? 0}
						/>

						{/* Credits card */}
						<DashboardCreditsCard credits={credits} isLoading={isCreditsLoading} userId={user?.id} />
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
						{/* Identity card */}
						{results && !isResultsLoading && (
							<DashboardIdentityCard
								archetypeName={results.archetypeName}
								oceanCode5={results.oceanCode5}
								sessionId={sessionId}
								dominantTrait={getDominantTrait(results.traits)}
								publicProfileId={results.publicProfileId ?? undefined}
							/>
						)}

						{/* Credits card */}
						<DashboardCreditsCard credits={credits} isLoading={isCreditsLoading} userId={user?.id} />

						{/* Relationship analyses — full width */}
						<div className="sm:col-span-2">
							<DashboardRelationshipsCard analyses={analyses} isLoading={isAnalysesLoading} />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
