import { getHomepagePhaseConfig } from "./homepage-phase-config";

/**
 * Shell only — Story 9.4 replaces body with “Before you start” cards + evidence.
 * Keeps `data-homepage-phase` + section id for DepthScrollProvider / hook “YOURS.” phase.
 */
export function HomepageReassurancePlaceholder() {
	return (
		<section
			id={getHomepagePhaseConfig("reassurance").sectionId}
			data-homepage-phase="reassurance"
			className="min-h-[72svh] bg-white px-6 py-16 text-slate-900 sm:px-8 lg:min-h-[80svh] lg:px-12 lg:py-20 dark:bg-slate-950"
		>
			<div
				className="mx-auto flex min-h-[min(48svh,24rem)] max-w-5xl flex-col items-center justify-center gap-4 text-center"
				data-testid="homepage-reassurance-placeholder"
			>
				<p className="text-xs font-semibold tracking-[0.22em] text-rose-600 uppercase dark:text-rose-300">
					Before you start
				</p>
				<p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
					A short pause here — what you need to feel safe shows up next.
				</p>
				<span className="sr-only">Full reassurance cards ship in a later release.</span>
			</div>
		</section>
	);
}
