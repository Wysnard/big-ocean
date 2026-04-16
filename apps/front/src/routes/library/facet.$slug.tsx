import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	FACET_DESCRIPTIONS,
	FACET_LETTER_MAP,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetName,
	isFacetName,
} from "@workspace/domain";
import { KnowledgeArticleLayout } from "@/components/library/KnowledgeArticleLayout";
import { getLibraryEntry, getLibraryEntryData } from "@/lib/library-content";
import { buildBreadcrumbSchema, buildFacetSchema, buildJsonLdGraph } from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

function humanize(value: string) {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function getFacetPageData(slug: string) {
	if (!isFacetName(slug)) {
		return undefined;
	}

	const entry = getLibraryEntryData("facet", slug);

	if (!entry) {
		return undefined;
	}

	const facetName = slug as FacetName;
	const parentTrait = FACET_TO_TRAIT[facetName];
	const traitEntry = getLibraryEntryData("trait", parentTrait);
	const parentTraitMentionName = traitEntry?.title ?? `${humanize(parentTrait)} trait guide`;

	const levels = Object.entries(FACET_DESCRIPTIONS[facetName].levels).map(([code, description]) => ({
		code,
		label: FACET_LEVEL_LABELS[code as keyof typeof FACET_LEVEL_LABELS],
		description,
	}));

	return {
		entry,
		parentTrait,
		parentTraitLabel: humanize(parentTrait),
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

function ParentTraitLink({ traitSlug, traitLabel }: { traitSlug: string; traitLabel: string }) {
	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">Parent trait</h2>
			<p className="mt-3 text-sm leading-6 text-muted-foreground">
				This facet is one of six dimensions within the broader trait.
			</p>
			<Link
				to="/library/trait/$slug"
				params={{ slug: traitSlug }}
				className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
			>
				Read the {traitLabel} guide →
			</Link>
		</section>
	);
}

function LevelBreakdown({
	levels,
	lowCode,
	highCode,
}: {
	levels: Array<{ code: string; label: string; description: string }>;
	lowCode: string;
	highCode: string;
}) {
	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">Two poles</h2>
			<div className="mt-4 space-y-3">
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

function FacetArticlePage() {
	const { entry, parentTrait, parentTraitLabel, levels } = Route.useLoaderData();
	const article = getLibraryEntry("facet", entry.slug)!;
	const Content = article.Content;
	const [lowCode, highCode] = FACET_LETTER_MAP[entry.slug as FacetName];

	return (
		<KnowledgeArticleLayout
			title={entry.title}
			description={entry.description}
			tier="facet"
			ctaText={entry.cta}
			supplementary={
				<div className="space-y-6">
					<ParentTraitLink traitSlug={parentTrait} traitLabel={parentTraitLabel} />
					<LevelBreakdown levels={levels} lowCode={lowCode} highCode={highCode} />
				</div>
			}
		>
			<Content />
		</KnowledgeArticleLayout>
	);
}
