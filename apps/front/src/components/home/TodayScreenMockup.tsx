import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";

/**
 * Static marketing preview of the Today surface (not wired to /today APIs).
 */
export function TodayScreenMockup() {
	const moods = ["🙂", "😐", "🌤️", "😔", "💙", "✨", "🌙"];

	return (
		<div
			data-slot="today-screen-mockup"
			data-testid="today-screen-mockup"
			className="relative mx-auto w-full max-w-sm"
		>
			<ArtifactSurfaceCard className="rounded-[2rem] border-slate-200/80 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 dark:border-slate-600/80 dark:bg-slate-900 dark:ring-white/10">
				<div className="mb-4 flex items-center justify-between gap-2">
					<p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
						Today
					</p>
					<span className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.65rem] font-medium text-teal-800 dark:bg-teal-950/80 dark:text-teal-200">
						Thu
					</span>
				</div>
				<p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
					Quiet check-in: what color is your mood today?
				</p>
				<div className="mb-4 flex flex-wrap gap-2" data-testid="today-mood-dots">
					{moods.map((emoji) => (
						<span
							key={emoji}
							className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 text-lg dark:border-slate-600 dark:bg-slate-800"
						>
							{emoji}
						</span>
					))}
				</div>
				<div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
					Journal — a line you do not have to polish. Nerin reads it as texture, not performance.
				</div>
			</ArtifactSurfaceCard>
		</div>
	);
}
