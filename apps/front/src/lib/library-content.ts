import type { ComponentType } from "react";

export const LIBRARY_TIERS = ["archetype", "trait", "facet", "science", "guides"] as const;

export type LibraryTier = (typeof LIBRARY_TIERS)[number];
export type LibrarySchemaType = "Article" | "DefinedTerm" | "ScholarlyArticle";

export interface LibraryFrontmatter {
	title: string;
	description: string;
	slug: string;
	tier: LibraryTier;
	schemaType: LibrarySchemaType;
	cta: string;
}

type LibraryModule = {
	default: ComponentType;
	frontmatter: LibraryFrontmatter;
	rawContent: string;
};

export interface LibraryEntry extends LibraryFrontmatter {
	Content: ComponentType;
	bodyText: string;
	pathname: string;
}

export type LibraryEntryData = Omit<LibraryEntry, "Content">;

export const LIBRARY_TIER_LABELS: Record<LibraryTier, string> = {
	archetype: "Archetypes",
	trait: "Traits",
	facet: "Facets",
	science: "Science",
	guides: "Guides",
};

export const LIBRARY_TIER_DESCRIPTIONS: Record<LibraryTier, string> = {
	archetype: "Memorable personality patterns translated into practical language.",
	trait: "Big Five trait explainers grounded in the underlying psychology.",
	facet: "Facet-level deep dives for readers who want more precision.",
	science: "Research notes, methods, and evidence behind the model.",
	guides: "Applied walkthroughs for relationships, work, growth, and reflection.",
};

const TIER_ORDER: Record<LibraryTier, number> = {
	archetype: 0,
	trait: 1,
	facet: 2,
	science: 3,
	guides: 4,
};

const CONTENT_MODULES = import.meta.glob<LibraryModule>("../content/library/**/*.mdx", {
	eager: true,
});

function isLibraryTier(value: string): value is LibraryTier {
	return (LIBRARY_TIERS as readonly string[]).includes(value);
}

function isLibrarySchemaType(value: string): value is LibrarySchemaType {
	return value === "Article" || value === "DefinedTerm" || value === "ScholarlyArticle";
}

function assertFrontmatter(
	frontmatter: LibraryFrontmatter,
	modulePath: string,
): LibraryFrontmatter {
	if (!frontmatter.title || !frontmatter.description || !frontmatter.slug || !frontmatter.cta) {
		throw new Error(`Incomplete library frontmatter in ${modulePath}`);
	}

	if (!isLibraryTier(frontmatter.tier)) {
		throw new Error(`Invalid library tier "${frontmatter.tier}" in ${modulePath}`);
	}

	if (!isLibrarySchemaType(frontmatter.schemaType)) {
		throw new Error(`Invalid schema type "${frontmatter.schemaType}" in ${modulePath}`);
	}

	return frontmatter;
}

export function buildLibraryPath(tier: LibraryTier, slug: string) {
	return `/library/${tier}/${slug}`;
}

function toEntry(modulePath: string, module: LibraryModule): LibraryEntry {
	const frontmatter = assertFrontmatter(module.frontmatter, modulePath);

	return {
		...frontmatter,
		Content: module.default,
		bodyText: module.rawContent.trim(),
		pathname: buildLibraryPath(frontmatter.tier, frontmatter.slug),
	};
}

const LIBRARY_ENTRIES = Object.entries(CONTENT_MODULES)
	.map(([modulePath, module]) => toEntry(modulePath, module))
	.sort((left, right) => {
		const tierDelta = TIER_ORDER[left.tier] - TIER_ORDER[right.tier];

		if (tierDelta !== 0) {
			return tierDelta;
		}

		return left.title.localeCompare(right.title);
	});

export function getAllLibraryEntries() {
	return [...LIBRARY_ENTRIES];
}

export function listLibraryEntriesByTier(tier: LibraryTier) {
	return LIBRARY_ENTRIES.filter((entry) => entry.tier === tier);
}

export function getLibraryEntry(tier: LibraryTier, slug: string) {
	return LIBRARY_ENTRIES.find((entry) => entry.tier === tier && entry.slug === slug);
}

export function getLibraryEntryData(tier: LibraryTier, slug: string): LibraryEntryData | undefined {
	const entry = getLibraryEntry(tier, slug);

	if (!entry) {
		return undefined;
	}

	const { Content: _Content, ...entryData } = entry;

	return entryData;
}
