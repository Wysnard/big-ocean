import { Link } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LETTER_MAP,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetName,
	getTraitLevelLabel,
	TRAIT_DESCRIPTIONS,
	type TraitName,
} from "@workspace/domain";
import { ArrowRight, BookOpenText, Compass, Layers3, MapPinned, Sparkles } from "lucide-react";
import { AssessmentCTA } from "@/components/library/AssessmentCTA";
import { FacetPolesSection } from "@/components/library/FacetPolesSection";
import { FacetSiblingMapSection } from "@/components/library/FacetSiblingMapSection";
import { LibraryNav } from "@/components/library/LibraryNav";
import { LibraryReadingRail } from "@/components/library/LibraryReadingRail";
import { LongFormSeam } from "@/components/library/LongFormSeam";
import { libraryArticleProseClass } from "@/components/library/library-article-prose";
import { ReadingTimeHero } from "@/components/library/ReadingTimeHero";
import { RelatedArchetypePatternsColumn } from "@/components/library/RelatedArchetypePatternsColumn";
import { TraitFacetMapSection } from "@/components/library/TraitFacetMapSection";
import { PageMain } from "@/components/PageMain";
import { humanizeUnderscored } from "@/lib/humanize-slug";
import {
	ARCHETYPE_RELATIONAL_ROLES,
	type ArchetypeSlug,
	COMPATIBLE_ARCHETYPE_SLUGS,
	isArchetypeSlug,
} from "@/lib/library-archetype-article-meta";
import { getArchetypeReadingChapters } from "@/lib/library-archetype-reading-chapters";
import {
	getLibraryEntry,
	getLibraryEntryData,
	getLibraryMdxRaw,
	getLibraryReadTimeMinutes,
	type LibraryEntryData,
} from "@/lib/library-content";
import { getFacetReadingChapters } from "@/lib/library-facet-reading-chapters";
import { LIBRARY_SCROLL_MT_CLASS, LIBRARY_STICKY_TOP_XL_CLASS } from "@/lib/library-layout";
import {
	archetypeShortNameFromTitle,
	extractArchetypeOverviewFirstParagraph,
} from "@/lib/library-mdx-helpers";
import { getTraitReadingChapters } from "@/lib/library-trait-reading-chapters";

const TRAIT_SLUG: TraitName = "openness";
const FACET_SLUG: FacetName = "imagination";
const ARCHETYPE_SLUG = "beacon-personality-archetype";

const TRAIT_DIRECTION_MOCK_PATH = "/dev/library/direction/trait" as const;
const FACET_DIRECTION_MOCK_PATH = "/dev/library/direction/facet" as const;
const ARCHETYPE_DIRECTION_MOCK_PATH = "/dev/library/direction/archetype" as const;

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

