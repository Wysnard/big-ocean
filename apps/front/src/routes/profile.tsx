/**
 * Profile Page (Story 7.13)
 *
 * Protected route - requires authentication.
 * Shows user's single assessment with derived completion status.
 * Only one assessment per user — no grid layout needed.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card";
import { Loader2 } from "lucide-react";
import { AssessmentCard } from "../components/profile/AssessmentCard";
import { EmptyProfile } from "../components/profile/EmptyProfile";
import { useListAssessments } from "../hooks/use-assessment";
import { useRequireAuth } from "../hooks/use-auth";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

function ProfileSkeleton() {
	return (
		<div className="mx-auto max-w-md">
			<Card className="animate-pulse">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="h-5 w-24 rounded bg-muted" />
						<div className="h-5 w-16 rounded-full bg-muted" />
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex justify-center py-2">
						<div className="h-12 w-32 rounded bg-muted" />
					</div>
					<div className="h-3 w-16 rounded bg-muted" />
				</CardContent>
				<CardFooter className="flex-col gap-2">
					<div className="h-8 w-full rounded-md bg-muted" />
					<div className="h-8 w-full rounded-md bg-muted" />
				</CardFooter>
			</Card>
		</div>
	);
}

function ProfilePage() {
	const { user, isPending: isAuthPending } = useRequireAuth("/login");
	const { data, isLoading: isAssessmentsLoading, error } = useListAssessments(!!user);

	if (isAuthPending) {
		return (
			<div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-background">
				<div className="text-center">
					<Loader2 className="h-10 w-10 motion-safe:animate-spin text-primary mx-auto mb-3" />
					<p className="text-sm text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const session = data?.sessions[0] ?? null;

	return (
		<div data-slot="profile-page" className="min-h-[calc(100dvh-3.5rem)] bg-background">
			<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-2xl font-heading font-bold text-foreground">Your Assessment</h1>
					<p className="text-sm text-muted-foreground mt-1">Welcome back, {user.name || user.email}</p>
				</div>

				{/* Assessment */}
				{isAssessmentsLoading ? (
					<ProfileSkeleton />
				) : error ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
						<p className="text-sm text-destructive">
							Failed to load your assessment. Please try again later.
						</p>
					</div>
				) : !session ? (
					<EmptyProfile />
				) : (
					<div className="mx-auto max-w-md">
						<AssessmentCard
							id={session.id}
							createdAt={session.createdAt}
							messageCount={session.messageCount}
							freeTierMessageThreshold={data.freeTierMessageThreshold}
							oceanCode5={session.oceanCode5}
							archetypeName={session.archetypeName}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
