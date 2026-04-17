import { Link } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	type FacetLevelCode,
	type FacetName,
	getTraitLevelLabel,
	TRAIT_DESCRIPTIONS,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowRight, BookOpenText, Compass, Layers3, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLibraryEntry, getLibraryEntryData } from "@/lib/library-content";

type RedesignIteration = 1 | 2 | 3;

const GPT_REDESIGN_ROUTES: Record<
	RedesignIteration,
	"/dev/library/gpt/redesign-1" | "/dev/library/gpt/redesign-2" | "/dev/library/gpt/redesign-3"
> = {
	1: "/dev/library/gpt/redesign-1",
	2: "/dev/library/gpt/redesign-2",
	3: "/dev/library/gpt/redesign-3",
};

const TRAIT: TraitName = "openness";

const REDESIGNS: Record<
	RedesignIteration,
	{
		eyebrow: string;
		name: string;
		story: string;
		focus: string;
		bestFor: string;
	}
> = {
	1: {
		eyebrow: "Redesign 1",
		name: "Editorial longform",
		story:
			"This version treats the article like a considered essay: generous spacing, a reading rail, and supporting context that stays quiet until the reader wants it.",
		focus: "Slow reading, emotional clarity, and a premium-library feel.",
		bestFor: "Readers who want to sink into one article and come away feeling oriented.",
	},
	2: {
		eyebrow: "Redesign 2",
		name: "Guided explainer",
		story:
			"This one meets a curious reader at the door, answers the obvious questions first, and turns the article into a sequence of easy wins before the deeper text begins.",
		focus: "Fast comprehension, explicit signposting, and lower cognitive load.",
		bestFor: "New visitors who want the answer before they commit to a full read.",
	},
	3: {
		eyebrow: "Redesign 3",
		name: "Insight dashboard",
		story:
			"This prototype assumes the reader is skimming for signal. It foregrounds comparisons, facet-level detail, and scannable cards before inviting a deeper read.",
		focus: "High information density, comparison, and expert-user confidence.",
		bestFor: "Readers who want to scan, compare, and jump straight to the useful detail.",
	},
};

const { ENTRY, Content } = (() => {
	const article = getLibraryEntry("trait", TRAIT);
	const entry = getLibraryEntryData("trait", TRAIT);
	if (!article || !entry) {
		throw new Error("The openness library article must exist for the redesign kitchen sink.");
	}
	return { ENTRY: entry, Content: article.Content };
})();

const SPECTRUM = Object.entries(TRAIT_DESCRIPTIONS[TRAIT].levels).map(([level, description]) => ({
	level,
	label: getTraitLevelLabel(TRAIT, level),
	description,
}));

const FACETS = TRAIT_TO_FACETS[TRAIT].map((facetName) => {
	const levels = Object.entries(FACET_DESCRIPTIONS[facetName].levels).map(([code, description]) => ({
		code,
		label: FACET_LEVEL_LABELS[code as FacetLevelCode] ?? code,
		description,
	}));

	return {
		name: humanize(facetName),
		slug: facetName,
		levels,
	};
});

const FACET_SPOTLIGHTS = [
	{
		title: "How it tends to feel",
		body:
			"Openness is not just loving art or novelty. It is the felt willingness to let unfamiliar ideas stay in the room long enough to examine them.",
	},
	{
		title: "What it changes in daily life",
		body:
			"It shapes whether new possibilities feel energizing, distracting, impractical, or quietly necessary.",
	},
	{
		title: "What readers usually want next",
		body:
			"After the definition, most people want translation: what low, middle, and high openness actually look like in work, relationships, and self-reflection.",
	},
] as const;

const CHAPTERS = [
	"Scientific definition",
	"Low openness in daily life",
	"Mid-range openness in daily life",
	"High openness in daily life",
	"Facet breakdown",
] as const;

