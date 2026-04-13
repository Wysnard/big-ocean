import { createFileRoute } from "@tanstack/react-router";
import { LibraryPlaceholderPage } from "@/components/library/LibraryPlaceholderPage";
import {
	buildBreadcrumbSchema,
	buildCollectionPageSchema,
	buildJsonLdGraph,
} from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

export const Route = createFileRoute("/library/science/$slug")({
	head: () => ({
		meta: [
			{ title: "Science Notes | big-ocean" },
			{
				name: "description",
				content:
					"Research-backed explainers are scaffolded and coming next in the big-ocean knowledge library.",
			},
		],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify(
					buildJsonLdGraph([
						buildCollectionPageSchema({
							origin: SITE_ORIGIN,
							title: "Science Notes",
							description: "Research-backed explainers are scaffolded and coming next in the library.",
							pathname: "/library/science/coming-soon",
						}),
						buildBreadcrumbSchema([
							{ name: "Home", url: `${SITE_ORIGIN}/` },
							{ name: "Library", url: `${SITE_ORIGIN}/library` },
							{ name: "Science Notes", url: `${SITE_ORIGIN}/library/science/coming-soon` },
						]),
					]),
				),
			},
		],
	}),
	component: SciencePlaceholderPage,
});

function SciencePlaceholderPage() {
	return (
		<LibraryPlaceholderPage
			title="Science Notes"
			description="Research-backed explainers are scaffolded and ready for the science content batch."
			tier="science"
		/>
	);
}
