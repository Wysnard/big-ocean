/**
 * Timeline Placeholder
 *
 * Left pane content for the split layout homepage.
 * Contains hero content (adapted — OCEAN shapes moved to auth panel),
 * HowItWorks section, and placeholders for Stories 9.3 and 9.4.
 */

import { Link } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { HowItWorks } from "./HowItWorks";

export function TimelinePlaceholder() {
	return (
		<div data-slot="timeline-placeholder" data-testid="timeline-placeholder">
			{/* Hero content — adapted for left pane (no OCEAN shapes, they're in the auth panel) */}
			<section
				data-slot="hero-section"
				data-testid="hero-section"
				className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center px-6 py-16 sm:px-12 lg:px-16"
			>
				{/* Brand mark (visible on mobile, hidden on desktop where auth panel shows it) */}
				<div className="mb-6 flex items-center gap-2 lg:hidden">
					<span className="font-heading text-4xl font-bold tracking-tight text-foreground">big-</span>
					<OceanHieroglyphSet size={36} className="sm:hidden" />
					<OceanHieroglyphSet size={44} className="hidden sm:inline-flex" />
				</div>

				<h1 className="mb-[18px] font-heading text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.06]">
					Not a personality quiz.{" "}
					<span className="bg-gradient-to-r from-primary via-[#FF1493] to-secondary bg-clip-text text-transparent">
						A conversation.
					</span>
				</h1>

				<p className="mb-6 max-w-[440px] text-[1.05rem] leading-[1.7] text-muted-foreground">
					A portrait of who you are that no test has ever given you.
				</p>

				<div className="mb-8 font-mono text-[.72rem] tracking-[.05em] text-muted-foreground">
					~30 MINUTES &middot; FREE &middot; JUST A CONVERSATION
				</div>

				{/* CTA — visible on mobile, hidden on desktop (auth panel has the form) */}
				<div className="flex flex-wrap items-center gap-3 lg:hidden">
					<Link
						to="/signup"
						search={{ redirectTo: undefined }}
						data-testid="hero-cta"
						className="inline-flex min-h-[44px] items-center gap-[10px] rounded-xl bg-gradient-to-r from-primary to-secondary px-[34px] py-[15px] font-heading text-[.95rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:translate-y-[-2px] hover:shadow-[0_8px_28px_rgba(255,0,128,.28)]"
					>
						Start yours &rarr;
					</Link>
				</div>
			</section>

			{/* How It Works */}
			<HowItWorks />

			{/* Placeholder for Story 9.3: Timeline Phases (conversation preview, portrait excerpt, world-after) */}
			<section
				data-slot="timeline-phases-placeholder"
				data-testid="timeline-phases-placeholder"
				className="px-6 py-16 sm:px-12 lg:px-16"
				aria-hidden="true"
			/>

			{/* Placeholder for Story 9.4: Reassurance Section (fear-addressing cards) */}
			<section
				data-slot="reassurance-placeholder"
				data-testid="reassurance-placeholder"
				className="px-6 py-16 sm:px-12 lg:px-16"
				aria-hidden="true"
			/>

			{/* Bottom padding to account for StickyBottomCTA on mobile */}
			<div className="h-20 lg:hidden" />
		</div>
	);
}
