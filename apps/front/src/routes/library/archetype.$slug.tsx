import { createFileRoute, notFound } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AssessmentCTA } from "@/components/library/AssessmentCTA";
import { KnowledgeArticleLayout } from "@/components/library/KnowledgeArticleLayout";
import { libraryArticleProseClass } from "@/components/library/library-article-prose";
import { RelatedArchetypePatternsColumn } from "@/components/library/RelatedArchetypePatternsColumn";
import {
	ARCHETYPE_RELATIONAL_ROLES,
	type ArchetypeSlug,
	COMPATIBLE_ARCHETYPE_SLUGS,
	isArchetypeSlug,
} from "@/lib/library-archetype-article-meta";
import { getArchetypeReadingChapters } from "@/lib/library-archetype-reading-chapters";
import {
	getLibraryEntry,
	getLibraryEntryData,
	getLibraryMdxRaw,
	getLibraryReadTimeMinutes,
	type LibraryEntryData,
} from "@/lib/library-content";
import {
	archetypeShortNameFromTitle,
	extractArchetypeOverviewFirstParagraph,
} from "@/lib/library-mdx-helpers";
import { buildArchetypeSchema, buildBreadcrumbSchema, buildJsonLdGraph } from "@/lib/schema-org";

const SITE_ORIGIN = import.meta.env.VITE_APP_URL ?? "https://bigocean.dev";

function getCompatibleArchetypes(slug: ArchetypeSlug) {
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
		if (!isArchetypeSlug(params.slug)) {
			throw notFound();
		}

		const entry = getLibraryEntryData("archetype", params.slug);
		const article = getLibraryEntry("archetype", params.slug);

		if (!entry || !article) {
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

function ArchetypeArticlePage() {
	const { entry, compatibleArchetypes } = Route.useLoaderData();
	const article = getLibraryEntry("archetype", entry.slug);
	if (!article) {
		throw notFound();
	}
	const { Content } = article;
	const slug = entry.slug as ArchetypeSlug;
	const rawMdx = getLibraryMdxRaw("archetype", slug);
	const overviewExcerpt = rawMdx ? extractArchetypeOverviewFirstParagraph(rawMdx) : null;
	const pull =
		overviewExcerpt !== null
			? {
					body: overviewExcerpt,
					footer: `From the overview · ${archetypeShortNameFromTitle(entry.title)}`,
				}
			: undefined;
	const rolesForSlug = ARCHETYPE_RELATIONAL_ROLES[slug] ?? {};
	const roleByRelatedSlug: Record<string, string> = {};
	for (const row of compatibleArchetypes) {
		const relatedSlug = row.pathname.split("/").filter(Boolean).pop();
		if (!relatedSlug || !isArchetypeSlug(relatedSlug)) {
			continue;
		}
		roleByRelatedSlug[relatedSlug] = rolesForSlug[relatedSlug] ?? "Also explore";
	}

	return (
		<KnowledgeArticleLayout
			tier="archetype"
			articlePath={entry.pathname}
			title={entry.title}
			description={entry.description}
			readTimeMinutes={getLibraryReadTimeMinutes("archetype", slug)}
			readingChapters={getArchetypeReadingChapters(slug)}
			heroEyebrow={
				<>
					<Sparkles className="size-4 shrink-0" aria-hidden />
					<span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/90">
						Archetype guide
					</span>
				</>
			}
			heroPrimaryLine={<span>Archetypal pattern · lived language</span>}
			pullQuote={
				pull ?? {
					body: entry.description,
					footer: "From the overview",
				}
			}
			mainColumn={
				<>
					<article className="rounded-[2rem] border border-border/70 bg-background p-6 shadow-sm sm:p-8">
						<div className={libraryArticleProseClass()}>
							<Content />
						</div>
					</article>
					<AssessmentCTA tier="archetype" ctaText={entry.cta} />
				</>
			}
			sideColumn={
				<RelatedArchetypePatternsColumn
					compatibleArchetypes={compatibleArchetypes}
					roleByRelatedSlug={roleByRelatedSlug}
				/>
			}
		/>
	);
}
