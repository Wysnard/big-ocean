/**
 * Relationship Credits Section (Story 14.1, updated Story 34-1, 34-2)
 *
 * Displays available relationship credits, purchase options, and QR drawer trigger
 * on the results page.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GetCreditsResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { Heart, Loader2, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { QrDrawerWithTrigger } from "@/components/relationship/QrDrawer";
import { useAuth } from "@/hooks/use-auth";
import { createThemedCheckoutEmbed } from "@/lib/polar-checkout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function useCredits(enabled: boolean) {
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
		enabled,
	});
}

export function RelationshipCreditsSection() {
	const { user } = useAuth();
	const { appTheme } = useTheme();
	const { data, isLoading } = useCredits(!!user);
	const queryClient = useQueryClient();
	const [isPurchasing, setIsPurchasing] = useState(false);
	const pollTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
	const creditsBefore = useRef<number | null>(null);

	// Cleanup polling on unmount
	useEffect(() => {
		return () => {
			if (pollTimerRef.current) clearInterval(pollTimerRef.current);
		};
	}, []);

	const stopPolling = useCallback(() => {
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = undefined;
		}
		setIsPurchasing(false);
	}, []);

	const pollAndRefresh = useCallback(() => {
		creditsBefore.current = data?.availableCredits ?? null;
		let attempts = 0;
		const maxAttempts = 15;
		pollTimerRef.current = setInterval(async () => {
			attempts++;
			if (attempts >= maxAttempts) {
				stopPolling();
				return;
			}
			await queryClient.invalidateQueries({ queryKey: ["purchase", "credits"] });
		}, 2000);
	}, [queryClient, data?.availableCredits, stopPolling]);

	const handlePurchase = useCallback(
		async (slug: string) => {
			if (!user?.id) return;
			setIsPurchasing(true);
			try {
				const checkout = await createThemedCheckoutEmbed(slug, appTheme);
				checkout.addEventListener("success", (event) => {
					event.preventDefault();
					pollAndRefresh();
				});
				checkout.addEventListener("close", () => {
					setIsPurchasing(false);
				});
			} catch {
				setIsPurchasing(false);
			}
		},
		[user?.id, appTheme, pollAndRefresh],
	);

	useEffect(() => {
		if (
			isPurchasing &&
			creditsBefore.current !== null &&
			data?.availableCredits !== undefined &&
			data.availableCredits > creditsBefore.current
		) {
			stopPolling();
		}
	}, [isPurchasing, data?.availableCredits, stopPolling]);

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
				Generate a QR code to invite someone and discover how your personalities compare.
			</p>

			{/* Credit count */}
			<div className="flex items-center gap-2 mb-4">
				<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
					<Users className="h-3.5 w-3.5 mr-1.5" />
					{data.availableCredits} credit{data.availableCredits !== 1 ? "s" : ""}
				</span>
			</div>

			{hasCredits ? (
				<QrDrawerWithTrigger />
			) : (
				<div className="space-y-2">
					<Button
						data-testid="get-credits-button"
						className="w-full min-h-11"
						onClick={() => handlePurchase("relationship-single")}
						disabled={isPurchasing}
					>
						{isPurchasing ? (
							<Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
						) : (
							<Heart className="h-4 w-4 mr-2" />
						)}
						Get 1 Credit — &euro;5
					</Button>
					<Button
						data-testid="get-credits-5pack-button"
						variant="outline"
						className="w-full min-h-11"
						onClick={() => handlePurchase("relationship-5pack")}
						disabled={isPurchasing}
					>
						{isPurchasing ? (
							<Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" />
						) : (
							<Users className="h-4 w-4 mr-2" />
						)}
						Get 5 Credits — &euro;15
					</Button>
				</div>
			)}
		</div>
	);
}
