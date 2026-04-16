import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { ArrowLeft, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { readingMarkdownComponents } from "@/components/results/portrait-markdown";
import {
	pollUntilConversationExtensionEntitled,
	subscriptionStateQueryKey,
	useSubscriptionState,
} from "@/hooks/use-subscription-state";
import { createThemedCheckoutEmbed, POLAR_CHECKOUT_SLUG_SUBSCRIPTION } from "@/lib/polar-checkout";

export interface WeeklyLetterReadingViewProps {
	readonly content: string;
}

/**
 * Focused reading surface for Nerin's weekly letter (Story 5.2).
 * Shell aligned with PortraitReadingView letter register.
 */
export function WeeklyLetterReadingView({ content }: WeeklyLetterReadingViewProps) {
	const { appTheme } = useTheme();
	const queryClient = useQueryClient();
	const subscription = useSubscriptionState();

	const runPostCheckoutRefresh = () => {
		void (async () => {
			try {
				await queryClient.invalidateQueries({ queryKey: subscriptionStateQueryKey });
				const ok = await pollUntilConversationExtensionEntitled(queryClient);
				if (!ok) {
					toast.message("We're still confirming your subscription — check your Me page in a moment.");
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
		}).catch((err: unknown) => {
			toast.error(err instanceof Error ? err.message : "Checkout couldn't start. Try again.");
		});
	};

	return (
		<div
			data-testid="weekly-letter-reading"
			data-slot="weekly-letter-reading-view"
			className="min-h-[calc(100dvh-3.5rem)] bg-background"
		>
			<article className="mx-auto max-w-[65ch] px-6 py-12 sm:py-16">
				<div className="mb-8">
					<Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-foreground/70" asChild>
						<Link to="/today" data-testid="weekly-letter-back-link">
							<ArrowLeft className="size-4" aria-hidden />
							Back to Today
						</Link>
					</Button>
				</div>

				<div className="text-base leading-[1.7] text-foreground/80">
					<Markdown components={readingMarkdownComponents}>{content}</Markdown>
				</div>

				{subscription.isPending ? (
					<section
						className="mt-16 pt-10 border-t border-border/20"
						data-testid="weekly-letter-subscription-loading"
						aria-label="Subscription"
						aria-busy="true"
					>
						<p className="text-sm leading-6 text-muted-foreground">Checking subscription…</p>
					</section>
				) : subscription.isError ? (
					<section
						className="mt-16 pt-10 border-t border-border/20 space-y-3"
						data-testid="weekly-letter-subscription-error"
						aria-label="Subscription"
					>
						<p className="text-sm leading-6 text-muted-foreground">
							We couldn&apos;t load subscription status. You can try again or refresh the page.
						</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-full"
							data-testid="weekly-letter-subscription-retry"
							disabled={subscription.isFetching}
							onClick={() => {
								void subscription.refetch();
							}}
						>
							Try again
						</Button>
					</section>
				) : subscription.data?.isEntitledToConversationExtension ? (
					<section
						className="mt-16 pt-10 border-t border-border/20 space-y-4"
						data-testid="weekly-letter-subscriber"
						aria-label="Subscription"
					>
						<p className="text-base leading-relaxed text-foreground/90">
							You already have the fuller weekly layer — I&apos;ll keep building on what we&apos;ve seen
							together.
						</p>
						<p className="text-sm leading-6 text-muted-foreground">
							Manage your subscription anytime from your Me page.
						</p>
						<Button variant="outline" className="rounded-full" asChild>
							<Link to="/me" data-testid="weekly-letter-me-link">
								Open Me
							</Link>
						</Button>
					</section>
				) : (
					<section
						className="mt-16 pt-10 border-t border-border/20 space-y-6"
						data-testid="weekly-letter-conversion"
						aria-label="Subscription"
					>
						<p
							className="text-base leading-relaxed text-foreground/90"
							data-testid="weekly-letter-cta-lead"
						>
							I have more I want to say about what comes next…
						</p>
						<p className="text-sm leading-6 text-muted-foreground">
							With a subscription, I can write you a fuller letter each week — with what to try, what
							patterns I&apos;m seeing across weeks, and what I think might help in the week ahead.
						</p>
						<div className="flex flex-col sm:flex-row gap-3 sm:items-center">
							<Button
								data-testid="weekly-letter-checkout-cta"
								onClick={handleCheckout}
								className="rounded-full gap-2"
								size="lg"
							>
								<Sparkles className="size-4" aria-hidden />
								Unlock Nerin&apos;s full weekly letter — €9.99/mo
							</Button>
							<Button variant="ghost" className="text-muted-foreground" asChild>
								<Link to="/today" data-testid="weekly-letter-dismiss">
									Not right now
								</Link>
							</Button>
						</div>
					</section>
				)}
			</article>
		</div>
	);
}
