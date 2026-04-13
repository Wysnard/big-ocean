import { createFileRoute, notFound } from "@tanstack/react-router";
import { KnowledgeArticleLayout } from "@/components/library/KnowledgeArticleLayout";
import { getLibraryEntry, getLibraryEntryData, type LibraryEntryData } from "@/lib/library-content";
import { buildArchetypeSchema, buildBreadcrumbSchema, buildJsonLdGraph } from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

const COMPATIBLE_ARCHETYPE_SLUGS: Record<string, string[]> = {
	"beacon-personality-archetype": [
		"anchor-personality-archetype",
		"compass-personality-archetype",
		"ember-personality-archetype",
	],
	"forge-personality-archetype": [
		"beacon-personality-archetype",
		"anchor-personality-archetype",
		"ember-personality-archetype",
	],
	"compass-personality-archetype": [
		"beacon-personality-archetype",
		"anchor-personality-archetype",
		"ember-personality-archetype",
	],
	"anchor-personality-archetype": [
		"beacon-personality-archetype",
		"compass-personality-archetype",
		"ember-personality-archetype",
	],
	"ember-personality-archetype": [
		"compass-personality-archetype",
		"anchor-personality-archetype",
		"beacon-personality-archetype",
	],
};

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

export const Route = createFileRoute("/library/archetype/$slug")({
	loader: ({ params }) => {
		const entry = getLibraryEntryData("archetype", params.slug);

		if (!entry) {
			throw notFound();
		}

		return {
			entry,
			compatibleArchetypes: getCompatibleArchetypes(params.slug),
		};
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
							...buildArchetypeSchema({
								origin: SITE_ORIGIN,
								entry: loaderData.entry,
								compatibleArchetypes: loaderData.compatibleArchetypes,
							}),
							buildBreadcrumbSchema([
								{ name: "Home", url: `${SITE_ORIGIN}/` },
								{ name: "Library", url: `${SITE_ORIGIN}/library` },
								{ name: "Archetypes", url: `${SITE_ORIGIN}/library` },
								{ name: loaderData.entry.title, url: `${SITE_ORIGIN}${loaderData.entry.pathname}` },
							]),
						]),
					),
				},
			],
		};
	},
	component: ArchetypeArticlePage,
});

function CompatibleArchetypes({
	compatibleArchetypes,
}: {
	compatibleArchetypes: Array<{ title: string; description: string; pathname: string }>;
}) {
	return (
		<section className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">Compatible archetypes</h2>
			<div className="mt-4 space-y-3">
				{compatibleArchetypes.map((archetype) => (
					<a
						key={archetype.pathname}
						href={archetype.pathname}
						data-testid={`compatible-archetype-${archetype.pathname.split("/").pop()}`}
						className="block rounded-[1.25rem] border border-border/70 bg-background p-4 transition-transform hover:-translate-y-0.5"
					>
						<h3 className="text-base font-semibold text-foreground">{archetype.title}</h3>
						<p className="mt-2 text-sm leading-6 text-muted-foreground">{archetype.description}</p>
					</a>
				))}
			</div>
		</section>
	);
}

function ArchetypeArticlePage() {
	const { entry, compatibleArchetypes } = Route.useLoaderData();
	const article = getLibraryEntry("archetype", entry.slug);

	if (!article) {
		return null;
	}

	const Content = article.Content;

	return (
		<KnowledgeArticleLayout
			title={entry.title}
			description={entry.description}
			tier="archetype"
			ctaText={entry.cta}
			breadcrumbs={[
				{ label: "Home", to: "/" },
				{ label: "Library", to: "/library" },
				{ label: "Archetypes", to: "/library" },
				{ label: entry.title },
			]}
			supplementary={<CompatibleArchetypes compatibleArchetypes={compatibleArchetypes} />}
		>
			<Content />
		</KnowledgeArticleLayout>
	);
}
