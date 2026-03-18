/**
 * Settings Page (Story 30-1)
 *
 * Protected route - requires authentication.
 * Provides profile visibility controls and account settings.
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProfileVisibilitySection } from "../components/settings/ProfileVisibilitySection";
import { useListAssessments } from "../hooks/use-assessment";
import { useToggleVisibility } from "../hooks/use-profile";
import { useAuth } from "../hooks/use-auth";
import { getSession } from "../lib/auth-client";

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
	const { data: assessmentData, isLoading: isAssessmentsLoading } = useListAssessments(true);
	const toggleVisibility = useToggleVisibility();

	// Find the completed session's profile data
	const completedSession = assessmentData?.sessions.find((s) => s.status === "completed");

	// Profile visibility state — loaded from results when available
	const [profileState, setProfileState] = useState<{
		publicProfileId: string;
		isPublic: boolean;
	} | null>(null);

	// Fetch results for the completed session to get publicProfileId and isPublic
	const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
	useEffect(() => {
		if (!completedSession || profileState) return;

		const fetchProfileData = async () => {
			try {
				const response = await fetch(
					`${API_URL}/api/assessment/${completedSession.id}/results`,
					{ credentials: "include" },
				);
				if (!response.ok) return;
				const data = await response.json();
				if (data.publicProfileId) {
					setProfileState({
						publicProfileId: data.publicProfileId,
						isPublic: data.isPublic ?? false,
					});
				}
			} catch {
				// Silently fail — profile section will show disabled state
			}
		};

		void fetchProfileData();
	}, [completedSession, profileState, API_URL]);

	const handleToggleVisibility = async () => {
		if (!profileState) return;
		const previousState = profileState.isPublic;
		// Optimistic update
		setProfileState((prev) => (prev ? { ...prev, isPublic: !prev.isPublic } : null));
		try {
			const result = await toggleVisibility.mutateAsync({
				publicProfileId: profileState.publicProfileId,
				isPublic: !previousState,
			});
			setProfileState((prev) => (prev ? { ...prev, isPublic: result.isPublic } : null));
		} catch {
			// Rollback on error
			setProfileState((prev) => (prev ? { ...prev, isPublic: previousState } : null));
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
							publicProfileId={profileState?.publicProfileId ?? null}
							isPublic={profileState?.isPublic ?? false}
							isTogglePending={toggleVisibility.isPending}
							onToggleVisibility={handleToggleVisibility}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
