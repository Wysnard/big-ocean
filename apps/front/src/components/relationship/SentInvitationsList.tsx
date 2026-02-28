/**
 * Sent Invitations List (Story 14.2)
 *
 * Displays list of invitations sent by the current user with status badges.
 */

import { useQuery } from "@tanstack/react-query";
import type { ListInvitationsResponse } from "@workspace/contracts";
import { Badge } from "@workspace/ui/components/badge";
import { Clock, Share2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { InvitationBottomSheet } from "./InvitationBottomSheet";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function useInvitations(enabled: boolean) {
	return useQuery<ListInvitationsResponse>({
		queryKey: ["relationship", "invitations"],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/api/relationship/invitations`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		},
		staleTime: 30_000,
		enabled,
	});
}

const STATUS_CONFIG = {
	pending: { label: "Pending", variant: "outline" as const, icon: Clock },
	accepted: { label: "Accepted", variant: "default" as const, icon: UserCheck },
	refused: { label: "Declined", variant: "destructive" as const, icon: UserX },
	expired: { label: "Expired", variant: "secondary" as const, icon: Clock },
} as const;

interface SentInvitationsListProps {
	enabled: boolean;
}

export function SentInvitationsList({ enabled }: SentInvitationsListProps) {
	const { data } = useInvitations(enabled);
	const [reshareInvitation, setReshareInvitation] = useState<{
		token: string;
		message?: string;
	} | null>(null);

	if (!data?.invitations?.length) return null;

	return (
		<div data-testid="sent-invitations-list" className="space-y-3">
			<h4 className="text-sm font-medium text-muted-foreground">Sent Invitations</h4>

			{data.invitations.map((inv) => {
				const config = STATUS_CONFIG[inv.status];
				const Icon = config.icon;

				return (
					<div
						key={inv.id}
						data-testid="invitation-card"
						className="flex items-center justify-between rounded-lg border border-border p-3"
					>
						<div className="flex-1 min-w-0">
							{inv.personalMessage && (
								<p className="text-sm text-foreground truncate">{inv.personalMessage}</p>
							)}
							<p className="text-xs text-muted-foreground">
								{new Date(inv.createdAt.epochMillis).toLocaleDateString()}
							</p>
						</div>

						<div className="flex items-center gap-2 ml-3">
							<Badge variant={config.variant}>
								<Icon className="h-3 w-3 mr-1" />
								{config.label}
							</Badge>

							{inv.status === "pending" && (
								<button
									type="button"
									className="text-muted-foreground hover:text-foreground transition-colors"
									onClick={() =>
										setReshareInvitation({
											token: inv.invitationToken,
											message: inv.personalMessage ?? undefined,
										})
									}
									title="Share again"
								>
									<Share2 className="h-4 w-4" />
								</button>
							)}
						</div>
					</div>
				);
			})}

			{reshareInvitation && (
				<InvitationBottomSheet
					open={!!reshareInvitation}
					shareUrl={`${window.location.origin}/invite/${reshareInvitation.token}`}
					invitationToken={reshareInvitation.token}
					personalMessage={reshareInvitation.message}
					onClose={() => setReshareInvitation(null)}
				/>
			)}
		</div>
	);
}
