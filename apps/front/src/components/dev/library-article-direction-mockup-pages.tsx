import { Link } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LETTER_MAP,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetLevelCode,
	type FacetName,
	getTraitLevelLabel,
	TRAIT_DESCRIPTIONS,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain";
import { cn } from "@workspace/ui/lib/utils";
import {
	ArrowRight,
	BookOpenText,
	ChevronDown,
	Clock,
	Compass,
	Layers3,
	MapPinned,
	Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssessmentCTA } from "@/components/library/AssessmentCTA";
import { LibraryNav } from "@/components/library/LibraryNav";
import { PageMain } from "@/components/PageMain";
import { getLibraryEntry, getLibraryEntryData, type LibraryEntryData } from "@/lib/library-content";

const TRAIT_SLUG: TraitName = "openness";
const FACET_SLUG: FacetName = "imagination";
const ARCHETYPE_SLUG = "beacon-personality-archetype";

const TRAIT_DIRECTION_MOCK_PATH = "/dev/library/direction/trait" as const;
const FACET_DIRECTION_MOCK_PATH = "/dev/library/direction/facet" as const;
const ARCHETYPE_DIRECTION_MOCK_PATH = "/dev/library/direction/archetype" as const;

type DirectionMockPath =
	| typeof TRAIT_DIRECTION_MOCK_PATH
	| typeof FACET_DIRECTION_MOCK_PATH
	| typeof ARCHETYPE_DIRECTION_MOCK_PATH;

/** Matches anchor ids: `openness.mdx` headings + mock `#facet-map` + `#across-the-spectrum` in main column. */
const OPENNESS_READING_CHAPTERS = [
	{ id: "facet-map", label: "Facet map" },
	{ id: "across-the-spectrum", label: "Across the spectrum" },
	{ id: "scientific-definition", label: "Scientific definition" },
	{ id: "low-openness-in-daily-life", label: "Low openness" },
	{ id: "mid-range-openness-in-daily-life", label: "Mid-range openness" },
	{ id: "high-openness-in-daily-life", label: "High openness" },
	{ id: "facet-breakdown", label: "Facet breakdown" },
] as const;

/** Matches anchor ids: `imagination.mdx` headings + mock sections above the article. */
const IMAGINATION_READING_CHAPTERS = [
	{ id: "facet-poles", label: "Across the scale" },
	{ id: "sibling-facet-map", label: "Sibling facets" },
	{ id: "what-imagination-measures", label: "What it measures" },
	{ id: "when-imagination-is-quieter", label: "When it is quieter" },
	{ id: "when-imagination-is-vivid", label: "When it is vivid" },
	{ id: "how-it-shows-up-in-daily-life", label: "Daily life" },
] as const;

/** Matches `<h2 id="…">` in `beacon-personality-archetype.mdx` for reading rail + in-page anchors. */
const BEACON_READING_CHAPTERS = [
	{ id: "overview", label: "Overview" },
	{ id: "strengths", label: "Strengths" },
	{ id: "growth-areas", label: "Growth areas" },
	{ id: "compatible-archetypes", label: "Compatible archetypes" },
] as const;

const BEACON_HERO_PULL_QUOTE =
	"The Beacon is the person who turns possibility into momentum — organizing ideas so clearly that other people want to participate, with unusual warmth.";

/** Short relational labels for the compatibility rail (not clinical “related”). */
const RELATED_PATTERN_ROLES: Record<string, string> = {
	"anchor-personality-archetype": "Pragmatic ballast",
	"compass-personality-archetype": "Directional contrast",
	"ember-personality-archetype": "Warm counterweight",
};

const COMPATIBLE_ARCHETYPE_SLUGS: Record<string, string[]> = {
	"beacon-personality-archetype": [
		"anchor-personality-archetype",
		"compass-personality-archetype",
		"ember-personality-archetype",
	],
};

const articleProseClass =
	"space-y-5 text-base leading-8 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:ml-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_strong]:font-semibold";

const directionArticleProseClass = cn(articleProseClass, "[&_h2]:scroll-mt-28");

