import { Link } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { useHomepagePhase } from "./DepthScrollProvider";
import { HomepageDynamicHook } from "./HomepageDynamicHook";

export function StickyAuthPanel() {
	const currentPhase = useHomepagePhase();

	return (
		<aside className="hidden lg:block" aria-label="Sign up">
			<div className="sticky top-0 flex h-screen items-center px-6 py-8 xl:px-10">
				<div
					data-slot="sticky-auth-panel"
					data-phase={currentPhase}
					className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/92 p-8 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur"
				>
					<div
						className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-sky-300 via-rose-300 to-amber-300"
						aria-hidden="true"
					/>

					<div className="space-y-8">
						<div className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
							<span className="font-heading text-2xl font-bold tracking-tight">big-</span>
							<OceanHieroglyphSet size={22} />
						</div>

						<div className="space-y-4">
							<HomepageDynamicHook />
							<p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
								~30 minutes with Nerin. A portrait written in language you'll recognize.
							</p>
						</div>

						<div className="space-y-3">
							<Link
								to="/signup"
								search={{
									sessionId: undefined,
									redirectTo: undefined,
								}}
								className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-900"
							>
								Start yours &rarr;
							</Link>
							<Link
								to="/login"
								search={{
									sessionId: undefined,
									redirectTo: undefined,
								}}
								className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-50"
							>
								Already have an account? Log in
							</Link>
							<p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
								~30 min · Free · No credit card
							</p>
						</div>
					</div>

					<div className="grid grid-cols-5 items-end gap-3 pt-8" aria-hidden="true">
						<div className="h-14 rounded-full bg-sky-400/70 motion-safe:animate-[breathe_6s_ease-in-out_infinite]" />
						<div
							className="h-16 rounded-[1.1rem] bg-violet-400/70 motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
							style={{ animationDelay: "-1.2s" }}
						/>
						<div
							className="h-[4.5rem] [clip-path:polygon(50%_0%,100%_100%,0%_100%)] bg-amber-400/70 motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
							style={{ animationDelay: "-2.4s" }}
						/>
						<div
							className="h-12 rounded-t-full bg-teal-400/70 motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
							style={{ animationDelay: "-3.6s" }}
						/>
						<div
							className="mx-auto h-12 w-12 rotate-45 bg-rose-400/70 motion-safe:animate-[breathe_6s_ease-in-out_infinite]"
							style={{ animationDelay: "-4.8s" }}
						/>
					</div>
				</div>
			</div>
		</aside>
	);
}
