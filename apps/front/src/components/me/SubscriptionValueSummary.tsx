import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActivateExtension } from "@/hooks/use-activate-extension";
import { isConversationApiError } from "@/hooks/use-conversation";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
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
 * Subscriber variant of the Me page subscription section (Story 8.2, UX-DR36; Story 8.3 extension CTA).
 */
export function SubscriptionValueSummary({ subscribedSince }: SubscriptionValueSummaryProps) {
	const navigate = useNavigate();
	const subscriptionQuery = useSubscriptionState(true);
	const activateExtension = useActivateExtension();

	const formattedSince = subscribedSince != null ? formatSubscribedSince(subscribedSince) : null;
	const sinceSentence =
		formattedSince != null ? `Subscribed since ${formattedSince}.` : "You're subscribed.";

	const showExtendCta =
		!subscriptionQuery.isPending &&
		subscriptionQuery.data?.isEntitledToConversationExtension === true;

	const handleManage = () => {
		void openPolarCustomerPortal().catch((err: unknown) => {
			toast.error(err instanceof Error ? err.message : "Could not open subscription management");
		});
	};

	const handleContinueConversation = () => {
		activateExtension.mutate(undefined, {
			onSuccess: (data) => {
				void navigate({
					to: "/chat",
					search: { sessionId: data.sessionId },
				});
			},
			onError: (err: unknown) => {
				if (isConversationApiError(err) && err.status === 404) {
					toast.error("No completed assessment is ready to extend yet.");
					return;
				}
				if (isConversationApiError(err) && err.status === 403) {
					toast.error("A subscription is required to extend your conversation.");
					return;
				}
				toast.error(err instanceof Error ? err.message : "Could not start your extension");
			},
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

			{showExtendCta ? (
				<div className="space-y-2 border-t border-border/60 pt-5">
					<Button
						type="button"
						variant="default"
						className="rounded-full"
						data-testid="subscription-extend-conversation-cta"
						disabled={activateExtension.isPending}
						onClick={handleContinueConversation}
					>
						{activateExtension.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" aria-hidden />
								Starting…
							</>
						) : (
							"Continue with Nerin"
						)}
					</Button>
					<p className="text-sm text-muted-foreground">+15 new exchanges</p>
				</div>
			) : null}

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
