import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { Sparkles } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
	pollUntilConversationExtensionEntitled,
	subscriptionStateQueryKey,
} from "@/hooks/use-subscription-state";
import { createThemedCheckoutEmbed, POLAR_CHECKOUT_SLUG_SUBSCRIPTION } from "@/lib/polar-checkout";

/**
 * Subscription pitch section for the Me page (Story 3.5, checkout Story 8.2).
 *
 * Free users: Polar embedded checkout for the €9.99/mo subscription product.
 * Subscriber branch is composed on the Me route (`SubscriptionValueSummary`).
 */
export function SubscriptionPitchSection() {
	const { appTheme } = useTheme();
	const queryClient = useQueryClient();
	const checkoutTriggerRef = useRef<HTMLButtonElement>(null);

	const runPostCheckoutRefresh = () => {
		void (async () => {
			try {
				await queryClient.invalidateQueries({ queryKey: subscriptionStateQueryKey });
				const ok = await pollUntilConversationExtensionEntitled(queryClient);
				if (!ok) {
					toast.message(
						"We're still confirming your subscription — refresh the page in a moment if Me doesn't update.",
					);
				}
			} catch (err: unknown) {
				toast.error(
					err instanceof Error ? err.message : "Could not refresh subscription status. Try again.",
				);
			}
		})();
	};

	const handleCheckout = () => {
		void createThemedCheckoutEmbed(POLAR_CHECKOUT_SLUG_SUBSCRIPTION, appTheme, undefined, {
			onSuccess: runPostCheckoutRefresh,
			onClose: () => {
				queueMicrotask(() => checkoutTriggerRef.current?.focus());
			},
		}).catch((err: unknown) => {
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
				ref={checkoutTriggerRef}
				data-testid="subscription-checkout-cta"
				onClick={handleCheckout}
				className="min-h-11 rounded-full px-6"
				size="lg"
			>
				<Sparkles className="size-4" aria-hidden="true" />
				Continue with Nerin
			</Button>
		</div>
	);
}