function humanizeFacet(value: string) {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function DirectionDevBanner({ spine }: { spine: string }) {
	return (
		<div className="border-b border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5 text-center text-xs sm:text-sm">
			<span className="font-semibold text-foreground">Library direction mockup</span>
			<span className="text-muted-foreground"> — {spine} · </span>
			<Link
				to="/dev/components"
				hash="library-direction-mockups"
				className="font-medium text-primary underline-offset-4 hover:underline"
			>
				Back to kitchen sink
			</Link>
		</div>
	);
}

function ReadingTime({ minutes }: { minutes: number }) {
	return (
		<p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
			<Clock className="size-4 shrink-0 text-primary" aria-hidden />
			<span>
				About <span className="font-medium text-foreground/90 tabular-nums">{minutes}</span> min read
			</span>
		</p>
	);
}

type FacetMapRow = {
	name: string;
	slug: FacetName;
	levels: Array<{ code: string; label: string; description: string }>;
};

function buildFacetMapForTrait(trait: TraitName): FacetMapRow[] {
	return TRAIT_TO_FACETS[trait].map((facetName) => ({
		name: humanizeFacet(facetName),
		slug: facetName,
		levels: Object.entries(FACET_DESCRIPTIONS[facetName].levels).map(([code, description]) => ({
			code,
			label: FACET_LEVEL_LABELS[code as FacetLevelCode] ?? code,
			description,
		})),
	}));
}

/** GPT-style facet map: full grid in main column before longform. */
function TraitFacetMapSection({ trait }: { trait: TraitName }) {
	const facets = buildFacetMapForTrait(trait);

	return (
		<section
			id="facet-map"
			className="mb-10 scroll-mt-28 rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8"
		>
			<div className="flex items-center gap-2 text-sm font-medium text-primary">
				<Layers3 className="size-4 shrink-0" aria-hidden />
				Facet map
			</div>
			<h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
				Six facets at a glance
			</h2>
			<p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
				Sub-dimensions of this trait, scannable before the deeper article — same pattern as the GPT
				library prototypes.
			</p>
			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{facets.map((facet) => (
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
										<span className="ml-2 font-mono text-xs text-primary/80">{level.code}</span>
									</p>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">{level.description}</p>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

/** Compact sibling facet grid for facet article main column. */
function FacetSiblingMapSection({
	parentTrait,
	currentFacet,
}: {
	parentTrait: TraitName;
	currentFacet: FacetName;
}) {
	const slugs = TRAIT_TO_FACETS[parentTrait];

	return (
		<section
			id="sibling-facet-map"
			className="mb-10 scroll-mt-28 rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8"
		>
			<div className="flex items-center gap-2 text-sm font-medium text-primary">
				<Layers3 className="size-4 shrink-0" aria-hidden />
				Facet map · {humanizeFacet(parentTrait)}
			</div>
			<h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
				Same trait, other facets
			</h2>
			<p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
				Grid navigation across the six facets — the article you are reading is highlighted.
			</p>
			<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{slugs.map((slug) => {
					const data = getLibraryEntryData("facet", slug);
					const isHere = slug === currentFacet;
					return (
						<Link
							key={slug}
							to="/library/facet/$slug"
							params={{ slug }}
							className={cn(
								"rounded-[1.75rem] border border-border/70 bg-muted/20 p-5 text-left shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/30",
								isHere && "border-primary/40 bg-primary/[0.06] ring-2 ring-primary/35",
							)}
						>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Facet</p>
							<h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
								{data?.title ?? humanizeFacet(slug)}
							</h3>
							{isHere ? (
								<p className="mt-2 text-xs font-medium text-primary">You are here</p>
							) : (
								<p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
									{data?.description ?? ""}
								</p>
							)}
						</Link>
					);
				})}
			</div>
		</section>
	);
}

function getCompatibleArchetypes(slug: string) {
	return (COMPATIBLE_ARCHETYPE_SLUGS[slug] ?? [])
		.map((relatedSlug) => getLibraryEntryData("archetype", relatedSlug))
		.filter((entry): entry is LibraryEntryData => Boolean(entry))
		.map((entry) => ({
			title: entry.title,
			description: entry.description,
			pathname: entry.pathname,
		}));
}

/**
 * Track the chapter id closest to the top of the viewport.
 * Uses an IntersectionObserver tuned so that a section becomes "active" once its
 * heading clears the sticky nav (top inset) and well before it leaves the screen.
 */
function useActiveChapterId(chapterIds: readonly string[]) {
	const [activeId, setActiveId] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

		const elements = chapterIds
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);

		if (elements.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]) {
					setActiveId(visible[0].target.id);
				}
			},
			{ rootMargin: "-120px 0px -55% 0px", threshold: 0 },
		);

		for (const element of elements) {
			observer.observe(element);
		}
		return () => observer.disconnect();
	}, [chapterIds]);

	return activeId;
}

