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
			className="min-h-[92svh] bg-[linear-gradient(180deg,#fff7ed_0%,#fffaf2_52%,#ffffff_100%)] px-6 py-12 text-slate-900 sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
		>
			<div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-8">
				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase">Portrait</p>
					<h2 className="max-w-2xl font-sans text-4xl font-semibold tracking-tight text-slate-950">
						What felt diffuse comes back as language you can keep.
					</h2>
				</div>
				<ArtifactSurfaceCard
					as="article"
					className="max-w-3xl rounded-[2rem] border-amber-200/70 bg-white/78 p-8 shadow-[0_18px_50px_rgba(120,53,15,0.12)] backdrop-blur-sm"
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
					className="-mx-6 mt-12 h-20 shrink-0 bg-gradient-to-b from-transparent via-amber-50/80 to-[#ecfeff] sm:-mx-8 lg:-mx-12 dark:via-amber-950/35 dark:to-slate-900/90"
				/>
			</div>
		</section>
	);
}
