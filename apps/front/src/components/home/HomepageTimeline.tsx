import { getHomepagePhaseConfig } from "./homepage-phase-config";

export function HomepageTimeline() {
	return (
		<div data-slot="homepage-timeline" className="flex min-w-0 flex-col">
			<section
				id={getHomepagePhaseConfig("conversation").sectionId}
				data-homepage-phase="conversation"
				className="min-h-[92svh] bg-slate-950 px-6 py-12 text-white sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
			>
				<div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-8">
					<div className="space-y-3">
						<p className="text-xs font-semibold tracking-[0.22em] text-sky-200 uppercase">Conversation</p>
						<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-white">
							Recognition starts before anything is explained.
						</h2>
					</div>
					<div className="grid gap-4">
						<article className="max-w-xl rounded-[1.75rem] border border-white/10 bg-white/6 p-5 shadow-[0_18px_50px_rgba(8,15,36,0.28)] backdrop-blur-sm">
							<p className="text-sm font-medium text-sky-200">Nerin</p>
							<p className="mt-3 text-base leading-7 text-slate-100">
								You keep describing the same tension from different angles. It sounds less like indecision
								and more like you are trying to protect something precise.
							</p>
						</article>
						<article className="ml-auto max-w-lg rounded-[1.75rem] border border-sky-200/15 bg-sky-400/10 p-5">
							<p className="text-sm font-medium text-slate-300">You</p>
							<p className="mt-3 text-base leading-7 text-slate-100">
								That lands harder than I expected. I think I have been calling it overthinking because I did
								not have better language for it.
							</p>
						</article>
						<article className="max-w-2xl rounded-[1.75rem] border border-violet-300/15 bg-violet-400/10 p-5">
							<p className="text-sm font-medium text-violet-200">Nerin</p>
							<p className="mt-3 text-base leading-7 text-slate-100">
								That is the moment the conversation becomes useful. Not when it labels you. When it notices
								something you have been carrying in plain sight.
							</p>
						</article>
					</div>
				</div>
			</section>

			<section
				id={getHomepagePhaseConfig("portrait").sectionId}
				data-homepage-phase="portrait"
				className="min-h-[92svh] bg-[linear-gradient(180deg,#fff7ed_0%,#fffaf2_52%,#ffffff_100%)] px-6 py-12 text-slate-900 sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
			>
				<div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-8">
					<div className="space-y-3">
						<p className="text-xs font-semibold tracking-[0.22em] text-amber-700 uppercase">Portrait</p>
						<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
							What felt diffuse comes back as language you can keep.
						</h2>
					</div>
					<article className="max-w-3xl rounded-[2rem] border border-amber-200/70 bg-white/78 p-8 shadow-[0_18px_50px_rgba(120,53,15,0.12)] backdrop-blur-sm">
						<p className="font-serif text-[1.45rem] leading-9 text-slate-800">
							You are not indecisive so much as exquisitely alert to what each choice would cost. The pause
							people read as hesitation is often your way of refusing to flatten complexity before it has
							finished telling the truth.
						</p>
					</article>
				</div>
			</section>

			<section
				id={getHomepagePhaseConfig("worldAfter").sectionId}
				data-homepage-phase="worldAfter"
				className="min-h-[92svh] bg-[linear-gradient(180deg,#ecfeff_0%,#f8fafc_46%,#ffffff_100%)] px-6 py-12 text-slate-900 sm:px-8 lg:min-h-screen lg:px-12 lg:py-16"
			>
				<div className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-8">
					<div className="space-y-3">
						<p className="text-xs font-semibold tracking-[0.22em] text-teal-700 uppercase">World After</p>
						<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
							The conversation becomes a place you can return to, not a one-time result.
						</h2>
					</div>
					<div className="grid gap-4 xl:grid-cols-3">
						<article className="rounded-[1.75rem] border border-teal-200/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(13,148,136,0.1)]">
							<p className="text-sm font-semibold text-teal-700">Today</p>
							<p className="mt-3 text-sm leading-6 text-slate-600">
								A quieter daily surface that keeps your patterns close enough to notice.
							</p>
						</article>
						<article className="rounded-[1.75rem] border border-cyan-200/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(8,145,178,0.1)]">
							<p className="text-sm font-semibold text-cyan-700">Weekly Letter</p>
							<p className="mt-3 text-sm leading-6 text-slate-600">
								Nerin returns on Sunday with what held, what shifted, and what wants attention next.
							</p>
						</article>
						<article className="rounded-[1.75rem] border border-sky-200/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(14,165,233,0.12)]">
							<p className="text-sm font-semibold text-sky-700">Relationship Letter</p>
							<p className="mt-3 text-sm leading-6 text-slate-600">
								The same lens can hold two people at once, with tenderness instead of reduction.
							</p>
						</article>
					</div>
				</div>
			</section>

			<section
				id={getHomepagePhaseConfig("reassurance").sectionId}
				data-homepage-phase="reassurance"
				className="min-h-[84svh] bg-white px-6 py-12 text-slate-900 sm:px-8 lg:min-h-[90svh] lg:px-12 lg:py-16"
			>
				<div className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-8">
					<div className="space-y-3">
						<p className="text-xs font-semibold tracking-[0.22em] text-rose-600 uppercase">
							Before you start
						</p>
						<h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
							No performance required. Just enough room to notice what is already there.
						</h2>
					</div>
					<div className="grid gap-4 lg:grid-cols-3">
						<article className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
							<h3 className="text-base font-semibold text-slate-950">It is a conversation.</h3>
							<p className="mt-3 text-sm leading-6 text-slate-600">
								Nothing to study for, nothing to optimize, nothing to get right.
							</p>
						</article>
						<article className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
							<h3 className="text-base font-semibold text-slate-950">It takes time on purpose.</h3>
							<p className="mt-3 text-sm leading-6 text-slate-600">
								About thirty minutes, so the portrait has enough texture to be worth keeping.
							</p>
						</article>
						<article className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
							<h3 className="text-base font-semibold text-slate-950">The tone stays gentle.</h3>
							<p className="mt-3 text-sm leading-6 text-slate-600">
								Everything Nerin writes is designed to feel clarifying, not extractive.
							</p>
						</article>
					</div>
				</div>
			</section>
		</div>
	);
}
