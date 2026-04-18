import { Link } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import {
	ArrowRight,
	BookOpenText,
	Compass,
	Library,
	ListFilter,
	MapPinned,
	Search,
	Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { LibraryNav } from "@/components/library/LibraryNav";
import { PageMain } from "@/components/PageMain";
import {
	getAllLibraryEntries,
	LIBRARY_TIER_DESCRIPTIONS,
	LIBRARY_TIER_LABELS,
	LIBRARY_TIER_SINGULAR_LABELS,
	LIBRARY_TIERS,
	type LibraryEntryData,
	type LibraryTier,
} from "@/lib/library-content";

type LandingRedesignIteration = 1 | 2 | 3;

const LANDING_ROUTES: Record<
	LandingRedesignIteration,
	| "/dev/library/landing/redesign-1"
	| "/dev/library/landing/redesign-2"
	| "/dev/library/landing/redesign-3"
> = {
	1: "/dev/library/landing/redesign-1",
	2: "/dev/library/landing/redesign-2",
	3: "/dev/library/landing/redesign-3",
};

type LibraryGroup = {
	tier: LibraryTier;
	label: string;
	description: string;
	entries: LibraryEntryData[];
};

function toEntryData(entry: ReturnType<typeof getAllLibraryEntries>[number]): LibraryEntryData {
	const { Content: _Content, ...entryData } = entry;
	return entryData;
}

const ALL_ENTRIES = getAllLibraryEntries().map(toEntryData);
const GROUPS: LibraryGroup[] = LIBRARY_TIERS.map((tier) => ({
	tier,
	label: LIBRARY_TIER_LABELS[tier],
	description: LIBRARY_TIER_DESCRIPTIONS[tier],
	entries: ALL_ENTRIES.filter((entry) => entry.tier === tier),
}));

const ENTRY_BY_TIER = GROUPS.reduce(
	(acc, group) => {
		acc[group.tier] = group.entries;
		return acc;
	},
	{} as Record<LibraryTier, LibraryEntryData[]>,
);

const FEATURED_PATH = [
	ENTRY_BY_TIER.archetype[0],
	ENTRY_BY_TIER.trait.find((entry) => entry.slug === "openness") ?? ENTRY_BY_TIER.trait[0],
	ENTRY_BY_TIER.facet.find((entry) => entry.slug === "imagination") ?? ENTRY_BY_TIER.facet[0],
].filter((entry): entry is LibraryEntryData => Boolean(entry));

const TOTAL_PUBLISHED = ALL_ENTRIES.length;

function LandingDevBanner({
	iteration,
	label,
}: {
	iteration: LandingRedesignIteration;
	label: string;
}) {
	return (
		<div className="border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-center text-xs sm:text-sm">
			<span className="font-semibold text-foreground">Library landing redesign {iteration}</span>
			<span className="text-muted-foreground"> - {label} - </span>
			<Link
				to="/dev/components"
				hash="library-landing"
				className="font-medium text-primary underline-offset-4 hover:underline"
			>
				Back to kitchen sink
			</Link>
		</div>
	);
}

function LandingShell({
	children,
	iteration,
	label,
}: {
	children: ReactNode;
	iteration: LandingRedesignIteration;
	label: string;
}) {
	return (
		<>
			<LibraryNav />
			<LandingDevBanner iteration={iteration} label={label} />
			<PageMain className="bg-background px-4 py-10 sm:px-6 lg:px-8">{children}</PageMain>
		</>
	);
}

function IterationSwitcher({ current }: { current: LandingRedesignIteration }) {
	return (
		<nav aria-label="Landing redesigns" className="flex flex-wrap items-center gap-2">
			{([1, 2, 3] as const).map((iteration) => (
				<Link
					key={iteration}
					to={LANDING_ROUTES[iteration]}
					className={cn(
						"inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
						current === iteration
							? "border-foreground/20 bg-foreground text-background"
							: "border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground",
					)}
				>
					{iteration}
				</Link>
			))}
		</nav>
	);
}

function SearchPanel({ className }: { className?: string }) {
	return (
		<search
			aria-label="Search the knowledge library"
			className={cn(
				"flex flex-col gap-3 rounded-2xl border border-border/70 bg-background p-4 shadow-sm",
				className,
			)}
		>
			<label htmlFor="library-landing-search" className="text-sm font-medium text-foreground">
				Find an article
			</label>
			<div className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-muted/25 px-3">
				<Search className="size-4 shrink-0 text-primary" aria-hidden />
				<Input
					id="library-landing-search"
					readOnly
					value="archetypes, traits, facets, science"
					className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
				/>
			</div>
			<p className="text-sm leading-6 text-muted-foreground">
				Browse by article type now. Search can become the front door once the library grows.
			</p>
		</search>
	);
}

function EntryLinkCard({ entry, compact = false }: { entry: LibraryEntryData; compact?: boolean }) {
	return (
		<Link
			to={entry.pathname}
			className={cn(
				"group flex min-h-full flex-col gap-3 rounded-2xl border border-border/70 bg-background p-5 shadow-sm transition-colors hover:border-foreground/25",
				compact && "p-4",
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<Badge variant="secondary" className="w-fit">
					{LIBRARY_TIER_SINGULAR_LABELS[entry.tier]}
				</Badge>
				<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
			</div>
			<div className="flex flex-col gap-2">
				<h3
					className={cn("font-heading font-semibold text-foreground", compact ? "text-base" : "text-xl")}
				>
					{entry.title}
				</h3>
				<p className="text-sm leading-6 text-muted-foreground">{entry.description}</p>
			</div>
		</Link>
	);
}

function TierMetric({ group }: { group: LibraryGroup }) {
	return (
		<a
			href={`#${group.tier}`}
			className="flex min-h-24 flex-col justify-between rounded-2xl border border-border/70 bg-background p-4 text-left shadow-sm transition-colors hover:border-foreground/25"
		>
			<span className="text-sm font-medium text-muted-foreground">{group.label}</span>
			<span className="font-heading text-3xl font-semibold text-foreground">
				{group.entries.length}
			</span>
		</a>
	);
}

function TierSection({ group, limit = 6 }: { group: LibraryGroup; limit?: number }) {
	const visibleEntries = group.entries.slice(0, limit);

	return (
		<section
			id={group.tier}
			className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8"
		>
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<p className="text-sm font-medium text-primary">{LIBRARY_TIER_SINGULAR_LABELS[group.tier]}</p>
					<h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">{group.label}</h2>
					<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
						{group.description}
					</p>
				</div>
				<p className="shrink-0 text-sm text-muted-foreground">{group.entries.length} published</p>
			</div>

			<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{visibleEntries.length > 0 ? (
					visibleEntries.map((entry) => <EntryLinkCard key={entry.pathname} entry={entry} compact />)
				) : (
					<div className="rounded-2xl border border-dashed border-border bg-muted/15 p-5 text-sm leading-6 text-muted-foreground">
						This shelf is ready for future articles.
					</div>
				)}
			</div>
		</section>
	);
}

function ArticlePath() {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			{FEATURED_PATH.map((entry, index) => (
				<Link
					key={entry.pathname}
					to={entry.pathname}
					className="group rounded-2xl border border-border/70 bg-muted/20 p-5 transition-colors hover:border-foreground/25"
				>
					<div className="flex items-center justify-between gap-3">
						<span className="font-data text-sm text-primary">0{index + 1}</span>
						<ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
					</div>
					<h3 className="mt-5 font-heading text-xl font-semibold text-foreground">{entry.title}</h3>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.description}</p>
				</Link>
			))}
		</div>
	);
}

function CompletedAssessmentRecommendedPath() {
	const featuredEntry = FEATURED_PATH[0] ?? ALL_ENTRIES[0];

	return (
		<section
			data-auth-state="authenticated-assessed"
			className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.06] via-background to-primary/[0.03] p-6 shadow-sm sm:p-8"
		>
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Assessment complete</Badge>
						<Badge variant="outline">Signed-in state</Badge>
					</div>
					<h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">
						Read your results from pattern to precision.
					</h2>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
						After someone has their portrait, the library can stop being generic. Start with the archetype
						pattern, then move into the trait and facet language that helps the result feel usable.
					</p>
				</div>
				{featuredEntry ? (
					<Button variant="secondary" asChild>
						<Link to={featuredEntry.pathname}>
							Start recommended path
							<ArrowRight data-icon="inline-end" />
						</Link>
					</Button>
				) : null}
			</div>
			<div className="mt-6">
				<ArticlePath />
			</div>
		</section>
	);
}

