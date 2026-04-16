import { ArchetypeCarousel } from "./ArchetypeCarousel";
import { HomepageWeeklyLetterPreview } from "./HomepageWeeklyLetterPreview";
import { getHomepagePhaseConfig } from "./homepage-phase-config";
import { RelationshipLetterFragment } from "./RelationshipLetterFragment";
import { TodayScreenMockup } from "./TodayScreenMockup";

/**
 * Phase 3 — World After: Today mockup, weekly letter preview, relationship fragment, archetype carousel (epics 9.3).
 */
export function HomepageWorldAfterPreview() {
	return (
		<section
			id={getHomepagePhaseConfig("worldAfter").sectionId}
			data-homepage-phase="worldAfter"
			className="min-h-[92svh] bg-[linear-gradient(180deg,#ecfeff_0%,#f8fafc_46%,#ffffff_100%)] px-6 py-12 text-slate-900 sm:px-8 lg:min-h-screen lg:rounded-b-[2rem] lg:px-12 lg:py-16 dark:bg-[linear-gradient(180deg,#0f172a_0%,#0b1220_50%,#020617_100%)] dark:text-slate-50"
		>
			<div className="mx-auto flex max-w-6xl flex-col gap-12 lg:gap-16">
				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-teal-700 uppercase dark:text-teal-300">
						World After
					</p>
					<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
						The conversation becomes a place you can return to, not a one-time result.
					</h2>
				</div>

				<div className="grid gap-8 xl:grid-cols-2 xl:items-start">
					<div className="space-y-6">
						<TodayScreenMockup />
						<HomepageWeeklyLetterPreview />
					</div>
					<div className="space-y-6">
						<RelationshipLetterFragment />
					</div>
				</div>

				<div className="pt-4">
					<ArchetypeCarousel />
				</div>
				<div
					aria-hidden
					data-testid="homepage-timeline-bleed-world-to-reassurance"
					className="-mx-6 mt-12 h-20 shrink-0 bg-gradient-to-b from-transparent via-slate-100/90 to-white sm:-mx-8 lg:-mx-12 dark:via-slate-800/80 dark:to-slate-950"
				/>
			</div>
		</section>
	);
}
