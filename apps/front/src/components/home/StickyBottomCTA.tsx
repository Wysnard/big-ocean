/**
 * Sticky Bottom CTA
 *
 * Fixed bottom bar for mobile users with a "Start yours" button.
 * Hidden on desktop where the sticky auth panel is visible.
 */

import { Link } from "@tanstack/react-router";

interface StickyBottomCTAProps {
	isAuthenticated: boolean;
}

export function StickyBottomCTA({ isAuthenticated }: StickyBottomCTAProps) {
	return (
		<div
			data-slot="sticky-bottom-cta"
			data-testid="sticky-bottom-cta"
			className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden"
		>
			{isAuthenticated ? (
				<Link
					to="/chat"
					data-testid="mobile-continue-cta"
					className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-heading text-[.95rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)]"
				>
					Continue to Nerin &rarr;
				</Link>
			) : (
				<Link
					to="/signup"
					search={{ sessionId: undefined, redirectTo: undefined }}
					data-testid="mobile-signup-cta"
					className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary font-heading text-[.95rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-1px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)]"
				>
					Start yours &rarr;
				</Link>
			)}
		</div>
	);
}
