import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	type FacetLevelCode,
	TRAIT_DESCRIPTIONS,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain";
import { BookOpenText, Layers3 } from "lucide-react";
import { AssessmentCTA } from "@/components/library/AssessmentCTA";
import { KnowledgeArticleLayout } from "@/components/library/KnowledgeArticleLayout";
import { LongFormSeam } from "@/components/library/LongFormSeam";
import { libraryArticleProseClass } from "@/components/library/library-article-prose";
import { TraitFacetMapSection } from "@/components/library/TraitFacetMapSection";
import { TraitSpectrumSection } from "@/components/library/TraitSpectrumSection";
import { humanizeUnderscored } from "@/lib/humanize-slug";
import {
	getLibraryEntry,
	getLibraryEntryData,
	getLibraryReadTimeMinutes,
} from "@/lib/library-content";
import { getTraitReadingChapters } from "@/lib/library-trait-reading-chapters";
import { buildBreadcrumbSchema, buildJsonLdGraph, buildTraitSchema } from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

function isTraitName(value: string): value is TraitName {
	return value in TRAIT_DESCRIPTIONS;
}

function getTraitPageData(slug: string) {
	if (!isTraitName(slug)) {
		return undefined;
	}

	const entry = getLibraryEntryData("trait", slug);

	if (!entry) {
		return undefined;
	}

	const article = getLibraryEntry("trait", slug);

	if (!article) {
		return undefined;
	}

	const spectrum = Object.entries(TRAIT_DESCRIPTIONS[slug].levels).map(([level, description]) => ({
		level,
		description,
	}));

	const facets = TRAIT_TO_FACETS[slug].map((facetName) => ({
		name: humanizeUnderscored(facetName),
		description: FACET_DESCRIPTIONS[facetName].levels,
	}));

	return {
		entry,
		tagline: TRAIT_DESCRIPTIONS[slug].tagline,
		spectrum,
		facets,
	};
}

export const Route = createFileRoute("/library/trait/$slug")({
	loader: ({ params }) => {
		const pageData = getTraitPageData(params.slug);

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
							...buildTraitSchema({
								origin: SITE_ORIGIN,
								entry: loaderData.entry,
								facetNames: loaderData.facets.map((facet) => facet.name),
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
	component: TraitArticlePage,
});

function FacetBreakdown({
	facets,
	omitSectionHeading = false,
}: {
	facets: Array<{ name: string; description: Record<string, string> }>;
	omitSectionHeading?: boolean;
}) {
	return (
		<section
			className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5"
			aria-label={omitSectionHeading ? "Facet breakdown detail" : undefined}
		>
			{!omitSectionHeading ? (
				<h2 className="text-lg font-semibold tracking-tight text-foreground">Facet breakdown</h2>
			) : null}
			<div className={omitSectionHeading ? "space-y-3" : "mt-4 space-y-3"}>
				{facets.map((facet) => (
					<div key={facet.name} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
						<h3 className="text-base font-semibold text-foreground">{facet.name}</h3>
						<div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
							{Object.entries(facet.description).map(([code, description]) => {
								const label = FACET_LEVEL_LABELS[code as FacetLevelCode] ?? code;
								return (
									<p key={code}>
										<span className="font-semibold text-foreground">{label}</span>
										<span className="ml-2 font-normal tabular-nums text-muted-foreground">({code})</span>
										<span className="text-foreground/90"> — {description}</span>
									</p>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function TraitArticlePage() {
	const { entry, tagline, spectrum, facets } = Route.useLoaderData();
	const article = getLibraryEntry("trait", entry.slug);
	if (!article) {
		throw notFound();
	}
	const { Content } = article;
	const trait = entry.slug as TraitName;
	const facetSlugs = TRAIT_TO_FACETS[trait];
	const showContinueExploring = facetSlugs.length > 0;
	const firstFacetSlug = facetSlugs[0];
	const firstFacetTitle =
		firstFacetSlug !== undefined
			? (getLibraryEntryData("facet", firstFacetSlug)?.title ?? humanizeUnderscored(firstFacetSlug))
			: "";

	return (
		<KnowledgeArticleLayout
			tier="trait"
			articlePath={entry.pathname}
			title={entry.title}
			description={entry.description}
			readTimeMinutes={getLibraryReadTimeMinutes("trait", entry.slug)}
			readingChapters={getTraitReadingChapters(trait)}
			heroEyebrow={
				<>
					<BookOpenText className="size-4 shrink-0" aria-hidden />
					<span>Trait guide</span>
				</>
			}
			heroPrimaryLine={<span>{humanizeUnderscored(trait)} · Big Five reference</span>}
			mainColumn={
				<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
					<TraitFacetMapSection trait={trait} />
					<TraitSpectrumSection trait={trait} tagline={tagline} spectrum={spectrum} />
					<LongFormSeam />
					<div className={libraryArticleProseClass()}>
						<Content />
					</div>
					<FacetBreakdown facets={facets} omitSectionHeading />
				</article>
			}
			sideColumn={
				<div className="space-y-6">
					<AssessmentCTA tier="trait" ctaText={entry.cta} />
					{showContinueExploring && firstFacetSlug !== undefined ? (
						<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
								Continue exploring
							</p>
							<h2 className="mt-2 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
								<Layers3 className="size-4 shrink-0 text-primary" aria-hidden />
								Browse facets
							</h2>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								Start with a facet that maps how this trait shows up in everyday life.
							</p>
							<Link
								to="/library/facet/$slug"
								params={{ slug: firstFacetSlug }}
								className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
							>
								Read {firstFacetTitle}
							</Link>
						</section>
					) : null}
				</div>
			}
		/>
	);
}
