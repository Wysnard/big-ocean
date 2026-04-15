import { Link } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { useHomepagePhase } from "./DepthScrollProvider";
import { HomepageDynamicHook } from "./HomepageDynamicHook";

export function StickyAuthPanel() {
	const currentPhase = useHomepagePhase();

	return (
		<aside className="hidden lg:block" aria-label="Sign up">
			{/* Match global Header (h-14): sticky below header, height = viewport minus header — avoid h-screen extending past fold */}
			<div className="sticky top-14 z-10 flex h-[calc(100dvh-3.5rem)] min-h-0 items-center px-6 py-8 xl:px-10">
				<div
					data-slot="sticky-auth-panel"
					data-phase={currentPhase}
					className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/92 p-8 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur"
				>
					<div
						className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-sky-300 via-rose-300 to-amber-300"
						aria-hidden="true"
					/>

					<div className="space-y-8">
						<div className="flex items-center gap-2 text-slate-900">
							<span className="font-heading text-2xl font-bold tracking-tight">big-</span>
							<OceanHieroglyphSet size={22} />
						</div>

						<div className="space-y-4">
							<HomepageDynamicHook lightBackground />
							<p className="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-600">
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
								className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 text-sm font-medium text-slate-800 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-200 dark:bg-white/80 dark:text-slate-800 dark:hover:border-slate-300 dark:hover:bg-slate-50 dark:hover:text-slate-950"
							>
								Already have an account? Log in
							</Link>
							<p className="text-xs font-medium tracking-[0.18em] text-slate-600 uppercase dark:text-slate-600">
								~30 min · Free · No credit card
							</p>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
