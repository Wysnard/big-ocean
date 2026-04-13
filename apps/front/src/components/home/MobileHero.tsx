import { Link } from "@tanstack/react-router";
import { OceanHieroglyphSet } from "@workspace/ui/components/ocean-hieroglyph-set";
import { HomepageDynamicHook } from "./HomepageDynamicHook";

export function MobileHero() {
	return (
		<section
			data-slot="mobile-homepage-hero"
			data-testid="mobile-homepage-hero"
			className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_55%,#fff7ed_100%)] px-6 py-8 lg:hidden"
		>
			<div className="mx-auto flex max-w-xl flex-col gap-6">
				<div className="flex items-center gap-2 text-slate-950">
					<span className="font-heading text-2xl font-bold tracking-tight">big-</span>
					<OceanHieroglyphSet size={22} />
				</div>

				<HomepageDynamicHook phase="conversation" compact />

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						to="/signup"
						search={{
							sessionId: undefined,
							redirectTo: undefined,
						}}
						className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white"
					>
						Start yours &rarr;
					</Link>
					<Link
						to="/login"
						search={{
							sessionId: undefined,
							redirectTo: undefined,
						}}
						className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 text-sm font-medium text-slate-700"
					>
						Log in
					</Link>
				</div>

				<p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
					~30 min · Free · No credit card
				</p>
			</div>
		</section>
	);
}
