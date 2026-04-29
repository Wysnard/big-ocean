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
			className="border-t border-border/60 bg-background px-6 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
		>
			<div className="mx-auto flex max-w-6xl flex-col gap-12 lg:gap-16">
				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
						World After
					</p>
					<h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						This isn&apos;t a one-time read.
					</h2>
					<p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
						When a decision stalls, when a relationship gets loud, when you lose your footing, the
						portrait is somewhere to come back to—an honest, objective reference point with no stake in
						who you become next.
					</p>
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
			</div>
		</section>
	);
}
