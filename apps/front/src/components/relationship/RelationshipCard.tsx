/**
 * RelationshipCard (Story 14.4, updated Story 34-1)
 *
 * Renders relationship card states from the RelationshipCardState union.
 * Updated: invitation states replaced with QR token states (ADR-10).
 * Full QR drawer UI will be implemented in Story 5.2.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { RelationshipCardState } from "@workspace/contracts/http/groups/relationship";
import { Button } from "@workspace/ui/components/button";
import { Heart, Loader2, QrCode, Users, XCircle } from "lucide-react";
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
	const enabled = !!isAuthenticated && !isPending;
	const { data: state, isLoading } = useRelationshipState(enabled);

	if (!isAuthenticated || isPending || isLoading || !state) return null;

	return (
		<div
			data-testid="relationship-card"
			data-testid-state={state._tag}
			role="region"
			aria-label="Relationship comparison"
		>
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
						Generate a QR code to invite someone to discover how your personalities interact.
					</p>
					<p className="text-xs text-muted-foreground">
						{state.availableCredits} credit{state.availableCredits !== 1 ? "s" : ""} available
					</p>
				</div>
			);

		case "qr-active":
			return (
				<div
					data-testid="relationship-card-state-qr-active"
					className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3"
				>
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<QrCode className="w-4 h-4 text-primary" />
						QR Code Active
					</div>
					<p className="text-sm text-muted-foreground">
						Your QR code is ready to be scanned. Share it with someone you care about.
					</p>
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
