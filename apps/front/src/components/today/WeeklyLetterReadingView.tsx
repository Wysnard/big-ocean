import { Link } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import { useTheme } from "@workspace/ui/hooks/use-theme";
import { ArrowLeft, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { readingMarkdownComponents } from "@/components/results/portrait-markdown";
import { createThemedCheckoutEmbed } from "@/lib/polar-checkout";

export interface WeeklyLetterReadingViewProps {
	readonly content: string;
}

/**
 * Focused reading surface for Nerin's weekly letter (Story 5.2).
 * Shell aligned with PortraitReadingView letter register.
 */
export function WeeklyLetterReadingView({ content }: WeeklyLetterReadingViewProps) {
	const { appTheme } = useTheme();

	const handleCheckout = () => {
		void createThemedCheckoutEmbed("extended-conversation", appTheme).catch((err) => {
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
			</article>
		</div>
	);
}
