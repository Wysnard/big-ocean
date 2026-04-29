import { Link } from "@tanstack/react-router";
import { cn } from "@workspace/ui/lib/utils";

interface HomepageHeroProps {
	className?: string;
}

const TAGLINE = "~30 min · Free · No credit card";

/**
 * Single hero block for `/`: one `<h1>` for the product promise. Breakpoints use Tailwind only
 * (`lg:hidden`, `hidden lg:inline`, etc.) — no `variant` prop or JS viewport state. The sticky
 * auth card carries the phase hook as `<h2>`.
 *
 * Min height matches the sticky rail (`100dvh` minus the global header) so the first viewport does
 * not show the timeline section below the fold.
 */
export function HomepageHero({ className }: HomepageHeroProps) {
	return (
		<section
			data-slot="homepage-hero"
			data-testid="homepage-hero"
			className={cn(
				"flex min-h-[calc(100dvh-3.5rem)] flex-col justify-center border-b border-border/60 bg-background px-6 py-10 text-foreground sm:py-12 lg:px-12 lg:py-16",
				className,
			)}
		>
			<div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-6">
				<p className="text-xs font-semibold tracking-[0.22em] text-muted-foreground uppercase">
					big-ocean
				</p>

				<h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground leading-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">
					Understand yourself—and how you move through your relationships—in one guided conversation.
				</h1>

				<p className="max-w-prose text-base leading-7 text-muted-foreground lg:text-lg lg:leading-8">
					Spend ~30 minutes with Nerin, your conversational guide. You leave with a written portrait of
					who you are—grounded in personality science—and a place you can return to as you change.
				</p>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<Link
						to="/signup"
						search={{ redirectTo: undefined }}
						data-testid="homepage-hero-signup-cta"
						className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-6 font-heading text-base font-semibold text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
					>
						<span className="lg:hidden">Begin your portrait</span>
						<span className="hidden lg:inline">Start yours</span>
						<span aria-hidden="true">&rarr;</span>
					</Link>
					<Link
						to="/login"
						search={{ redirectTo: undefined }}
						className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent lg:hidden"
					>
						Log in
					</Link>
					<span className="hidden text-sm text-muted-foreground lg:inline">
						Returning?{" "}
						<Link
							to="/login"
							search={{ redirectTo: undefined }}
							className="font-medium text-foreground underline-offset-4 hover:underline"
						>
							Log in
						</Link>{" "}
						on the right.
					</span>
				</div>

				<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
					{TAGLINE}
				</p>
			</div>
		</section>
	);
}
