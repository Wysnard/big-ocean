/**
 * Settings Page (Story 30-1)
 *
 * Protected route - requires authentication.
 * Provides profile visibility controls and account settings.
 */

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AccountDeletionSection } from "../components/settings/AccountDeletionSection";
import { ProfileVisibilitySection } from "../components/settings/ProfileVisibilitySection";
import { useDeleteAccount } from "../hooks/use-account";
import { useGetResults, useListAssessments } from "../hooks/use-assessment";
import { useAuth } from "../hooks/use-auth";
import { useToggleVisibility } from "../hooks/use-profile";
import { getSession, signOut } from "../lib/auth-client";

export const Route = createFileRoute("/settings")({
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/login", search: { sessionId: undefined, redirectTo: undefined } });
		}
	},
	component: SettingsPage,
});

function SettingsPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { data: assessmentData, isLoading: isAssessmentsLoading } = useListAssessments(true);
	const toggleVisibility = useToggleVisibility();
	const deleteAccountMutation = useDeleteAccount();

	// Find the completed session
	const completedSession = assessmentData?.sessions.find((s) => s.status === "completed");

	// Use the existing hook to fetch results (leverages TanStack Query cache)
	const { data: results } = useGetResults(completedSession?.id ?? "", !!completedSession);

	// Local override for optimistic toggle updates
	const [isPublicOverride, setIsPublicOverride] = useState<boolean | null>(null);

	// Derive profile state from results data
	const publicProfileId = results?.publicProfileId ?? null;
	const isPublic = isPublicOverride ?? results?.isPublic ?? false;

	const handleDeleteAccount = async () => {
		await deleteAccountMutation.mutateAsync();
		await signOut();
		navigate({ to: "/" });
	};

	const handleToggleVisibility = async () => {
		if (!publicProfileId) return;
		const previousState = isPublic;
		// Optimistic update
		setIsPublicOverride(!previousState);
		try {
			const result = await toggleVisibility.mutateAsync({
				publicProfileId,
				isPublic: !previousState,
			});
			setIsPublicOverride(result.isPublic);
		} catch {
			// Rollback on error
			setIsPublicOverride(previousState);
		}
	};

	if (!user) {
		return null;
	}

	return (
		<div data-slot="settings-page" className="min-h-[calc(100dvh-3.5rem)] bg-background">
			<div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Manage your account and privacy preferences
					</p>
				</div>

				{/* Settings sections */}
				<div className="flex flex-col gap-6">
					{isAssessmentsLoading ? (
						<div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
							<div className="h-5 w-40 rounded bg-muted mb-3" />
							<div className="h-4 w-64 rounded bg-muted mb-4" />
							<div className="h-8 w-20 rounded bg-muted" />
						</div>
					) : (
						<ProfileVisibilitySection
							publicProfileId={publicProfileId}
							isPublic={isPublic}
							isTogglePending={toggleVisibility.isPending}
							onToggleVisibility={handleToggleVisibility}
						/>
					)}

					{/* Account deletion — always visible for authenticated users */}
					<AccountDeletionSection
						onDelete={handleDeleteAccount}
						isDeleting={deleteAccountMutation.isPending}
					/>
				</div>
			</div>
		</div>
	);
}