export function LibraryLandingRedesign1() {
	const featuredEntry = FEATURED_PATH[0] ?? ALL_ENTRIES[0];

	return (
		<LandingShell iteration={1} label="Editorial index">
			<div className="mx-auto flex max-w-7xl flex-col gap-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Landing concept</Badge>
						<Badge variant="outline">Editorial index</Badge>
					</div>
					<IterationSwitcher current={1} />
				</div>

				<section className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03] shadow-sm">
					<div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
						<header className="max-w-4xl">
							<div className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
								<Library className="size-4 shrink-0" aria-hidden />
								<span>Knowledge Library</span>
							</div>
							<h1 className="mt-4 font-heading text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl">
								A map for reading personality without flattening it.
							</h1>
							<p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
								Start with memorable archetypes, move into Big Five traits, then use facets when you want a
								sharper lens.
							</p>
						</header>

						<div className="flex flex-col gap-4">
							<div className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm">
								<img src="/ocean-icon.svg" alt="big-ocean mark" className="size-12" />
								<p className="mt-5 font-heading text-3xl font-semibold text-foreground">
									{TOTAL_PUBLISHED}
								</p>
								<p className="mt-1 text-sm leading-6 text-muted-foreground">published library articles</p>
							</div>
							<SearchPanel />
						</div>
					</div>
				</section>

				<section className="grid gap-4 md:grid-cols-5">
					{GROUPS.map((group) => (
						<TierMetric key={group.tier} group={group} />
					))}
				</section>

				<section className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
						<div>
							<p className="text-sm font-medium text-primary">Recommended path</p>
							<h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
								Read from pattern to precision.
							</h2>
						</div>
						{featuredEntry ? (
							<Button variant="secondary" asChild>
								<Link to={featuredEntry.pathname}>
									Begin with archetypes
									<ArrowRight data-icon="inline-end" />
								</Link>
							</Button>
						) : null}
					</div>
					<div className="mt-6">
						<ArticlePath />
					</div>
				</section>

				<div className="flex flex-col gap-6">
					{GROUPS.map((group) => (
						<TierSection key={group.tier} group={group} />
					))}
				</div>
			</div>
		</LandingShell>
	);
}

