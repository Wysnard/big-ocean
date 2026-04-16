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
			className="min-h-[72svh] bg-white px-6 py-16 text-slate-900 sm:px-8 lg:min-h-[80svh] lg:px-12 lg:py-20 dark:bg-slate-950"
		>
			<div
				className="mx-auto flex min-h-[min(48svh,24rem)] max-w-6xl flex-col gap-8"
				data-testid="homepage-reassurance-placeholder"
			>
				<div className="mx-auto max-w-2xl space-y-4 text-center">
					<p className="text-xs font-semibold tracking-[0.22em] text-rose-600 uppercase dark:text-rose-300">
						Before you start
					</p>
					<h2 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
						Three reasons this can feel easier than you expect.
					</h2>
					<p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
						The proof comes first. This last section is just here to lower the shoulders.
					</p>
				</div>

				<ReassuranceCards />
			</div>
		</section>
	);
}
