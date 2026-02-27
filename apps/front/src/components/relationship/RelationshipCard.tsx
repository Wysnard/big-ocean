/**
 * RelationshipCard (Story 14.4)
 *
 * Renders one of 7 states from the RelationshipCardState discriminated union.
 * Polls for state transitions when in "generating" state.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { RelationshipCardState } from "@workspace/contracts/http/groups/relationship";
import { Button } from "@workspace/ui/components/button";
import { Heart, Loader2, Send, UserCheck, Users, UserX, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function useRelationshipState(enabled: boolean) {
	return useQuery<RelationshipCardState>({
		queryKey: ["relationship", "state"],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/api/relationship/state`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		},
		staleTime: 10_000,
		enabled,
		refetchInterval: (query) => (query.state.data?._tag === "generating" ? 5000 : false),
	});
}

export function RelationshipCard() {
	const { isAuthenticated, isPending } = useAuth();
	const { data: state, isLoading } = useRelationshipState(!!isAuthenticated && !isPending);

	if (!isAuthenticated || isPending || isLoading || !state) return null;

	return (
		<div data-testid="relationship-card" data-testid-state={state._tag}>
			<CardContent state={state} />
		</div>
	);
}

function CardContent({ state }: { state: RelationshipCardState }) {
	switch (state._tag) {
		case "invite-prompt":
			return (
				<div
					data-testid="relationship-card-state-invite-prompt"
					className="rounded-xl border border-border bg-card p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Users className="w-4 h-4 text-primary" />
						Compare Personalities
					</div>
					<p className="text-sm text-muted-foreground">
						Invite someone to discover how your personalities interact.
					</p>
					<p className="text-xs text-muted-foreground">
						{state.availableCredits} credit{state.availableCredits !== 1 ? "s" : ""} available
					</p>
				</div>
			);

		case "pending-sent":
			return (
				<div
					data-testid="relationship-card-state-pending-sent"
					className="rounded-xl border border-border bg-card p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Send className="w-4 h-4 text-amber-500" />
						Invitation Sent
					</div>
					<p className="text-sm text-muted-foreground">
						Waiting for{" "}
						<span className="font-medium text-foreground">{state.inviteeName || "your invitee"}</span> to
						respond.
					</p>
				</div>
			);

		case "pending-received":
			return (
				<div
					data-testid="relationship-card-state-pending-received"
					className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Heart className="w-4 h-4 text-primary" />
						You've Been Invited
					</div>
					<p className="text-sm text-muted-foreground">
						<span className="font-medium text-foreground">{state.inviterName}</span> wants to compare
						personalities with you.
					</p>
					<div className="flex gap-2">
						<Button size="sm" asChild>
							<Link to="/invite/$token" params={{ token: state.invitationId }}>
								<UserCheck className="w-3.5 h-3.5 mr-1.5" />
								View Invitation
							</Link>
						</Button>
					</div>
				</div>
			);

		case "generating":
			return (
				<div
					data-testid="relationship-card-state-generating"
					className="rounded-xl border border-border bg-card p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Loader2 className="w-4 h-4 text-primary motion-safe:animate-spin" />
						Generating Analysis
					</div>
					<p className="text-sm text-muted-foreground">
						Your relationship analysis is being created. This usually takes a minute or two.
					</p>
				</div>
			);

		case "ready":
			return (
				<div
					data-testid="relationship-card-state-ready"
					className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Heart className="w-4 h-4 text-primary" />
						Analysis Ready
					</div>
					<p className="text-sm text-muted-foreground">
						Your personality comparison with{" "}
						<span className="font-medium text-foreground">{state.partnerName}</span> is ready to read.
					</p>
					<Button size="sm" asChild>
						<Link to="/relationship/$analysisId" params={{ analysisId: state.analysisId }}>
							Read Analysis
						</Link>
					</Button>
				</div>
			);

		case "declined":
			return (
				<div
					data-testid="relationship-card-state-declined"
					className="rounded-xl border border-border bg-card p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<UserX className="w-4 h-4" />
						Invitation Declined
					</div>
					<p className="text-sm text-muted-foreground">
						{state.inviteeName || "Your invitee"} declined the invitation.
					</p>
				</div>
			);

		case "no-credits":
			return (
				<div
					data-testid="relationship-card-state-no-credits"
					className="rounded-xl border border-border bg-card p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<XCircle className="w-4 h-4" />
						No Credits
					</div>
					<p className="text-sm text-muted-foreground">
						Purchase credits to invite someone for a personality comparison.
					</p>
				</div>
			);
	}
}