function ReadingRailList({
	mockPath,
	chapters,
	activeId,
}: {
	mockPath: DirectionMockPath;
	chapters: readonly { readonly id: string; readonly label: string }[];
	activeId: string | null;
}) {
	return (
		<ol className="mt-4 space-y-2 text-sm text-muted-foreground">
			{chapters.map((chapter, index) => {
				const isActive = chapter.id === activeId;
				return (
					<li
						key={chapter.id}
						data-active={isActive}
						className="rounded-xl border border-border/70 bg-muted/20 px-2 py-1.5 transition-colors duration-200 hover:border-border/80 data-[active=true]:border-primary/45 data-[active=true]:bg-primary/[0.06]"
					>
						<Link
							to={mockPath}
							hash={chapter.id}
							aria-current={isActive ? "location" : undefined}
							className={cn(
								"flex min-h-11 cursor-pointer items-start gap-2 rounded-lg px-1 py-1 transition-colors duration-200 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								isActive ? "text-foreground" : "text-muted-foreground",
							)}
						>
							<span
								className={cn(
									"select-none text-xs font-semibold tabular-nums",
									isActive ? "text-primary" : "text-primary/70",
								)}
							>
								{String(index + 1).padStart(2, "0")}
							</span>
							<span className="leading-snug">{chapter.label}</span>
						</Link>
					</li>
				);
			})}
		</ol>
	);
}

function DirectionReadingRail({
	mockPath,
	chapters,
}: {
	mockPath: DirectionMockPath;
	chapters: readonly { readonly id: string; readonly label: string }[];
}) {
	const chapterIds = useMemo(() => chapters.map((c) => c.id), [chapters]);
	const activeId = useActiveChapterId(chapterIds);

	return (
		<aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
			{/* Mobile / small tablet: collapsed by default to keep the article close to the hero. */}
			<details className="group rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm lg:hidden">
				<summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
					<BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
					<span>On this page</span>
					{activeId ? (
						<span className="ml-2 truncate text-xs font-normal text-muted-foreground">
							· {chapters.find((c) => c.id === activeId)?.label}
						</span>
					) : null}
					<ChevronDown
						className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
						aria-hidden
					/>
				</summary>
				<ReadingRailList mockPath={mockPath} chapters={chapters} activeId={activeId} />
			</details>

			{/* Desktop: always-visible, sticky inside the column. */}
			<nav
				aria-label="On this page"
				className="hidden rounded-[1.5rem] border border-border/70 bg-background p-5 shadow-sm lg:block"
			>
				<div className="flex items-center gap-2 text-sm font-medium text-foreground">
					<BookOpenText className="size-4 shrink-0 text-primary" aria-hidden />
					Reading rail
				</div>
				<ReadingRailList mockPath={mockPath} chapters={chapters} activeId={activeId} />
			</nav>
		</aside>
	);
}

