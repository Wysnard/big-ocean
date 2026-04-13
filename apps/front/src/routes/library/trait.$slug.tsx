import { createFileRoute, notFound } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
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
								{ name: "Traits", url: `${SITE_ORIGIN}/library` },
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
	tagline,
	spectrum,
}: {
	tagline: string;
	spectrum: Array<{ level: string; description: string }>;
}) {
	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">Across the spectrum</h2>
			<p className="mt-3 text-sm leading-6 text-muted-foreground">{tagline}</p>
			<div className="mt-4 space-y-3">
				{spectrum.map((level) => (
					<div key={level.level} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							{level.level}
						</p>
						<p className="mt-2 text-sm leading-6 text-foreground/90">{level.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}

function FacetBreakdown({
	facets,
}: {
	facets: Array<{ name: string; description: Record<string, string> }>;
}) {
	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">Facet breakdown</h2>
			<div className="mt-4 space-y-3">
				{facets.map((facet) => (
					<div key={facet.name} className="rounded-[1.25rem] border border-border/70 bg-background p-4">
						<h3 className="text-base font-semibold text-foreground">{facet.name}</h3>
						<div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
							{Object.entries(facet.description).map(([level, description]) => (
								<p key={level}>
									<span className="font-medium text-foreground">{level}:</span> {description}
								</p>
							))}
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
		return null;
	}

	const Content = article.Content;

	return (
		<KnowledgeArticleLayout
			title={entry.title}
			description={entry.description}
			tier="trait"
			ctaText={entry.cta}
			breadcrumbs={[
				{ label: "Home", to: "/" },
				{ label: "Library", to: "/library" },
				{ label: "Traits", to: "/library" },
				{ label: entry.title },
			]}
			supplementary={
				<div className="space-y-6">
					<SpectrumCard tagline={tagline} spectrum={spectrum} />
					<FacetBreakdown facets={facets} />
				</div>
			}
		>
			<Content />
		</KnowledgeArticleLayout>
	);
}
