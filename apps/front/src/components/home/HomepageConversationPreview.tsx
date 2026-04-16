import { ArtifactSurfaceCard } from "@workspace/ui/components/artifact-surface-card";
import { getHomepagePhaseConfig } from "./homepage-phase-config";

/**
 * Phase 1 — Conversation excerpt with a clear pattern-observation beat (static copy).
 */
export function HomepageConversationPreview() {
	return (
		<section
			id={getHomepagePhaseConfig("conversation").sectionId}
			data-homepage-phase="conversation"
			className="min-h-[92svh] bg-slate-950 px-6 py-12 text-white sm:px-8 lg:min-h-screen lg:rounded-b-[2.5rem] lg:px-12 lg:py-16"
		>
			<div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-8">
				<div className="space-y-3">
					<p className="text-xs font-semibold tracking-[0.22em] text-sky-200 uppercase">Conversation</p>
					<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-white">
						Recognition starts before anything is explained.
					</h2>
				</div>
				<div className="grid gap-4">
					<ArtifactSurfaceCard
						as="article"
						className="max-w-xl border-white/10 bg-white/6 p-5 shadow-[0_18px_50px_rgba(8,15,36,0.28)] backdrop-blur-sm"
					>
						<p className="text-sm font-medium text-sky-200">Nerin</p>
						<p className="mt-3 text-base leading-7 text-slate-100">
							I am here for whatever shows up — no performance, no right answers.
						</p>
					</ArtifactSurfaceCard>
					<ArtifactSurfaceCard
						as="article"
						className="ml-auto max-w-lg border-sky-200/15 bg-sky-400/10 p-5 shadow-none dark:shadow-none"
					>
						<p className="text-sm font-medium text-slate-300">You</p>
						<p className="mt-3 text-base leading-7 text-slate-100">
							I keep circling the same thing. Work, sleep, then the same worry on repeat.
						</p>
					</ArtifactSurfaceCard>
					<ArtifactSurfaceCard
						as="article"
						className="max-w-2xl border-violet-300/20 bg-violet-500/15 p-5 shadow-none dark:shadow-none"
					>
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-sm font-medium text-violet-200">Nerin</p>
							<span className="rounded-full border border-violet-300/25 bg-violet-950/40 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-violet-100 uppercase">
								Pattern
							</span>
						</div>
						<p className="mt-3 text-base leading-7 text-slate-100">
							You described restlessness at work and again before bed — same texture, different scenes.
							That repetition is not noise; it is the thread I am pulling gently on.
						</p>
					</ArtifactSurfaceCard>
				</div>
				{/* In-section bleed (AC5): keeps entire block inside `data-homepage-phase` for DepthScrollProvider */}
				<div
					aria-hidden
					data-testid="homepage-timeline-bleed-conversation-to-portrait"
					className="-mx-6 mt-12 h-20 shrink-0 bg-gradient-to-b from-transparent via-slate-900/70 to-[#fff7ed] sm:-mx-8 lg:-mx-12 dark:via-slate-950/80 dark:to-amber-950/55"
				/>
			</div>
		</section>
	);
}
