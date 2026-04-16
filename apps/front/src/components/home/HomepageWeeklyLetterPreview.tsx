import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";
import { letterHomepageWeeklyBodyClass } from "@workspace/ui/lib/letter-reading-typography";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Read-only Sunday weekly letter snippet for the homepage (static; not WeeklyLetterCard).
 */
export function HomepageWeeklyLetterPreview() {
	return (
		<ArtifactSurfaceCard
			as="article"
			data-slot="homepage-weekly-letter-preview"
			data-testid="homepage-weekly-letter-preview"
			className="border-cyan-200/80 bg-gradient-to-br from-cyan-50/90 to-white p-6 shadow-[0_18px_50px_rgba(8,145,178,0.12)] dark:border-cyan-800/60 dark:from-cyan-950/40 dark:to-slate-900"
		>
			<p className="text-xs font-semibold tracking-wide text-cyan-800 uppercase dark:text-cyan-200">
				Sunday letter
			</p>
			<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sunday, March 22</p>
			<p className={cn(letterHomepageWeeklyBodyClass, "mt-4")}>
				This week held more contradiction than you gave yourself credit for — not confusion, but
				fidelity to things that do not simplify cleanly.
			</p>
			<p className={cn(letterHomepageWeeklyBodyClass, "mt-3")}>
				I will stay with the tension next Sunday too. You do not have to resolve it alone in one pass.
			</p>
		</ArtifactSurfaceCard>
	);
}
