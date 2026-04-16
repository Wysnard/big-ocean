import type { LibraryEntryData } from "./library-content";

const DEFAULT_ORIGIN = "https://bigocean.dev";

type BreadcrumbItem = {
	name: string;
	url: string;
};

type JsonLdNode = Record<string, unknown>;

function toAbsoluteUrl(origin: string, pathname: string) {
	return `${origin.replace(/\/$/, "")}${pathname}`;
}

function buildAssessmentOffer(origin: string, ctaText: string) {
	return {
		"@type": "Offer",
		name: "Free personality assessment",
		description: ctaText,
		price: "0",
		priceCurrency: "USD",
		availability: "https://schema.org/InStock",
		url: toAbsoluteUrl(origin, "/chat"),
		category: "Assessment",
	};
}

export function buildJsonLdGraph(nodes: JsonLdNode[]) {
	return {
		"@context": "https://schema.org",
		"@graph": nodes,
	};
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

export function buildCollectionPageSchema({
	origin = DEFAULT_ORIGIN,
	title,
	description,
	pathname,
}: {
	origin?: string;
	title: string;
	description: string;
	pathname: string;
}) {
	return {
		"@type": "CollectionPage",
		name: title,
		description,
		url: toAbsoluteUrl(origin, pathname),
		isPartOf: toAbsoluteUrl(origin, "/library"),
	};
}

export function buildArchetypeSchema({
	origin = DEFAULT_ORIGIN,
	entry,
	compatibleArchetypes,
}: {
	origin?: string;
	entry: LibraryEntryData;
	compatibleArchetypes: Array<{ title: string; pathname: string }>;
}) {
	const url = toAbsoluteUrl(origin, entry.pathname);
	const offer = buildAssessmentOffer(origin, entry.cta);

	return [
		{
			"@type": "Article",
			headline: entry.title,
			description: entry.description,
			articleSection: "Archetypes",
			mainEntityOfPage: url,
			url,
			offers: offer,
			mentions: compatibleArchetypes.map((item) => ({
				"@type": "Thing",
				name: item.title,
				url: toAbsoluteUrl(origin, item.pathname),
			})),
		},
	];
}

export function buildTraitSchema({
	origin = DEFAULT_ORIGIN,
	entry,
	facetNames,
}: {
	origin?: string;
	entry: LibraryEntryData;
	facetNames: string[];
}) {
	const url = toAbsoluteUrl(origin, entry.pathname);
	const offer = buildAssessmentOffer(origin, entry.cta);

	return [
		{
			"@type": "DefinedTerm",
			name: entry.title,
			description: entry.description,
			url,
			inDefinedTermSet: toAbsoluteUrl(origin, "/library/trait"),
			offers: offer,
		},
		{
			"@type": "EducationalOccupationalCredential",
			name: `${entry.title} explainer`,
			description: `Facet-level explanation for ${entry.title.toLowerCase()}.`,
			credentialCategory: "Psychology explainer",
			competencyRequired: facetNames,
			url,
			offers: offer,
		},
	];
}

export function buildFacetSchema({
	origin = DEFAULT_ORIGIN,
	entry,
	parentTraitUrl,
	parentTraitMentionName,
}: {
	origin?: string;
	entry: LibraryEntryData;
	parentTraitUrl: string;
	parentTraitMentionName: string;
}) {
	const url = toAbsoluteUrl(origin, entry.pathname);
	const offer = buildAssessmentOffer(origin, entry.cta);

	return [
		{
			"@type": "DefinedTerm",
			name: entry.title,
			description: entry.description,
			url,
			inDefinedTermSet: toAbsoluteUrl(origin, "/library/facet"),
			offers: offer,
			mentions: [
				{
					"@type": "Thing",
					name: parentTraitMentionName,
					url: toAbsoluteUrl(origin, parentTraitUrl),
				},
			],
		},
		{
			"@type": "EducationalOccupationalCredential",
			name: `${entry.title} explainer`,
			description: `Facet-level deep dive for ${entry.title.toLowerCase()}.`,
			credentialCategory: "Psychology explainer",
			url,
			offers: offer,
		},
	];
}