/** Trait: neutral editorial hero, reading rail, facet map + spectrum + MDX in main column, CTA in side column. */
export function LibraryArticleDirectionMockupTraitPage() {
	const entry = getLibraryEntryData("trait", TRAIT_SLUG);
	const article = getLibraryEntry("trait", TRAIT_SLUG);
	if (!entry || !article) {
		throw new Error("Openness trait article missing for direction mockup.");
	}
	const { Content } = article;
	const tagline = TRAIT_DESCRIPTIONS[TRAIT_SLUG].tagline;
	const spectrum = Object.entries(TRAIT_DESCRIPTIONS[TRAIT_SLUG].levels).map(
		([level, description]) => ({
			level,
			description,
		}),
	);

	return (
		<>
			<DirectionDevBanner spine="Trait · neutral editorial" />
			<LibraryNav activeTier="trait" articleTitle={entry.title} />
			<PageMain className="bg-background px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03] shadow-sm">
						<div className="p-6 sm:p-8">
							<header className="max-w-3xl xl:max-w-5xl">
								<div className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
									<BookOpenText className="size-4 shrink-0" aria-hidden />
									<span>Trait guide</span>
								</div>
								<p className="mt-3 text-sm font-medium text-primary sm:text-base">
									{humanizeFacet(TRAIT_SLUG)} · Big Five reference
								</p>
								<h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
									{entry.title}
								</h1>
								<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
									{entry.description}
								</p>
								<ReadingTime minutes={7} />
							</header>
						</div>
					</div>

					<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_20rem] xl:items-start">
						<DirectionReadingRail
							mockPath={TRAIT_DIRECTION_MOCK_PATH}
							chapters={OPENNESS_READING_CHAPTERS}
						/>

						<div className="min-w-0 space-y-6">
							<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
								<TraitFacetMapSection trait={TRAIT_SLUG} />
								<section
									id="across-the-spectrum"
									className="mb-10 scroll-mt-28 rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 sm:p-6"
								>
									<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
										<Compass className="size-5 shrink-0 text-primary" aria-hidden />
										Across the spectrum
									</h2>
									<p className="mt-3 text-sm leading-6 text-muted-foreground">{tagline}</p>
									<div className="mt-4 space-y-3">
										{spectrum.map((row) => {
											const levelName = getTraitLevelLabel(TRAIT_SLUG, row.level);
											return (
												<div
													key={row.level}
													className="rounded-[1.25rem] border border-border/70 bg-background p-4"
												>
													<p className="text-sm font-semibold leading-snug text-foreground">
														{levelName}
														<span className="ml-2 font-normal tabular-nums text-muted-foreground">
															({row.level})
														</span>
													</p>
													<p className="mt-2 text-sm leading-6 text-foreground/90">{row.description}</p>
												</div>
											);
										})}
									</div>
								</section>
								<div className="mb-10 flex items-center gap-3">
									<span className="h-px flex-1 bg-border/70" aria-hidden />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Long form article
									</span>
									<span className="h-px flex-1 bg-border/70" aria-hidden />
								</div>
								<div className={cn(directionArticleProseClass)}>
									<Content />
								</div>
							</article>
						</div>

						<div className="space-y-6 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:sticky xl:top-28 xl:self-start">
							<AssessmentCTA tier="trait" ctaText={entry.cta} />
							<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
									Continue exploring
								</p>
								<h2 className="mt-2 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
									<Layers3 className="size-4 shrink-0 text-primary" aria-hidden />
									Browse all facets
								</h2>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									The six openness facets show where curiosity lives in daily life.
								</p>
								<Link
									to="/library/facet/$slug"
									params={{ slug: "imagination" }}
									className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
								>
									Start with imagination
									<ArrowRight className="size-4" aria-hidden />
								</Link>
							</section>
						</div>
					</section>
				</div>
			</PageMain>
		</>
	);
}

