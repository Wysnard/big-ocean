import { createFileRoute, notFound } from "@tanstack/react-router";
import { LibraryPlaceholderPage } from "@/components/library/LibraryPlaceholderPage";
import {
	buildBreadcrumbSchema,
	buildCollectionPageSchema,
	buildJsonLdGraph,
} from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

export const Route = createFileRoute("/library/facet/$slug")({
	loader: () => {
		throw notFound();
	},
	head: () => ({
		meta: [
			{ title: "Facet Library | big-ocean" },
			{
				name: "description",
				content:
					"Facet-level explainers are scaffolded and coming next in the big-ocean knowledge library.",
			},
		],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify(
					buildJsonLdGraph([
						buildCollectionPageSchema({
							origin: SITE_ORIGIN,
							title: "Facet Library",
							description: "Facet-level explainers are scaffolded and coming next in the library.",
							pathname: "/library/facet/coming-soon",
						}),
						buildBreadcrumbSchema([
							{ name: "Home", url: `${SITE_ORIGIN}/` },
							{ name: "Library", url: `${SITE_ORIGIN}/library` },
							{ name: "Facet Library", url: `${SITE_ORIGIN}/library/facet/coming-soon` },
						]),
					]),
				),
			},
		],
	}),
	component: FacetPlaceholderPage,
});

function FacetPlaceholderPage() {
	return (
		<LibraryPlaceholderPage
			title="Facet Library"
			description="Facet-level explainers are scaffolded and will expand from the core trait content."
			tier="facet"
		/>
	);
}
