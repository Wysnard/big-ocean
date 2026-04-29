import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";
import { letterHomepagePortraitBodyClass } from "@workspace/ui/lib/letter-reading-typography";
import { cn } from "@workspace/ui/lib/utils";
import { getHomepagePhaseConfig } from "./homepage-phase-config";

/**
 * Phase 2 — Portrait paragraph in letter / reading register (static).
 */
export function HomepagePortraitPreview() {
	return (
		<section
			id={getHomepagePhaseConfig("portrait").sectionId}
			data-homepage-phase="portrait"
			className="border-t border-border/60 bg-background px-6 py-16 text-foreground sm:px-8 sm:py-20 lg:px-12 lg:py-24"
		>
			<div className="mx-auto flex max-w-4xl flex-col gap-8">
				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
						Portrait
					</p>
					<h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
						Language you recognize, in a shape that finally fits.
					</h2>
				</div>
				<ArtifactSurfaceCard
					as="article"
					className="homepage-card-surface max-w-3xl rounded-lg border-border/70 p-8 shadow-[0_18px_50px_rgba(26,26,46,0.1)] backdrop-blur-sm"
				>
					<p className={letterHomepagePortraitBodyClass}>
						You leave with a written portrait of yourself: language you recognize, organized in a shape
						that finally fits—grounded in established personality science, not party-trick types. Your
						archetype, your OCEAN code, and a personal letter from Nerin.
					</p>
					<p className={cn(letterHomepagePortraitBodyClass, "mt-6")}>
						When Nerin writes you, she is not inventing a persona—she is naming what the conversation
						already showed, in sentences you can reread when the day thins you out.
					</p>
				</ArtifactSurfaceCard>
			</div>
		</section>
	);
}
