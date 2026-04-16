import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";

/**
 * Static relationship letter fragment (two names + paragraph).
 */
export function RelationshipLetterFragment() {
	return (
		<ArtifactSurfaceCard
			as="article"
			data-slot="relationship-letter-fragment"
			data-testid="relationship-letter-fragment"
			className="border-sky-200/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(14,165,233,0.1)] dark:border-sky-800/60 dark:bg-slate-900/90"
		>
			<p className="text-sm font-semibold text-sky-800 dark:text-sky-200">Maya & Jordan</p>
			<p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
				You both reach for repair, but not on the same clock — one needs words while the stillness still
				stings, and the other needs the room to return without a verdict waiting.
			</p>
		</ArtifactSurfaceCard>
	);
}
