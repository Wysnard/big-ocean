import { createFileRoute } from "@tanstack/react-router";
import { LibraryNav } from "@/components/library/LibraryNav";
import { PersonalityAtlasLanding } from "@/components/library/PersonalityAtlasLanding";
import { PageMain } from "@/components/PageMain";
import {
	getAllLibraryEntries,
	LIBRARY_TIER_DESCRIPTIONS,
	LIBRARY_TIER_LABELS,
	LIBRARY_TIERS,
	type LibraryEntryData,
	type LibraryTier,
} from "@/lib/library-content";
import {
	buildBreadcrumbSchema,
	buildCollectionPageSchema,
	buildJsonLdGraph,
} from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

type LibraryGroup = {
	tier: LibraryTier;
	label: string;
	description: string;
	entries: LibraryEntryData[];
};

function toEntryData(entry: ReturnType<typeof getAllLibraryEntries>[number]): LibraryEntryData {
	const { Content: _Content, ...entryData } = entry;
	return entryData;
}

function getLibraryGroups(): LibraryGroup[] {
	const entries = getAllLibraryEntries();

	return LIBRARY_TIERS.map((tier) => ({
		tier,
		label: LIBRARY_TIER_LABELS[tier],
		description: LIBRARY_TIER_DESCRIPTIONS[tier],
		entries: entries.filter((entry) => entry.tier === tier).map(toEntryData),
	}));
}

export const Route = createFileRoute("/library/")({
	loader: () => ({
		groups: getLibraryGroups(),
	}),
	head: () => ({
		meta: [
			{ title: "Knowledge Library | big-ocean" },
			{
				name: "description",
				content:
					"Explore big-ocean articles on archetypes, Big Five traits, and the science behind the assessment.",
			},
			{ property: "og:title", content: "Knowledge Library | big-ocean" },
			{
				property: "og:description",
				content:
					"Explore big-ocean articles on archetypes, Big Five traits, and the science behind the assessment.",
			},
			{ property: "og:type", content: "website" },
		],
		links: [{ rel: "canonical", href: `${SITE_ORIGIN}/library` }],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify(
					buildJsonLdGraph([
						buildCollectionPageSchema({
							origin: SITE_ORIGIN,
							title: "big-ocean Knowledge Library",
							description:
								"Archetype guides, trait explainers, and future research-backed articles from big-ocean.",
							pathname: "/library",
						}),
						buildBreadcrumbSchema([
							{ name: "Home", url: `${SITE_ORIGIN}/` },
							{ name: "Library", url: `${SITE_ORIGIN}/library` },
						]),
					]),
				),
			},
		],
	}),
	component: LibraryIndexPage,
});

function LibraryIndexPage() {
	const { groups } = Route.useLoaderData() as { groups: LibraryGroup[] };

	return (
		<>
			<LibraryNav />
			<PageMain className="bg-background px-4 py-10 sm:px-6 lg:px-8">
				<PersonalityAtlasLanding groups={groups} />
			</PageMain>
		</>
	);
}
