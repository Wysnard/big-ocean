import { Link } from "@tanstack/react-router";
import { HomepageDynamicHook } from "./HomepageDynamicHook";

export function MobileHero() {
	return (
		<section
			data-slot="mobile-homepage-hero"
			data-testid="mobile-homepage-hero"
			className="homepage-hero-surface relative overflow-hidden border-b border-border px-6 py-8 text-foreground lg:hidden"
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
						className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-secondary px-5 text-base font-semibold text-primary-foreground shadow-[0_10px_28px_rgba(255,0,128,0.22)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(255,0,128,0.28)]"
					>
						Start yours &rarr;
					</Link>
					<Link
						to="/login"
						search={{
							sessionId: undefined,
							redirectTo: undefined,
						}}
						className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border bg-card/80 px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent"
					>
						Log in
					</Link>
				</div>

				<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
					~30 min · Free · No credit card
				</p>
			</div>
		</section>
	);
}