function AtlasColumn({ group, icon }: { group: LibraryGroup; icon: ReactNode }) {
	const entries = group.entries.slice(0, 5);

	return (
		<section className="flex min-h-full flex-col rounded-[2rem] border border-border/70 bg-background p-5 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="flex items-center gap-2 text-sm font-medium text-primary">
						{icon}
						<span>{group.label}</span>
					</div>
					<h2 className="mt-3 font-heading text-xl font-semibold text-foreground">
						{group.description}
					</h2>
				</div>
				<span className="font-data text-sm text-muted-foreground">{group.entries.length}</span>
			</div>

			<div className="mt-6 flex flex-1 flex-col gap-3">
				{entries.map((entry) => (
					<Link
						key={entry.pathname}
						to={entry.pathname}
						className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-foreground/25"
					>
						<span className="min-w-0 text-sm font-medium text-foreground">{entry.title}</span>
						<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
					</Link>
				))}
			</div>
			{group.entries.length > entries.length ? (
				<a
					href={`#all-${group.tier}`}
					className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
				>
					View all {group.entries.length} {group.label.toLowerCase()}
					<ArrowRight className="size-4" aria-hidden />
				</a>
			) : null}
		</section>
	);
}

function CompleteIndexShelf({ group }: { group: LibraryGroup }) {
	return (
		<section
			id={`all-${group.tier}`}
			className="rounded-2xl border border-border/70 bg-background p-5"
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h3 className="font-heading text-lg font-semibold text-foreground">{group.label}</h3>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">{group.description}</p>
				</div>
				<span className="shrink-0 font-data text-sm text-muted-foreground">
					{group.entries.length} articles
				</span>
			</div>
			<div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
				{group.entries.length > 0 ? (
					group.entries.map((entry) => (
						<Link
							key={entry.pathname}
							to={entry.pathname}
							className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
						>
							{entry.title}
						</Link>
					))
				) : (
					<p className="rounded-xl border border-dashed border-border bg-muted/15 px-4 py-3 text-sm leading-6 text-muted-foreground">
						More articles are planned.
					</p>
				)}
			</div>
		</section>
	);
}

