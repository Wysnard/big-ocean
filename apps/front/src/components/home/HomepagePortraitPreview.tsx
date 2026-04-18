import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
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
			className="homepage-portrait-surface min-h-[92svh] px-6 py-12 text-foreground sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
		>
			<div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-8">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<OceanHieroglyphSet size={14} />
						<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
							Portrait
						</p>
					</div>
					<h2 className="max-w-2xl font-sans text-4xl font-semibold tracking-tight text-foreground">
						What felt diffuse comes back as language you can keep.
					</h2>
				</div>
				<ArtifactSurfaceCard
					as="article"
					className="homepage-card-surface max-w-3xl rounded-lg border-border/70 p-8 shadow-[0_18px_50px_rgba(26,26,46,0.1)] backdrop-blur-sm"
				>
					<p className={letterHomepagePortraitBodyClass}>
						You are not indecisive so much as exquisitely alert to what each choice would cost. The pause
						people read as hesitation is often your way of refusing to flatten complexity before it has
						finished telling the truth.
					</p>
					<p className={cn(letterHomepagePortraitBodyClass, "mt-6")}>
						When Nerin writes you, she is not inventing a persona — she is naming what the conversation
						already showed, in sentences you can reread when the day thins you out.
					</p>
				</ArtifactSurfaceCard>
				<div
					aria-hidden
					data-testid="homepage-timeline-bleed-portrait-to-world"
					className="homepage-bleed-portrait-to-world -mx-6 mt-12 h-20 shrink-0 sm:-mx-8 lg:-mx-12"
				/>
			</div>
		</section>
	);
}
