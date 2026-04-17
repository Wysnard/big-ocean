import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { AssessmentCTA } from "@/components/library/AssessmentCTA";
import { LibraryNav } from "@/components/library/LibraryNav";
import { PageMain } from "@/components/PageMain";

const DEMO = {
	title: "Openness to Experience",
	description:
		"How curiosity, imagination, and breadth of interest shape the stories you tell yourself—and how Nerin reads it alongside the rest of the ocean.",
	tier: "trait" as const,
};

const toc = [
	{ id: "overview", label: "Overview" },
	{ id: "spectrum", label: "Spectrum" },
	{ id: "practice", label: "Practice" },
] as const;

function DevIterationBanner({ iteration, label }: { iteration: 1 | 2 | 3; label: string }) {
	return (
		<div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center text-xs sm:text-sm">
			<span className="font-semibold text-foreground">
				Library article redesign · iteration {iteration}
			</span>
			<span className="text-muted-foreground"> — {label} · </span>
			<a
				href="/dev/components#library-composer"
				className="font-medium text-primary underline-offset-4 hover:underline"
			>
				Back to kitchen sink
			</a>
		</div>
	);
}

function ArticleProse({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"space-y-5 text-base leading-8 text-foreground/90 [&_h2]:scroll-mt-28 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:ml-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_strong]:font-semibold",
				className,
			)}
		>
			<p>
				<strong>Openness</strong> is one of the Big Five traits most people recognize in themselves
				without a lab coat: the pull toward new ideas, art, ideas that don&apos;t fit neatly, and
				futures that have not happened yet.
			</p>

			<h2 id="overview">Why it matters in the app</h2>
			<p>
				In big-ocean, openness shows up in how quickly you entertain reframes, how comfortable you are
				sitting with ambiguity, and how much novelty your nervous system can hold before it asks for a
				shoreline.
			</p>
			<ul>
				<li>
					High openness: rich metaphors, fast pattern connection, appetite for &quot;what if&quot;
				</li>
				<li>Moderate: selective novelty — new when it serves a purpose</li>
				<li>Lower: grounded repetition, clarity, and proof before motion</li>
			</ul>

			<h2 id="spectrum">Across the spectrum</h2>
			<p>
				Neither pole is a verdict. The question is fit: does your current season reward exploration, or
				does it reward finishing what you started?
			</p>
			<blockquote>
				&quot;The trait is not your personality — it is one lens on how energy moves when the world asks
				you to change.&quot;
			</blockquote>

			<h2 id="practice">A small practice</h2>
			<p>
				After your next check-in, name one new input you let in this week (a song, a conversation, a
				sentence from a book) and one you deliberately kept out. Notice the difference without judging
				it.
			</p>
		</div>
	);
}

function RelatedFacetsCard() {
	return (
		<Card className="rounded-2xl border-border/70 shadow-sm">
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Related facets</CardTitle>
				<CardDescription>Finer-grained handles on the same trait.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap gap-2">
				{["Intellect", "Imagination", "Artistic interest", "Emotionality"].map((name) => (
					<Badge key={name} variant="secondary" className="font-normal">
						{name}
					</Badge>
				))}
			</CardContent>
		</Card>
	);
}

/** Iteration 1 — editorial spine: sticky mini-TOC, left accent hero, reading column + end CTA. */
export function LibraryArticleRedesignIteration1() {
	return (
		<>
			<LibraryNav activeTier={DEMO.tier} articleTitle={DEMO.title} />
			<DevIterationBanner iteration={1} label="Editorial spine & TOC" />
			<PageMain className="bg-muted/20 px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-6xl">
					<div className="lg:grid lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:gap-12">
						<aside className="mb-8 lg:mb-0">
							<nav aria-label="On this page" className="lg:sticky lg:top-28">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
									On this page
								</p>
								<ul className="mt-4 space-y-2 text-sm">
									{toc.map((item) => (
										<li key={item.id}>
											<a
												href={`#${item.id}`}
												className="text-muted-foreground transition-colors hover:text-foreground"
											>
												{item.label}
											</a>
										</li>
									))}
								</ul>
							</nav>
						</aside>

						<div>
							<header className="border-l-4 border-primary pl-6">
								<p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
									Knowledge Library
								</p>
								<h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
									{DEMO.title}
								</h1>
								<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
									{DEMO.description}
								</p>
							</header>

							<article className="mt-10 max-w-prose border-t border-border/60 pt-10">
								<ArticleProse />
							</article>

							<div className="mt-14 max-w-prose space-y-6">
								<RelatedFacetsCard />
								<AssessmentCTA tier={DEMO.tier} />
							</div>
						</div>
					</div>
				</div>
			</PageMain>
		</>
	);
}