export function LibraryLandingRedesign2() {
	const atlasGroups = [
		GROUPS.find((group) => group.tier === "archetype"),
		GROUPS.find((group) => group.tier === "trait"),
		GROUPS.find((group) => group.tier === "facet"),
	].filter((group): group is LibraryGroup => Boolean(group));

	return (
		<LandingShell iteration={2} label="Personality atlas">
			<div className="mx-auto flex max-w-7xl flex-col gap-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Landing concept</Badge>
						<Badge variant="outline">Personality atlas</Badge>
					</div>
					<IterationSwitcher current={2} />
				</div>

				<section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
					<div className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
						<div className="flex items-center gap-3">
							<img src="/ocean-icon.svg" alt="big-ocean mark" className="size-10" />
							<p className="text-sm font-medium text-primary">Knowledge Library</p>
						</div>
						<h1 className="mt-8 font-heading text-4xl font-semibold text-foreground sm:text-5xl">
							Choose the level of zoom that matches your question.
						</h1>
						<p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
							Archetypes name the whole pattern. Traits explain the broad forces. Facets show the specific
							places where a trait becomes visible.
						</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<Button asChild>
								<Link to="/library">
									Browse library
									<ArrowRight data-icon="inline-end" />
								</Link>
							</Button>
							<Button variant="secondary" asChild>
								<a href="#atlas">Open the atlas</a>
							</Button>
						</div>
					</div>

					<div className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03] p-6 shadow-sm sm:p-8">
						<div className="grid gap-4 sm:grid-cols-3">
							{[
								{ label: "Pattern", value: ENTRY_BY_TIER.archetype.length, icon: Sparkles },
								{ label: "Trait", value: ENTRY_BY_TIER.trait.length, icon: Compass },
								{ label: "Facet", value: ENTRY_BY_TIER.facet.length, icon: MapPinned },
							].map((metric) => {
								const Icon = metric.icon;
								return (
									<div
										key={metric.label}
										className="rounded-2xl border border-border/70 bg-background/80 p-5"
									>
										<Icon className="size-5 text-primary" aria-hidden />
										<p className="mt-8 font-heading text-4xl font-semibold text-foreground">{metric.value}</p>
										<p className="mt-1 text-sm text-muted-foreground">{metric.label} articles</p>
									</div>
								);
							})}
						</div>
						<p className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-5 text-sm leading-6 text-muted-foreground">
							Use the atlas when the reader is exploring. Use the recommended path when their assessment
							has already given the library a personal starting point.
						</p>
					</div>
				</section>

				<CompletedAssessmentRecommendedPath />

				<section id="atlas" className="grid gap-4 lg:grid-cols-3">
					{atlasGroups.map((group) => (
						<AtlasColumn
							key={group.tier}
							group={group}
							icon={
								group.tier === "archetype" ? (
									<Sparkles className="size-4" aria-hidden />
								) : group.tier === "trait" ? (
									<Compass className="size-4" aria-hidden />
								) : (
									<MapPinned className="size-4" aria-hidden />
								)
							}
						/>
					))}
				</section>

				<section className="rounded-[2rem] border border-border/70 bg-muted/20 p-6 sm:p-8">
					<div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
						<div>
							<p className="text-sm font-medium text-primary">Complete index</p>
							<h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
								Every shelf remains close.
							</h2>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								The atlas previews each level. This index exposes every article, including all facet pages.
							</p>
						</div>
						<div className="flex flex-col gap-4">
							{GROUPS.map((group) => (
								<CompleteIndexShelf key={group.tier} group={group} />
							))}
						</div>
					</div>
				</section>
			</div>
		</LandingShell>
	);
}

