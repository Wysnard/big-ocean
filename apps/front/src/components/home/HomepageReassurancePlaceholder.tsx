import { getHomepagePhaseConfig } from "./homepage-phase-config";
import { ReassuranceCards } from "./ReassuranceCards";

/**
 * Story 9.4 reassurance section.
 * Keeps `data-homepage-phase` + section id for DepthScrollProvider / hook "YOURS" phase.
 */
export function HomepageReassurancePlaceholder() {
	return (
		<section
			id={getHomepagePhaseConfig("reassurance").sectionId}
			data-homepage-phase="reassurance"
			className="border-t border-border/60 bg-background px-6 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
		>
			<div
				className="mx-auto flex max-w-6xl flex-col gap-8"
				data-testid="homepage-reassurance-placeholder"
			>
				<div className="max-w-2xl space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
						Before you start
					</p>
					<h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						Yours, always.
					</h2>
					<p className="text-sm leading-7 text-muted-foreground">
						One sitting. No prep, no wrong answers. Free, no credit card. The proof is already above—this
						last section is just here to lower the shoulders.
					</p>
				</div>

				<ReassuranceCards />
			</div>
		</section>
	);
}
