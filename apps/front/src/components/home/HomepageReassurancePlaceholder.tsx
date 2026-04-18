import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { getHomepagePhaseConfig } from "./homepage-phase-config";
import { ReassuranceCards } from "./ReassuranceCards";

/**
 * Story 9.4 reassurance section.
 * Keeps `data-homepage-phase` + section id for DepthScrollProvider / hook "YOURS." phase.
 */
export function HomepageReassurancePlaceholder() {
	return (
		<section
			id={getHomepagePhaseConfig("reassurance").sectionId}
			data-homepage-phase="reassurance"
			className="homepage-reassurance-surface min-h-[72svh] px-6 py-16 text-foreground sm:px-8 lg:min-h-[80svh] lg:px-12 lg:py-20"
		>
			<div
				className="mx-auto flex min-h-[min(48svh,24rem)] max-w-6xl flex-col gap-8"
				data-testid="homepage-reassurance-placeholder"
			>
				<div className="mx-auto max-w-2xl space-y-4 text-center">
					<div className="flex items-center justify-center gap-3">
						<OceanHieroglyphSet size={14} />
						<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
							Before you start
						</p>
					</div>
					<h2 className="text-4xl font-semibold tracking-tight text-foreground">
						Three reasons this can feel easier than you expect.
					</h2>
					<p className="text-sm leading-7 text-muted-foreground">
						The proof comes first. This last section is just here to lower the shoulders.
					</p>
				</div>

				<ReassuranceCards />
			</div>
		</section>
	);
}