export function LibraryArticleGptRedesignPage({ iteration }: { iteration: RedesignIteration }) {
	const redesign = REDESIGNS[iteration];

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
							big-ocean kitchen sink
						</p>
						<p className="truncate text-sm text-foreground">
							Library article redesigns for <span className="font-medium">{ENTRY.title}</span>
						</p>
					</div>

					<div className="flex items-center gap-2">
						<nav aria-label="Redesign iterations" className="hidden items-center gap-2 md:flex">
							{([1, 2, 3] as const).map((candidate) => (
								<Link
									key={candidate}
									to={GPT_REDESIGN_ROUTES[candidate]}
									className={cn(
										"rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
										candidate === iteration
											? "border-foreground/20 bg-foreground text-background"
											: "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
									)}
								>
									{candidate}
								</Link>
							))}
						</nav>
						<ThemeToggle />
					</div>
				</div>
			</header>

			<main className="px-4 py-8 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl space-y-8">
					<section className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03]">
						<div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)] lg:items-end lg:px-10 lg:py-10">
							<div className="space-y-5">
								<div className="flex flex-wrap items-center gap-3">
									<Badge variant="secondary">{redesign.eyebrow}</Badge>
									<Badge variant="outline">Trait article prototype</Badge>
								</div>
								<div>
									<p className="text-sm font-medium text-primary">{redesign.name}</p>
									<h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
										{ENTRY.title}
									</h1>
									<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
										{ENTRY.description}
									</p>
								</div>
								<p className="max-w-3xl text-sm leading-6 text-foreground/80 sm:text-base">
									{redesign.story}
								</p>
							</div>

							<div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm">
								<SummaryRow label="Focus" value={redesign.focus} />
								<SummaryRow label="Best for" value={redesign.bestFor} />
								<SummaryRow
									label="Live article"
									value={
										<Link
											to={ENTRY.pathname}
											className="inline-flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
										>
											Open the current production article <ArrowRight className="size-4" />
										</Link>
									}
								/>
							</div>
						</div>
					</section>

					{iteration === 1 ? <EditorialLongform /> : null}
					{iteration === 2 ? <GuidedExplainer /> : null}
					{iteration === 3 ? <InsightDashboard /> : null}
				</div>
			</main>
		</div>
	);
}

