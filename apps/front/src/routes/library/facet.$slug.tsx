import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LETTER_MAP,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetName,
	isFacetName,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain";
import { BookOpenText, Layers3, MapPinned } from "lucide-react";
import { AssessmentCTA } from "@/components/library/AssessmentCTA";
import { FacetPolesSection } from "@/components/library/FacetPolesSection";
import { FacetSiblingMapSection } from "@/components/library/FacetSiblingMapSection";
import { KnowledgeArticleLayout } from "@/components/library/KnowledgeArticleLayout";
import { LongFormSeam } from "@/components/library/LongFormSeam";
import { libraryArticleProseClass } from "@/components/library/library-article-prose";
import { humanizeUnderscored } from "@/lib/humanize-slug";
import {
	getLibraryEntry,
	getLibraryEntryData,
	getLibraryReadTimeMinutes,
} from "@/lib/library-content";
import { getFacetReadingChapters } from "@/lib/library-facet-reading-chapters";
import { buildBreadcrumbSchema, buildFacetSchema, buildJsonLdGraph } from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

function getFacetPageData(slug: string) {
	if (!isFacetName(slug)) {
		return undefined;
	}

	const entry = getLibraryEntryData("facet", slug);

	if (!entry) {
		return undefined;
	}

	const article = getLibraryEntry("facet", slug);

	if (!article) {
		return undefined;
	}

	const facetName = slug as FacetName;
	const parentTrait = FACET_TO_TRAIT[facetName];
	const traitEntry = getLibraryEntryData("trait", parentTrait);
	const parentTraitMentionName =
		traitEntry?.title ?? `${humanizeUnderscored(parentTrait)} trait guide`;

	const levels = Object.entries(FACET_DESCRIPTIONS[facetName].levels).map(([code, description]) => ({
		code,
		label: FACET_LEVEL_LABELS[code as keyof typeof FACET_LEVEL_LABELS],
		description,
	}));

	return {
		entry,
		parentTrait,
		parentTraitLabel: humanizeUnderscored(parentTrait),
		parentTraitMentionName,
		levels,
	};
}

export const Route = createFileRoute("/library/facet/$slug")({
	loader: ({ params }) => {
		const pageData = getFacetPageData(params.slug);

		if (!pageData) {
			throw notFound();
		}

		return pageData;
	},
	head: ({ loaderData }) => {
		if (!loaderData) {
			return {};
		}

		return {
			meta: [
				{ title: `${loaderData.entry.title} | big-ocean` },
				{ name: "description", content: loaderData.entry.description },
				{ property: "og:title", content: loaderData.entry.title },
				{ property: "og:description", content: loaderData.entry.description },
				{ property: "og:type", content: "article" },
			],
			links: [{ rel: "canonical", href: `${SITE_ORIGIN}${loaderData.entry.pathname}` }],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify(
						buildJsonLdGraph([
							...buildFacetSchema({
								origin: SITE_ORIGIN,
								entry: loaderData.entry,
								parentTraitUrl: `/library/trait/${loaderData.parentTrait}`,
								parentTraitMentionName: loaderData.parentTraitMentionName,
							}),
							buildBreadcrumbSchema([
								{ name: "Home", url: `${SITE_ORIGIN}/` },
								{ name: "Library", url: `${SITE_ORIGIN}/library` },
								{ name: loaderData.entry.title, url: `${SITE_ORIGIN}${loaderData.entry.pathname}` },
							]),
						]),
					),
				},
			],
		};
	},
	component: FacetArticlePage,
});

function pickSiblingContinueSlug(facet: FacetName, parentTrait: TraitName): FacetName | null {
	const slugs = TRAIT_TO_FACETS[parentTrait];
	if (slugs.length <= 1) {
		return null;
	}
	const idx = slugs.indexOf(facet);
	for (let i = 1; i < slugs.length; i++) {
		const next = slugs[(idx + i) % slugs.length];
		if (next !== facet) return next;
	}
	const alt = slugs.find((s) => s !== facet);
	return alt ?? null;
}

function FacetArticlePage() {
	const { entry, parentTrait, parentTraitLabel, levels } = Route.useLoaderData();
	const article = getLibraryEntry("facet", entry.slug);
	if (!article) {
		throw notFound();
	}
	const { Content } = article;
	const facet = entry.slug as FacetName;
	const [lowCode, highCode] = FACET_LETTER_MAP[facet];
	const traitEntry = getLibraryEntryData("trait", parentTrait);
	const siblingSlugs = TRAIT_TO_FACETS[parentTrait];
	const continueSlug = pickSiblingContinueSlug(facet, parentTrait);
	const continueEntry = continueSlug ? getLibraryEntryData("facet", continueSlug) : undefined;
	const showSiblingContinue = siblingSlugs.length > 1 && continueSlug !== null;

	return (
		<KnowledgeArticleLayout
			tier="facet"
			articlePath={entry.pathname}
			title={entry.title}
			description={entry.description}
			readTimeMinutes={getLibraryReadTimeMinutes("facet", entry.slug)}
			readingChapters={getFacetReadingChapters(facet)}
			heroEyebrow={
				<>
					<MapPinned className="size-4 shrink-0" aria-hidden />
					<span>Facet guide</span>
				</>
			}
			heroPrimaryLine={
				<span>
					Part of{" "}
					<Link
						to="/library/trait/$slug"
						params={{ slug: parentTrait }}
						className="underline decoration-primary/40 underline-offset-4 hover:text-primary"
					>
						{traitEntry?.title ?? `${parentTraitLabel} trait`}
					</Link>
				</span>
			}
			mainColumn={
				<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<FacetPolesSection levels={levels} lowCode={lowCode} highCode={highCode} />
					<FacetSiblingMapSection parentTrait={parentTrait} currentFacet={facet} />
					<LongFormSeam />
					<div className={libraryArticleProseClass()}>
						<Content />
					</div>
				</article>
			}
			sideColumn={
				<div className="space-y-6">
					<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
						<h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
							<BookOpenText className="size-5 shrink-0 text-primary" aria-hidden />
							Parent trait
						</h2>
						<p className="mt-3 text-sm leading-6 text-muted-foreground">
							This facet is one of six dimensions within the broader trait.
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
					{showSiblingContinue && continueSlug ? (
						<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
								Continue exploring
							</p>
							<h2 className="mt-2 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
								<Layers3 className="size-4 shrink-0 text-primary" aria-hidden />
								Sibling facet
							</h2>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								Stay on the same trait — open a neighboring facet guide.
							</p>
							<Link
								to="/library/facet/$slug"
								params={{ slug: continueSlug }}
								className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
							>
								Read {continueEntry?.title ?? humanizeUnderscored(continueSlug)}
							</Link>
						</section>
					) : null}
				</div>
			}
		/>
	);
}
