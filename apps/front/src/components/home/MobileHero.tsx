import { Link } from "@tanstack/react-router";
import { HomepageDynamicHook } from "./HomepageDynamicHook";

export function MobileHero() {
	return (
		<section
			data-slot="mobile-homepage-hero"
			data-testid="mobile-homepage-hero"
			className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_55%,#fff7ed_100%)] px-6 py-8 dark:border-border dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 lg:hidden"
		>
			<div className="mx-auto flex max-w-xl flex-col gap-6">
				<HomepageDynamicHook phase="conversation" compact />

				<div className="flex flex-col gap-3 sm:flex-row">
					<Link
						to="/signup"
						search={{
							sessionId: undefined,
							redirectTo: undefined,
						}}
						className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 text-base font-semibold text-white dark:bg-primary dark:text-primary-foreground"
					>
						Start yours &rarr;
					</Link>
					<Link
						to="/login"
						search={{
							sessionId: undefined,
							redirectTo: undefined,
						}}
						className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 text-sm font-medium text-slate-700 dark:border-border dark:bg-card/80 dark:text-foreground"
					>
						Log in
					</Link>
				</div>

				<p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase dark:text-muted-foreground">
					~30 min · Free · No credit card
				</p>
			</div>
		</section>
	);
}
