import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { openPolarCustomerPortal } from "@/lib/polar-customer-portal";

function formatSubscribedSince(iso: string): string | null {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) {
		return null;
	}
	return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(d);
}

export interface SubscriptionValueSummaryProps {
	readonly subscribedSince: string | null;
}

/**
 * Subscriber variant of the Me page subscription section (Story 8.2, UX-DR36).
 * Extension / portrait-regen lines ship in Story 8.3.
 */
export function SubscriptionValueSummary({ subscribedSince }: SubscriptionValueSummaryProps) {
	const formattedSince = subscribedSince != null ? formatSubscribedSince(subscribedSince) : null;
	const sinceSentence =
		formattedSince != null ? `Subscribed since ${formattedSince}.` : "You're subscribed.";

	const handleManage = () => {
		void openPolarCustomerPortal().catch((err: unknown) => {
			toast.error(err instanceof Error ? err.message : "Could not open subscription management");
		});
	};

	return (
		<section
			data-testid="subscription-value-summary"
			aria-label="Your subscription"
			className="space-y-5"
		>
			<div className="space-y-2">
				<h3 className="text-lg font-medium text-foreground">You and Nerin</h3>
				<p className="text-base leading-7 text-foreground">
					{sinceSentence} Your conversation extension is included whenever you are ready to continue.
				</p>
				<p className="text-sm leading-6 text-muted-foreground">
					Cancel anytime from Polar — you keep access through the end of the billing period.
				</p>
			</div>
			<Button
				type="button"
				variant="outline"
				className="rounded-full"
				data-testid="subscription-manage-portal-cta"
				onClick={handleManage}
			>
				Manage subscription
			</Button>
		</section>
	);
}
