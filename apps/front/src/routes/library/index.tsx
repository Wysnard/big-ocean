import { createFileRoute, Link } from "@tanstack/react-router";
import { LibraryNav } from "@/components/library/LibraryNav";
import { PageMain } from "@/components/PageMain";
import {
	getAllLibraryEntries,
	LIBRARY_TIER_DESCRIPTIONS,
	LIBRARY_TIER_LABELS,
	LIBRARY_TIER_SINGULAR_LABELS,
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
				<div className="mx-auto max-w-6xl space-y-8">
					<section className="rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/[0.04] via-background to-primary/[0.07] p-6 shadow-sm sm:p-8">
						<p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
							Knowledge Library
						</p>
						<h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
							Searchable explanations for the way people are wired.
						</h1>
						<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
							These articles translate the assessment into plain language without flattening the science.
							Start with archetypes for memorable patterns, then move into traits for the Big Five details.
						</p>
					</section>

					{groups.map((group) => (
						<section
							key={group.tier}
							className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h2 className="text-2xl font-semibold tracking-tight text-foreground">{group.label}</h2>
									<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
										{group.description}
									</p>
								</div>
								<p className="text-sm text-muted-foreground">{group.entries.length} published</p>
							</div>

							<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								{group.entries.length > 0 ? (
									group.entries.map((entry) => (
										<Link
											key={entry.pathname}
											to={entry.pathname}
											data-testid={`library-card-${entry.slug}`}
											className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-5 transition-transform hover:-translate-y-0.5 hover:border-foreground/20"
										>
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
												{LIBRARY_TIER_SINGULAR_LABELS[group.tier]}
											</p>
											<h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
												{entry.title}
											</h3>
											<p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.description}</p>
										</Link>
									))
								) : (
									<div className="rounded-[1.5rem] border border-dashed border-border bg-muted/15 p-5 text-sm leading-6 text-muted-foreground">
										This tier is scaffolded and waiting for content.
									</div>
								)}
							</div>
						</section>
					))}
				</div>
			</PageMain>
		</>
	);
}
