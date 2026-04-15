import { Button } from "@workspace/ui/components/button";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createThemedCheckoutEmbed } from "@/lib/polar-checkout";

/**
 * Subscription pitch section for the Me page (Story 3.5).
 *
 * Always shows the free-user pitch with a single Polar checkout CTA.
 * The subscriber branch (showing perks when subscription is active) will
 * be added in Epic 8 once subscription event types exist in the domain.
 */
export function SubscriptionPitchSection() {
	const { appTheme } = useTheme();

	const handleCheckout = () => {
		void createThemedCheckoutEmbed("extended-conversation", appTheme).catch((err) => {
			toast.error(err instanceof Error ? err.message : "Checkout couldn't start. Try again.");
		});
	};

	return (
		<div data-testid="subscription-pitch" className="space-y-5">
			<div className="space-y-2">
				<p className="text-base leading-7 text-foreground">
					Continue your conversation with Nerin — +15 exchanges + a new portrait
				</p>
				<p className="text-sm leading-6 text-muted-foreground">
					Pick up where you left off. Nerin will meet you again with everything she already knows.
				</p>
			</div>

			<Button
				data-testid="subscription-checkout-cta"
				onClick={handleCheckout}
				className="rounded-full"
				size="lg"
			>
				<Sparkles className="size-4" aria-hidden="true" />
				Continue with Nerin
			</Button>
		</div>
	);
}
