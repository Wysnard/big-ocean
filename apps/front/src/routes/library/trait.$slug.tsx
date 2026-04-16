import { createFileRoute, notFound } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	type FacetLevelCode,
	getTraitLevelLabel,
	TRAIT_DESCRIPTIONS,
	TRAIT_TO_FACETS,
	type TraitName,
} from "@workspace/domain";
import { KnowledgeArticleLayout } from "@/components/library/KnowledgeArticleLayout";
import { getLibraryEntry, getLibraryEntryData } from "@/lib/library-content";
import { buildBreadcrumbSchema, buildJsonLdGraph, buildTraitSchema } from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

function humanize(value: string) {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

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

	const spectrum = Object.entries(TRAIT_DESCRIPTIONS[slug].levels).map(([level, description]) => ({
		level,
		description,
	}));

	const facets = TRAIT_TO_FACETS[slug].map((facetName) => ({
		name: humanize(facetName),
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

function SpectrumCard({
	trait,
	tagline,
	spectrum,
}: {
	trait: TraitName;
	tagline: string;
	spectrum: Array<{ level: string; description: string }>;
}) {
	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">Across the spectrum</h2>
			<p className="mt-3 text-sm leading-6 text-muted-foreground">{tagline}</p>
			<div className="mt-4 space-y-3">
				{spectrum.map((row) => {
					const levelName = getTraitLevelLabel(trait, row.level);
					return (
						<div key={row.level} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
							<p className="text-sm font-semibold leading-snug text-foreground">
								{levelName}
								<span className="ml-2 font-normal tabular-nums text-muted-foreground">({row.level})</span>
							</p>
							<p className="mt-2 text-sm leading-6 text-foreground/90">{row.description}</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function FacetBreakdown({
	facets,
	omitSectionHeading = false,
}: {
	facets: Array<{ name: string; description: Record<string, string> }>;
	/** When true, only the cards render (MDX already provides the “Facet breakdown” heading + intro). */
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
	const article = getLibraryEntry("trait", entry.slug)!;
	const Content = article.Content;

	return (
		<KnowledgeArticleLayout
			title={entry.title}
			description={entry.description}
			tier="trait"
			ctaText={entry.cta}
			supplementary={
				<div className="space-y-6">
					<SpectrumCard trait={entry.slug as TraitName} tagline={tagline} spectrum={spectrum} />
				</div>
			}
		>
			<Content />
			<FacetBreakdown facets={facets} omitSectionHeading />
		</KnowledgeArticleLayout>
	);
}