/** Iteration 2 — magazine split: hero column + story column, persistent rail for context + CTA. */
export function LibraryArticleRedesignIteration2() {
	return (
		<>
			<LibraryNav activeTier={DEMO.tier} articleTitle={DEMO.title} />
			<DevIterationBanner iteration={2} label="Magazine split & rail" />
			<PageMain className="bg-background px-0 pb-12 pt-0 sm:px-0">
				<div className="mx-auto max-w-6xl border-x border-border/60">
					<div className="grid lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
						<div className="flex flex-col justify-end bg-muted/35 px-6 py-12 sm:px-10 lg:min-h-[28rem] lg:py-16">
							<p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
								Trait · Knowledge Library
							</p>
							<h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[2.75rem] lg:leading-[1.05]">
								{DEMO.title}
							</h1>
							<p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
								{DEMO.description}
							</p>
							<p className="mt-8 text-caption text-muted-foreground">
								About 4 min read · Dev sample content
							</p>
						</div>

						<div className="border-t border-border lg:border-l lg:border-t-0">
							<div className="px-6 py-10 sm:px-10">
								<blockquote className="font-heading text-xl font-medium leading-snug text-foreground/85 sm:text-2xl">
									Openness is where metaphor meets method: the trait that decides whether a new frame feels
									like oxygen or weather.
								</blockquote>
								<div className="mt-10">
									<ArticleProse />
								</div>
							</div>
						</div>
					</div>

					<div className="grid gap-6 border-t border-border bg-card/40 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
						<div className="min-w-0">
							<h2 className="text-lg font-semibold text-foreground">While you read</h2>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								This rail mirrors a future &quot;context shelf&quot;: short-lived notes, facet chips, and a
								gentle path back to assessment — without breaking the reading flow on small screens.
							</p>
						</div>
						<div className="space-y-5">
							<RelatedFacetsCard />
							<AssessmentCTA tier={DEMO.tier} />
						</div>
					</div>
				</div>
			</PageMain>
		</>
	);
}

/** Iteration 3 — capsule reader: single glassy surface, soft gradient stage, CTA inset. */
export function LibraryArticleRedesignIteration3() {
	return (
		<>
			<LibraryNav activeTier={DEMO.tier} articleTitle={DEMO.title} />
			<DevIterationBanner iteration={3} label="Capsule reader" />
			<PageMain className="relative overflow-hidden bg-linear-to-b from-primary/[0.07] via-background to-background px-4 py-10 sm:px-6 lg:px-8">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_65%)] opacity-[0.12]"
				/>
				<div className="relative mx-auto max-w-3xl">
					<div className="rounded-[2rem] border border-border/80 bg-card/85 p-6 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-card/70 sm:p-10">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="text-xs font-medium uppercase tracking-wide">
								Knowledge Library
							</Badge>
							<span className="text-xs text-muted-foreground">Trait</span>
						</div>
						<h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
							{DEMO.title}
						</h1>
						<p className="mt-4 text-base leading-7 text-muted-foreground">{DEMO.description}</p>
						<hr className="my-8 border-border/70" />
						<article>
							<ArticleProse />
						</article>
						<div className="mt-10 space-y-6 rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] p-5 sm:p-6">
							<RelatedFacetsCard />
							<AssessmentCTA tier={DEMO.tier} />
						</div>
					</div>
				</div>
			</PageMain>
		</>
	);
}
