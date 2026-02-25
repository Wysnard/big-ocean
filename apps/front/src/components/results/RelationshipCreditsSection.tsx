/**
 * Relationship Credits Section (Story 14.1)
 *
 * Displays available relationship credits and purchase options
 * on the results page for authenticated users with completed assessments.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GetCreditsResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { Heart, Loader2, Users } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { openPolarCheckout } from "@/lib/polar-checkout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const POLAR_LINK_SINGLE = import.meta.env.VITE_POLAR_CHECKOUT_RELATIONSHIP_SINGLE || "";
const POLAR_LINK_5PACK = import.meta.env.VITE_POLAR_CHECKOUT_RELATIONSHIP_5PACK || "";

function useCredits() {
	return useQuery<GetCreditsResponse>({
		queryKey: ["purchase", "credits"],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/api/purchase/credits`, {
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return response.json();
		},
		staleTime: 30_000,
	});
}

export function RelationshipCreditsSection() {
	const { user } = useAuth();
	const { data, isLoading } = useCredits();
	const queryClient = useQueryClient();
	const [isPurchasing, setIsPurchasing] = useState(false);
	const pollTimerRef = useRef<ReturnType<typeof setInterval>>();

	const pollAndRefresh = useCallback(() => {
		// Poll credits endpoint to pick up webhook-processed purchase
		let attempts = 0;
		const maxAttempts = 15; // 30s at 2s interval
		pollTimerRef.current = setInterval(async () => {
			attempts++;
			if (attempts >= maxAttempts) {
				clearInterval(pollTimerRef.current);
				setIsPurchasing(false);
				return;
			}
			await queryClient.invalidateQueries({ queryKey: ["purchase", "credits"] });
		}, 2000);
	}, [queryClient]);

	const handlePurchase = useCallback(
		async (checkoutLink: string) => {
			if (!user?.id || !checkoutLink) return;
			setIsPurchasing(true);

			const result = await openPolarCheckout({
				checkoutLinkUrl: checkoutLink,
				userId: user.id,
			});

			if (result.success) {
				pollAndRefresh();
			} else {
				setIsPurchasing(false);
			}
		},
		[user?.id, pollAndRefresh],
	);

	// Hidden when loading, no data, or no completed assessment
	if (isLoading) {
		return (
			<div
				data-testid="relationship-credits-section"
				className="rounded-2xl border border-border bg-card p-5 shadow-sm"
			>
				<div className="flex items-center justify-center py-4">
					<Loader2 className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" />
				</div>
			</div>
		);
	}

	if (!data?.hasCompletedAssessment) {
		return null;
	}

	const hasCredits = data.availableCredits > 0;

	return (
		<div
			data-testid="relationship-credits-section"
			className="rounded-2xl border border-border bg-card p-5 shadow-sm"
		>
			<div className="flex items-center gap-2 mb-3">
				<Heart className="h-5 w-5 text-pink-500" />
				<h3 className="font-heading text-lg text-foreground">Compare Personalities</h3>
			</div>

			<p className="text-sm text-muted-foreground mb-4">
				Invite someone to take the assessment and discover how your personalities compare.
			</p>

			{/* Credit count */}
			<div className="flex items-center gap-2 mb-4">
				<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
					<Users className="h-3.5 w-3.5 mr-1.5" />
					{data.availableCredits} credit{data.availableCredits !== 1 ? "s" : ""}
				</span>
			</div>

			{hasCredits ? (
				<Button
					data-testid="invite-button"
					className="w-full min-h-11"
					disabled
					title="Coming soon in Story 14-2"
				>
					<Users className="h-4 w-4 mr-2" />
					Invite Someone
				</Button>
			) : (
				<div className="space-y-2">
					<Button
						data-testid="get-credits-button"
						className="w-full min-h-11"
						onClick={() => handlePurchase(POLAR_LINK_SINGLE)}
						disabled={isPurchasing || !POLAR_LINK_SINGLE}
					>
						{isPurchasing ? (
							<Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
						) : (
							<Heart className="h-4 w-4 mr-2" />
						)}
						Get 1 Credit — €5
					</Button>
					<Button
						data-testid="get-credits-5pack-button"
						variant="outline"
						className="w-full min-h-11"
						onClick={() => handlePurchase(POLAR_LINK_5PACK)}
						disabled={isPurchasing || !POLAR_LINK_5PACK}
					>
						{isPurchasing ? (
							<Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
						) : (
							<Users className="h-4 w-4 mr-2" />
						)}
						Get 5 Credits — €15
					</Button>
				</div>
			)}
		</div>
	);
}