function getCompatibleArchetypes(slug: ArchetypeSlug) {
	return (COMPATIBLE_ARCHETYPE_SLUGS[slug] ?? [])
		.map((relatedSlug) => getLibraryEntryData("archetype", relatedSlug))
		.filter((entry): entry is LibraryEntryData => Boolean(entry))
		.map((entry) => ({
			title: entry.title,
			description: entry.description,
			pathname: entry.pathname,
		}));
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
									{humanizeUnderscored(TRAIT_SLUG)} · Big Five reference
								</p>
								<h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
									{entry.title}
								</h1>
								<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
									{entry.description}
								</p>
								<ReadingTimeHero minutes={getLibraryReadTimeMinutes("trait", TRAIT_SLUG)} />
							</header>
						</div>
					</div>

					<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_20rem] xl:items-start">
						<LibraryReadingRail
							articlePath={TRAIT_DIRECTION_MOCK_PATH}
							chapters={getTraitReadingChapters(TRAIT_SLUG)}
						/>

						<div className="min-w-0 space-y-6">
							<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
								<TraitFacetMapSection trait={TRAIT_SLUG} />
								<section
									id="across-the-spectrum"
									className={`mb-10 ${LIBRARY_SCROLL_MT_CLASS} rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 sm:p-6`}
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
								<LongFormSeam />
								<div className={libraryArticleProseClass()}>
									<Content />
								</div>
							</article>
						</div>

						<div
							className={`space-y-6 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:sticky ${LIBRARY_STICKY_TOP_XL_CLASS} xl:self-start`}
						>
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
	const parentTraitLabel = humanizeUnderscored(parentTrait);
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
								<ReadingTimeHero minutes={getLibraryReadTimeMinutes("facet", FACET_SLUG)} />
							</header>
						</div>
					</div>

					<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_20rem] xl:items-start">
						<LibraryReadingRail
							articlePath={FACET_DIRECTION_MOCK_PATH}
							chapters={getFacetReadingChapters(FACET_SLUG)}
						/>

						<div className="min-w-0 space-y-6">
							<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
								<FacetPolesSection levels={levels} lowCode={lowCode} highCode={highCode} />
								<FacetSiblingMapSection parentTrait={parentTrait} currentFacet={FACET_SLUG} />
								<LongFormSeam />
								<div className={libraryArticleProseClass()}>
									<Content />
								</div>
							</article>
						</div>

						<div
							className={`space-y-6 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:sticky ${LIBRARY_STICKY_TOP_XL_CLASS} xl:self-start`}
						>
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

/** Archetype: identity-leaning hero pull-quote, reading rail, article + inline CTA, relational patterns rail. */
export function LibraryArticleDirectionMockupArchetypePage() {
	const entry = getLibraryEntryData("archetype", ARCHETYPE_SLUG);
	const article = getLibraryEntry("archetype", ARCHETYPE_SLUG);
	if (!entry || !article) {
		throw new Error("Beacon archetype article missing for direction mockup.");
	}
	const { Content } = article;
	const compatibleArchetypes = getCompatibleArchetypes(ARCHETYPE_SLUG);
	const rawMdx = getLibraryMdxRaw("archetype", ARCHETYPE_SLUG);
	const overviewExcerpt = rawMdx ? extractArchetypeOverviewFirstParagraph(rawMdx) : null;
	const pullQuoteBody = overviewExcerpt ?? entry.description;
	const roleByRelatedSlug: Record<string, string> = {};
	for (const row of compatibleArchetypes) {
		const relatedSlug = row.pathname.split("/").filter(Boolean).pop();
		if (!relatedSlug || !isArchetypeSlug(relatedSlug)) {
			continue;
		}
		roleByRelatedSlug[relatedSlug] =
			ARCHETYPE_RELATIONAL_ROLES[ARCHETYPE_SLUG][relatedSlug] ?? "Also explore";
	}

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
								<ReadingTimeHero minutes={getLibraryReadTimeMinutes("archetype", ARCHETYPE_SLUG)} />
							</header>
							<blockquote className="mt-6 border-l-2 border-primary/45 pl-5 text-foreground sm:pl-6 lg:mt-0 lg:pl-8">
								<p className="font-heading text-sm italic leading-relaxed sm:text-base lg:text-lg xl:text-xl">
									{pullQuoteBody}
								</p>
								<footer className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mt-4">
									From the overview · {archetypeShortNameFromTitle(entry.title)}
								</footer>
							</blockquote>
						</div>
					</div>

					<section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_18rem] xl:items-start">
						<LibraryReadingRail
							articlePath={ARCHETYPE_DIRECTION_MOCK_PATH}
							chapters={getArchetypeReadingChapters(ARCHETYPE_SLUG)}
						/>

						<div className="min-w-0 space-y-6">
							<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
								<div className={libraryArticleProseClass()}>
									<Content />
								</div>
							</article>
							<AssessmentCTA tier="archetype" ctaText={entry.cta} />
						</div>

						<RelatedArchetypePatternsColumn
							compatibleArchetypes={compatibleArchetypes}
							roleByRelatedSlug={roleByRelatedSlug}
						/>
					</section>
				</div>
			</PageMain>
		</>
	);
}
