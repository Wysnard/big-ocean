/**
 * Sticky Bottom CTA
 *
 * Fixed bottom bar for mobile users. On the marketing homepage it acts as a contextual nudge
 * (the in-flow primary signup CTA lives in the hero), so the copy here is intentionally
 * different from the hero CTA to avoid two stacked "Start yours" buttons on screen at once.
 * Hidden on desktop where the sticky auth panel is visible.
 */

import { Link } from "@tanstack/react-router";

interface StickyBottomCTAProps {
	isAuthenticated: boolean;
	/**
	 * When true (e.g. homepage `/`), always show the marketing signup CTA — ignores session so
	 * returning users still see the same bar; they use global nav to continue (product decision 3b).
	 */
	marketingOnly?: boolean;
}

export function StickyBottomCTA({ isAuthenticated, marketingOnly = false }: StickyBottomCTAProps) {
	const showContinue = !marketingOnly && isAuthenticated;

	return (
		<div
			data-slot="sticky-bottom-cta"
			data-testid="sticky-bottom-cta"
			data-marketing-only={marketingOnly ? "true" : undefined}
			className="fixed right-0 bottom-0 left-0 z-20 border-t border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden"
		>
			{showContinue ? (
				<Link
					to="/chat"
					data-testid="mobile-continue-cta"
					className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary font-heading text-[.95rem] font-semibold text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-md"
				>
					Continue to Nerin &rarr;
				</Link>
			) : (
				<div className="flex flex-col items-stretch gap-1.5">
					<Link
						to="/signup"
						search={{ redirectTo: undefined }}
						data-testid="mobile-signup-cta"
						className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary font-heading text-[.95rem] font-semibold text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-md"
					>
						Start yours &rarr;
					</Link>
					<p className="text-center text-[0.65rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
						~30 min · Free · No credit card
					</p>
				</div>
			)}
		</div>
	);
}