function EditorialLongform() {
	return (
		<section className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)_18rem] lg:items-start">
			<aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
				<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<BookOpenText className="size-4 text-primary" />
						Reading rail
					</div>
					<ol className="mt-4 space-y-3 text-sm text-muted-foreground">
						{CHAPTERS.map((chapter, index) => (
							<li key={chapter} className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
								<span className="mr-2 text-xs font-semibold text-primary">0{index + 1}</span>
								{chapter}
							</li>
						))}
					</ol>
				</div>

				<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
					<p className="text-sm font-medium text-foreground">Design thesis</p>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">
						Let the article breathe like a premium essay, then tuck the orientation tools into calm side
						surfaces.
					</p>
				</div>
			</aside>

			<div className="space-y-6">
				<section className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="grid gap-4 md:grid-cols-3">
						{FACET_SPOTLIGHTS.map((spotlight) => (
							<div
								key={spotlight.title}
								className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
							>
								<p className="text-sm font-semibold text-foreground">{spotlight.title}</p>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">{spotlight.body}</p>
							</div>
						))}
					</div>
				</section>

				<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="max-w-3xl space-y-5 text-base leading-8 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-foreground/85 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
						<Content />
					</div>
				</article>
			</div>

			<aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
				<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
					<div className="flex items-center gap-2 text-sm font-medium text-foreground">
						<Compass className="size-4 text-primary" />
						Across the spectrum
					</div>
					<div className="mt-4 space-y-3">
						{SPECTRUM.map((point) => (
							<div key={point.level} className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
								<p className="text-sm font-semibold text-foreground">{point.label}</p>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">{point.description}</p>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
					<p className="text-sm font-medium text-foreground">Why this shape works</p>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">
						The page feels less like documentation and more like a guided read, which suits emotionally
						resonant content.
					</p>
				</div>
			</aside>
		</section>
	);
}

function GuidedExplainer() {
	return (
		<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
			<div className="space-y-6">
				<section className="grid gap-4 md:grid-cols-3">
					<GuidedAnswerCard
						title="What is openness?"
						body="A person-level tendency toward novelty, abstraction, imagination, and cognitive flexibility."
					/>
					<GuidedAnswerCard
						title="Why should I care?"
						body="It changes how quickly new ideas feel appealing, useful, or suspect in everyday decisions."
					/>
					<GuidedAnswerCard
						title="How should I read this?"
						body="Start with the spectrum, then use the facet grid to find the part that actually sounds like you."
					/>
				</section>

				<section className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="flex items-center gap-2 text-sm font-medium text-primary">
						<Sparkles className="size-4" />
						First, answer the question most readers are carrying
					</div>
					<h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
						Does novelty feel energizing, unnecessary, or situational?
					</h2>
					<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
						That single question captures the emotional job of this article. The design surfaces the
						answer early, then earns the deeper read once the reader feels seen.
					</p>

					<div className="mt-6 grid gap-4 md:grid-cols-3">
						{SPECTRUM.map((point) => (
							<div key={point.level} className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
									{point.level}
								</p>
								<h3 className="mt-2 text-lg font-semibold text-foreground">{point.label}</h3>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">{point.description}</p>
							</div>
						))}
					</div>
				</section>

				<section className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<h2 className="text-2xl font-semibold tracking-tight text-foreground">Facet map</h2>
					<p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
						Instead of asking readers to decode six facets from prose alone, this version makes the
						sub-dimensions immediately scannable.
					</p>
					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{FACETS.map((facet) => (
							<div key={facet.slug} className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
								<h3 className="text-base font-semibold text-foreground">{facet.name}</h3>
								<div className="mt-4 space-y-3">
									{facet.levels.map((level) => (
										<div
											key={level.code}
											className="rounded-xl border border-border/70 bg-background px-4 py-3"
										>
											<p className="text-sm font-medium text-foreground">
												{level.label}
												<span className="ml-2 font-mono text-xs text-muted-foreground">{level.code}</span>
											</p>
											<p className="mt-2 text-sm leading-6 text-muted-foreground">{level.description}</p>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="flex items-center gap-2 text-sm font-medium text-primary">
						<Layers3 className="size-4" />
						Source article
					</div>
					<div className="mt-5 max-w-3xl space-y-5 text-base leading-8 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-foreground/85 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
						<Content />
					</div>
				</section>
			</div>

			<aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
				<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
					<p className="text-sm font-medium text-foreground">Reading promise</p>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">
						A new reader should know whether this trait sounds familiar within the first 20 seconds.
					</p>
				</div>

				<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
					<p className="text-sm font-medium text-foreground">Likely wins</p>
					<ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
						<li>Better onboarding from search and AI summaries.</li>
						<li>More clarity before the longform section begins.</li>
						<li>Facet structure becomes understandable at a glance.</li>
					</ul>
				</div>
			</aside>
		</section>
	);
}

function InsightDashboard() {
	return (
		<section className="space-y-6">
			<section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
				<div className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="flex items-center gap-2 text-sm font-medium text-primary">
						<Compass className="size-4" />
						Signal first
					</div>
					<h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
						Scan the shape of the trait before you read the essay.
					</h2>
					<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
						This version assumes the reader wants usable contrast fast: what the trait measures, how it
						varies, and which facet to inspect next.
					</p>

					<div className="mt-6 grid gap-4 sm:grid-cols-3">
						<StatCard label="Trait family" value="Big Five" helper="High-level dimension" />
						<StatCard label="Sub-dimensions" value="6 facets" helper="Imagination to liberalism" />
						<StatCard label="Reader mode" value="Scan -> dive" helper="Optimized for pattern-finding" />
					</div>
				</div>

				<div className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<p className="text-sm font-medium text-foreground">Spectrum snapshot</p>
					<div className="mt-5 space-y-4">
						{SPECTRUM.map((point, index) => (
							<div key={point.level}>
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-semibold text-foreground">{point.label}</p>
									<p className="text-xs font-mono text-muted-foreground">0{index + 1}</p>
								</div>
								<div className="mt-2 h-2 rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-primary"
										style={{ width: `${[28, 58, 86][index]}%` }}
									/>
								</div>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">{point.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{FACETS.map((facet) => (
					<div
						key={facet.slug}
						className="rounded-[1.75rem] border border-border/70 bg-background p-5 shadow-sm"
					>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							Facet
						</p>
						<h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{facet.name}</h3>
						<div className="mt-4 space-y-3">
							{facet.levels.map((level) => (
								<div key={level.code} className="rounded-[1rem] border border-border/70 bg-muted/20 p-4">
									<p className="text-sm font-semibold text-foreground">
										{level.label}
										<span className="ml-2 text-xs font-mono text-muted-foreground">{level.code}</span>
									</p>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">{level.description}</p>
								</div>
							))}
						</div>
					</div>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
				<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="flex items-center gap-2 text-sm font-medium text-primary">
						<BookOpenText className="size-4" />
						Full source article
					</div>
					<div className="mt-5 max-w-3xl space-y-5 text-base leading-8 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-foreground/85 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2">
						<Content />
					</div>
				</article>

				<aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
					<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
						<p className="text-sm font-medium text-foreground">Design thesis</p>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">
							Make the article useful even if the reader never reaches paragraph four.
						</p>
					</div>

					<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
						<p className="text-sm font-medium text-foreground">Trade-off</p>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">
							This is the least romantic version, but the most efficient for comparison shopping and AI-era
							skim behavior.
						</p>
					</div>
				</aside>
			</section>
		</section>
	);
}

function GuidedAnswerCard({ title, body }: { title: string; body: string }) {
	return (
		<div className="rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm">
			<p className="text-sm font-semibold text-foreground">{title}</p>
			<p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
		</div>
	);
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
	return (
		<div className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4">
			<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
			<p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
			<p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
		</div>
	);
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
			<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
			<div className="mt-2 text-sm leading-6 text-foreground">{value}</div>
		</div>
	);
}

function humanize(value: FacetName) {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}
