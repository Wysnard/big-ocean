/**
 * DashboardCreditsCard (Story 38-3, Task 6)
 *
 * Shows credit balance with QR drawer trigger or purchase CTA.
 */

import type { GetCreditsResponse } from "@workspace/contracts";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { Heart, Loader2, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { QrDrawerWithTrigger } from "@/components/relationship/QrDrawer";
import { createThemedCheckoutEmbed } from "@/lib/polar-checkout";

interface DashboardCreditsCardProps {
	credits: GetCreditsResponse | undefined;
	isLoading: boolean;
	userId: string | undefined;
}

export function DashboardCreditsCard({ credits, isLoading, userId }: DashboardCreditsCardProps) {
	const { appTheme } = useTheme();
	const [isPurchasing, setIsPurchasing] = useState(false);

	const handlePurchase = useCallback(
		async (slug: string) => {
			if (!userId) return;
			setIsPurchasing(true);
			try {
				const checkout = await createThemedCheckoutEmbed(slug, appTheme);
				checkout.addEventListener("success", (event) => {
					event.preventDefault();
					setIsPurchasing(false);
				});
				checkout.addEventListener("close", () => {
					setIsPurchasing(false);
				});
			} catch {
				setIsPurchasing(false);
			}
		},
		[userId, appTheme],
	);

	const hasCredits = credits && credits.availableCredits > 0;

	return (
		<Card data-testid="dashboard-credits-card">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Users className="w-5 h-5 text-primary" />
					<CardTitle className="text-lg font-display">Compare Personalities</CardTitle>
				</div>
			</CardHeader>

			<CardContent>
				{isLoading && (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="w-5 h-5 motion-safe:animate-spin text-muted-foreground" />
					</div>
				)}

				{!isLoading && credits && (
					<div className="space-y-4">
						{/* Credit count */}
						<div className="flex items-center gap-2">
							<span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
								<Users className="h-3.5 w-3.5 mr-1.5" />
								{credits.availableCredits} credit{credits.availableCredits !== 1 ? "s" : ""}
							</span>
						</div>

						{hasCredits ? (
							<QrDrawerWithTrigger />
						) : (
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground mb-3">
									Invite someone you care about and discover how your personalities compare.
								</p>
								<Button
									data-testid="dashboard-get-credits-button"
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
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
