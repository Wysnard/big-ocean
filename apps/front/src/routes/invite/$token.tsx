/**
 * Invitation Landing Page (Story 14.3)
 *
 * Shows inviter info and personal message when invitee clicks an invitation link.
 * Decision tree:
 *   - Authenticated + completed assessment → "Accept" button
 *   - Authenticated + no assessment → claim cookie, redirect to /chat
 *   - Anonymous → claim cookie, redirect to /chat
 */

import { createFileRoute, isRedirect, useNavigate } from "@tanstack/react-router";
import type { InvitationDetailResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { useCallback, useState } from "react";
import {
	InvitationApiError,
	useAcceptInvitation,
	useClaimInvitation,
	useRefuseInvitation,
} from "@/hooks/use-invitation";
import { getSession } from "@/lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type ErrorState = {
	errorStatus: number;
	errorMessage: string;
};

type LoaderData =
	| {
			invitation: InvitationDetailResponse;
			userState: "anonymous" | "authenticated-no-assessment" | "authenticated-with-assessment";
			errorState?: never;
	  }
	| {
			errorState: ErrorState;
			invitation?: never;
			userState?: never;
	  };

export const Route = createFileRoute("/invite/$token")({
	beforeLoad: async ({ params }): Promise<LoaderData> => {
		// Validate token via API
		const res = await fetch(`${API_URL}/api/relationship/public/invitations/${params.token}`, {
			credentials: "include",
		});

		if (!res.ok) {
			return {
				errorState: {
					errorStatus: res.status,
					errorMessage: "This invitation link is invalid or has expired.",
				},
			};
		}

		const invitation: InvitationDetailResponse = await res.json();

		// Check if invitation is expired or already responded
		if (invitation.invitation.status !== "pending") {
			return {
				errorState: {
					errorStatus: 410,
					errorMessage: "This invitation has already been responded to.",
				},
			};
		}

		// Determine user state
		const { data: session } = await getSession();

		if (!session?.user) {
			return { invitation, userState: "anonymous" as const };
		}

		// Check if user has a completed assessment
		try {
			const sessionsRes = await fetch(`${API_URL}/api/assessment/sessions`, {
				credentials: "include",
			});
			if (sessionsRes.ok) {
				const data = await sessionsRes.json();
				const hasCompleted = data.sessions?.some((s: { status: string }) => s.status === "completed");
				if (hasCompleted) {
					return { invitation, userState: "authenticated-with-assessment" as const };
				}
			}
		} catch (e) {
			if (isRedirect(e)) throw e;
			// Fail-open: treat as no assessment
		}

		return { invitation, userState: "authenticated-no-assessment" as const };
	},
	component: InviteLandingPage,
});

function InviteLandingPage() {
	const data = Route.useLoaderData();
	const params = Route.useParams();
	const navigate = useNavigate();
	const [actionError, setActionError] = useState<string | null>(null);

	const claimMutation = useClaimInvitation();
	const acceptMutation = useAcceptInvitation();
	const refuseMutation = useRefuseInvitation();

	const loading = claimMutation.isPending || acceptMutation.isPending || refuseMutation.isPending;

	const isError = "errorState" in data && !!data.errorState;
	const inviterName = !isError ? data.invitation.inviterDisplayName || "Someone" : "Someone";
	const personalMessage = !isError ? (data.invitation.invitation.personalMessage ?? null) : null;
	const userState = !isError ? data.userState : "anonymous";

	const claimCookieAndRedirect = useCallback(() => {
		setActionError(null);
		claimMutation.mutate(params.token, {
			onSuccess: () => navigate({ to: "/chat" }),
			onError: (error) => {
				setActionError(
					error instanceof InvitationApiError
						? error.message
						: "Failed to process invitation. Please try again.",
				);
			},
		});
	}, [params.token, navigate, claimMutation]);

	const handleAcceptDirectly = useCallback(() => {
		setActionError(null);
		acceptMutation.mutate(params.token, {
			onSuccess: () => navigate({ to: "/profile" }),
			onError: (error) => {
				setActionError(
					error instanceof InvitationApiError ? error.message : "Failed to accept invitation.",
				);
			},
		});
	}, [params.token, navigate, acceptMutation]);

	const handleRefuse = useCallback(() => {
		setActionError(null);
		refuseMutation.mutate(params.token, {
			onSuccess: () => navigate({ to: "/" }),
			onError: (error) => {
				setActionError(
					error instanceof InvitationApiError ? error.message : "Failed to decline invitation.",
				);
			},
		});
	}, [params.token, navigate, refuseMutation]);

	if (isError) {
		return (
			<div
				data-testid="invite-landing-page"
				className="min-h-screen flex items-center justify-center bg-background p-4"
			>
				<Card className="max-w-md w-full">
					<CardContent className="pt-6 text-center">
						<h1 className="text-2xl font-bold mb-4">Invitation Unavailable</h1>
						<p className="text-muted-foreground">{data.errorState.errorMessage}</p>
						<Button className="mt-6" onClick={() => navigate({ to: "/" })}>
							Go Home
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div
			data-testid="invite-landing-page"
			className="min-h-screen flex items-center justify-center bg-background p-4"
		>
			<Card className="max-w-md w-full">
				<CardContent className="pt-6 text-center space-y-6">
					<h1 className="text-2xl font-bold">{inviterName} invited you to compare your personalities</h1>

					{personalMessage && (
						<Card className="bg-muted/50">
							<CardContent className="pt-4">
								<p className="text-sm italic text-muted-foreground">&ldquo;{personalMessage}&rdquo;</p>
							</CardContent>
						</Card>
					)}

					<p className="text-muted-foreground text-sm">
						Complete your own personality assessment and discover how your traits compare.
					</p>

					{actionError && <p className="text-destructive text-sm">{actionError}</p>}

					<div className="space-y-3">
						{userState === "authenticated-with-assessment" ? (
							<Button
								data-testid="accept-invitation-button"
								className="w-full"
								size="lg"
								disabled={loading}
								onClick={handleAcceptDirectly}
							>
								{loading ? "Accepting..." : "Accept Invitation"}
							</Button>
						) : (
							<Button
								data-testid="start-assessment-button"
								className="w-full"
								size="lg"
								disabled={loading}
								onClick={claimCookieAndRedirect}
							>
								{loading ? "Starting..." : "Start Your Assessment"}
							</Button>
						)}

						{userState !== "anonymous" && (
							<button
								data-testid="refuse-invitation-link"
								type="button"
								className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
								disabled={loading}
								onClick={handleRefuse}
							>
								Not interested
							</button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
