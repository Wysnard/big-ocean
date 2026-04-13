import { createFileRoute, notFound } from "@tanstack/react-router";
import { LibraryPlaceholderPage } from "@/components/library/LibraryPlaceholderPage";
import {
	buildBreadcrumbSchema,
	buildCollectionPageSchema,
	buildJsonLdGraph,
} from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

export const Route = createFileRoute("/library/guides/$slug")({
	loader: () => {
		throw notFound();
	},
	head: () => ({
		meta: [
			{ title: "Practical Guides | big-ocean" },
			{
				name: "description",
				content: "Applied guides are scaffolded and coming next in the big-ocean knowledge library.",
			},
		],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify(
					buildJsonLdGraph([
						buildCollectionPageSchema({
							origin: SITE_ORIGIN,
							title: "Practical Guides",
							description: "Applied guides are scaffolded and coming next in the library.",
							pathname: "/library/guides/coming-soon",
						}),
						buildBreadcrumbSchema([
							{ name: "Home", url: `${SITE_ORIGIN}/` },
							{ name: "Library", url: `${SITE_ORIGIN}/library` },
							{ name: "Practical Guides", url: `${SITE_ORIGIN}/library/guides/coming-soon` },
						]),
					]),
				),
			},
		],
	}),
	component: GuidesPlaceholderPage,
});

function GuidesPlaceholderPage() {
	return (
		<LibraryPlaceholderPage
			title="Practical Guides"
			description="Applied guides are scaffolded and will connect the assessment to relationships, work, and growth."
			tier="guides"
		/>
	);
}