function ReadingRoomRow({ entry }: { entry: LibraryEntryData }) {
	return (
		<Link
			to={entry.pathname}
			className="group grid gap-3 rounded-2xl border border-border/70 bg-background p-4 transition-colors hover:border-foreground/25 sm:grid-cols-[9rem_minmax(0,1fr)_1.5rem] sm:items-center"
		>
			<Badge variant="outline" className="w-fit">
				{LIBRARY_TIER_SINGULAR_LABELS[entry.tier]}
			</Badge>
			<div className="min-w-0">
				<h3 className="font-heading text-base font-semibold text-foreground">{entry.title}</h3>
				<p className="mt-1 text-sm leading-6 text-muted-foreground">{entry.description}</p>
			</div>
			<ArrowRight
				className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
				aria-hidden
			/>
		</Link>
	);
}

export function LibraryLandingRedesign3() {
	const firstEntries = ALL_ENTRIES.slice(0, 8);
	const scienceAndGuides = [...ENTRY_BY_TIER.science, ...ENTRY_BY_TIER.guides].slice(0, 4);

	return (
		<LandingShell iteration={3} label="Reading room">
			<div className="mx-auto flex max-w-6xl flex-col gap-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Landing concept</Badge>
						<Badge variant="outline">Reading room</Badge>
					</div>
					<IterationSwitcher current={3} />
				</div>

				<section className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-10">
					<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
						<header>
							<div className="flex items-center gap-3 text-sm font-medium text-primary">
								<BookOpenText className="size-4" aria-hidden />
								<span>Knowledge Library</span>
							</div>
							<h1 className="mt-5 max-w-4xl font-heading text-4xl font-semibold text-foreground sm:text-5xl">
								Read the model the way people actually ask questions.
							</h1>
							<p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
								Some questions start with identity. Others start with a trait score, a difficult
								relationship pattern, or a term from the assessment.
							</p>
						</header>
						<div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
							<img src="/ocean-icon.svg" alt="big-ocean mark" className="size-10" />
							<p className="mt-6 text-sm font-medium text-foreground">Library coverage</p>
							<div className="mt-4 grid grid-cols-2 gap-3">
								{GROUPS.slice(0, 4).map((group) => (
									<div key={group.tier} className="rounded-xl border border-border/70 bg-background p-3">
										<p className="font-data text-lg text-foreground">{group.entries.length}</p>
										<p className="mt-1 text-xs text-muted-foreground">{group.label}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2 text-sm font-medium text-primary">
							<ListFilter className="size-4" aria-hidden />
							<span>Start here</span>
						</div>
						{firstEntries.map((entry) => (
							<ReadingRoomRow key={entry.pathname} entry={entry} />
						))}
					</div>

					<aside className="flex flex-col gap-4 lg:sticky lg:top-28">
						<SearchPanel />
						<section className="rounded-2xl border border-border/70 bg-muted/20 p-5">
							<p className="text-sm font-medium text-primary">Applied reading</p>
							<h2 className="mt-2 font-heading text-xl font-semibold text-foreground">
								Science and guides can sit together as practical support.
							</h2>
							<div className="mt-5 flex flex-col gap-3">
								{scienceAndGuides.length > 0 ? (
									scienceAndGuides.map((entry) => (
										<Link
											key={entry.pathname}
											to={entry.pathname}
											className="text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
										>
											{entry.title}
										</Link>
									))
								) : (
									<p className="text-sm leading-6 text-muted-foreground">
										Applied articles can appear here once they are published.
									</p>
								)}
							</div>
						</section>
					</aside>
				</section>

				<section className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.06] via-background to-primary/[0.03] p-6 shadow-sm sm:p-8">
					<div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-sm font-medium text-primary">All shelves</p>
							<h2 className="mt-2 font-heading text-2xl font-semibold text-foreground">
								Keep browsing without losing the main index.
							</h2>
						</div>
						<Button variant="secondary" asChild>
							<Link to="/library">Return to production landing</Link>
						</Button>
					</div>
					<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
						{GROUPS.map((group) => (
							<a
								key={group.tier}
								href={`#${group.tier}`}
								className="rounded-2xl border border-border/70 bg-background/80 p-5 transition-colors hover:border-foreground/25"
							>
								<p className="text-sm font-medium text-foreground">{group.label}</p>
								<p className="mt-8 font-data text-2xl text-muted-foreground">{group.entries.length}</p>
							</a>
						))}
					</div>
				</section>
			</div>
		</LandingShell>
	);
}
