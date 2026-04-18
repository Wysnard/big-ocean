import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
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
			className="homepage-world-surface min-h-[92svh] px-6 py-12 text-foreground sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
		>
			<div className="mx-auto flex max-w-6xl flex-col gap-12 lg:gap-16">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<OceanHieroglyphSet size={14} />
						<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
							World After
						</p>
					</div>
					<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
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
					className="homepage-bleed-world-to-reassurance -mx-6 mt-12 h-20 shrink-0 sm:-mx-8 lg:-mx-12"
				/>
			</div>
		</section>
	);
}