function FacetLevelsBeforeBody({
	levels,
	lowCode,
	highCode,
}: {
	levels: Array<{ code: string; label: string; description: string }>;
	lowCode: string;
	highCode: string;
}) {
	return (
		<section
			id="facet-poles"
			className="mb-10 scroll-mt-28 rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 sm:p-6"
		>
			<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
				<Layers3 className="size-5 shrink-0 text-primary" aria-hidden />
				How this facet spans the scale
			</h2>
			<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
				Facet guides put the poles up front so readers who already know the parent trait can orient
				before the longer explanation.
			</p>
			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{levels.map((level) => {
					const pole =
						level.code === lowCode ? "Lower pole" : level.code === highCode ? "Higher pole" : "Pole";
					return (
						<div key={level.code} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								{pole}
							</p>
							<p className="mt-2 text-base font-semibold text-foreground">{level.label}</p>
							<p className="mt-0.5 text-xs font-mono text-muted-foreground/90">{level.code}</p>
							<p className="mt-2 text-sm leading-6 text-foreground/90">{level.description}</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}

/** Facet: parent trait context in hero, levels block before body, lean rail. */
export function LibraryArticleDirectionMockupFacetPage() {
	const entry = getLibraryEntryData("facet", FACET_SLUG);
	const article = getLibraryEntry("facet", FACET_SLUG);
	if (!entry || !article) {
		throw new Error("Imagination facet article missing for direction mockup.");
	}
	const { Content } = article;
	const parentTrait = FACET_TO_TRAIT[FACET_SLUG];
	const traitEntry = getLibraryEntryData("trait", parentTrait);
	const parentTraitLabel = humanizeFacet(parentTrait);
	const levels = Object.entries(FACET_DESCRIPTIONS[FACET_SLUG].levels).map(
		([code, description]) => ({
			code,
			label: FACET_LEVEL_LABELS[code as keyof typeof FACET_LEVEL_LABELS],
			description,
		}),
	);
	const [lowCode, highCode] = FACET_LETTER_MAP[FACET_SLUG];

	return (
		<>
			<DirectionDevBanner spine="Facet · levels-first spine" />
			<LibraryNav activeTier="facet" articleTitle={entry.title} />
			<PageMain className="bg-background px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.03] shadow-sm">
						<div className="p-6 sm:p-8">
							<header className="max-w-3xl xl:max-w-5xl">
								<div className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
									<MapPinned className="size-4 shrink-0" aria-hidden />
									<span>Facet guide</span>
								</div>
								<p className="mt-3 text-sm font-medium text-primary sm:text-base">
									Part of{" "}
									<Link
										to="/library/trait/$slug"
										params={{ slug: parentTrait }}
										className="underline decoration-primary/40 underline-offset-4 hover:text-primary"
									>
										{traitEntry?.title ?? `${parentTraitLabel} trait`}
									</Link>
								</p>
								<h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
									{entry.title}
								</h1>
								<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
									{entry.description}
								</p>
								<ReadingTime minutes={6} />
							</header>
						</div>
					</div>

					<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_20rem] xl:items-start">
						<DirectionReadingRail
							mockPath={FACET_DIRECTION_MOCK_PATH}
							chapters={IMAGINATION_READING_CHAPTERS}
						/>

						<div className="min-w-0 space-y-6">
							<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
								<FacetLevelsBeforeBody levels={levels} lowCode={lowCode} highCode={highCode} />
								<FacetSiblingMapSection parentTrait={parentTrait} currentFacet={FACET_SLUG} />
								<div className="mb-10 flex items-center gap-3">
									<span className="h-px flex-1 bg-border/70" aria-hidden />
									<span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
										Long form article
									</span>
									<span className="h-px flex-1 bg-border/70" aria-hidden />
								</div>
								<div className={cn(directionArticleProseClass)}>
									<Content />
								</div>
							</article>
						</div>

						<div className="space-y-6 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:sticky xl:top-28 xl:self-start">
							<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
								<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
									<BookOpenText className="size-5 shrink-0 text-primary" aria-hidden />
									Parent trait
								</h2>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									This facet is one of six dimensions within the broader trait. Use the facet map in the main
									column to jump between facets.
								</p>
								<Link
									to="/library/trait/$slug"
									params={{ slug: parentTrait }}
									className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
								>
									Read the {parentTraitLabel} guide →
								</Link>
							</section>
							<AssessmentCTA tier="facet" ctaText={entry.cta} />
							<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
									Continue exploring
								</p>
								<h2 className="mt-2 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
									<Layers3 className="size-4 shrink-0 text-primary" aria-hidden />
									Sibling facet
								</h2>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">
									Stay close to imagination — read another facet of the same trait.
								</p>
								<Link
									to="/library/facet/$slug"
									params={{ slug: "artistic_interests" }}
									className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
								>
									Read artistic interests
									<ArrowRight className="size-4" aria-hidden />
								</Link>
							</section>
						</div>
					</section>
				</div>
			</PageMain>
		</>
	);
}

function RelatedPatternsColumn({
	compatibleArchetypes,
}: {
	compatibleArchetypes: Array<{ title: string; description: string; pathname: string }>;
}) {
	if (compatibleArchetypes.length === 0) {
		return null;
	}

	return (
		<aside className="space-y-4 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:sticky xl:top-28 xl:self-start">
			<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
				<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
					<Compass className="size-5 shrink-0 text-primary" aria-hidden />
					Who this pattern pairs with
				</h2>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					Relational fit, not a directory — a few archetypes that often show up alongside a Beacon.
				</p>
				<div className="mt-4 grid gap-3">
					{compatibleArchetypes.map((a) => {
						const slug = a.pathname.split("/").pop() ?? "";
						const role = RELATED_PATTERN_ROLES[slug] ?? "Also explore";

						return (
							<Link
								key={a.pathname}
								to={a.pathname}
								className="block cursor-pointer rounded-[1.25rem] border border-border/70 bg-background p-4 transition-colors duration-200 hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								<p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{role}</p>
								<h3 className="mt-2 text-base font-semibold text-foreground">{a.title}</h3>
								<p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">{a.description}</p>
							</Link>
						);
					})}
				</div>
			</section>
		</aside>
	);
}

/** Archetype: identity-leaning hero pull-quote, reading rail, article + inline CTA, relational patterns rail. */
export function LibraryArticleDirectionMockupArchetypePage() {
	const entry = getLibraryEntryData("archetype", ARCHETYPE_SLUG);
	const article = getLibraryEntry("archetype", ARCHETYPE_SLUG);
	if (!entry || !article) {
		throw new Error("Beacon archetype article missing for direction mockup.");
	}
	const { Content } = article;
	const compatibleArchetypes = getCompatibleArchetypes(ARCHETYPE_SLUG);

	return (
		<>
			<DirectionDevBanner spine="Archetype · narrative hero" />
			<LibraryNav activeTier="archetype" articleTitle={entry.title} />
			<PageMain className="bg-background px-4 py-10 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.08] via-background to-primary/[0.04] shadow-sm">
						<div className="p-6 sm:p-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10 lg:items-end">
							<header className="max-w-3xl">
								<div className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
									<Sparkles className="size-4 shrink-0" aria-hidden />
									<span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/90">
										Archetype guide
									</span>
								</div>
								<p className="mt-3 text-sm font-medium text-primary sm:text-base">
									Archetypal pattern · lived language
								</p>
								<h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[2.75rem] lg:leading-tight">
									{entry.title}
								</h1>
								<p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
									{entry.description}
								</p>
								<ReadingTime minutes={8} />
							</header>
							<blockquote className="mt-6 border-l-2 border-primary/45 pl-5 text-foreground sm:pl-6 lg:mt-0 lg:pl-8">
								<p className="font-heading text-sm italic leading-relaxed sm:text-base lg:text-lg xl:text-xl">
									{BEACON_HERO_PULL_QUOTE}
								</p>
								<footer className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mt-4">
									From the overview · Beacon
								</footer>
							</blockquote>
						</div>
					</div>

					<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_18rem] xl:items-start">
						<DirectionReadingRail
							mockPath={ARCHETYPE_DIRECTION_MOCK_PATH}
							chapters={BEACON_READING_CHAPTERS}
						/>

						<div className="min-w-0 space-y-6">
							<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
								<div className={cn(directionArticleProseClass)}>
									<Content />
								</div>
							</article>
							<AssessmentCTA tier="archetype" ctaText={entry.cta} />
						</div>

						<RelatedPatternsColumn compatibleArchetypes={compatibleArchetypes} />
					</section>
				</div>
			</PageMain>
		</>
	);
}
