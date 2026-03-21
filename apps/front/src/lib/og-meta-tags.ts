/**
 * OG Meta Tag Generation — Story 33-2
 *
 * Pure function that generates Open Graph and Twitter Card meta tags
 * for public profile pages. Extracted from the route's head() function
 * for testability.
 *
 * Returns an array of meta tag objects compatible with TanStack Router's
 * head() API format.
 */

const FALLBACK_TITLE = "Personality Profile | big-ocean";
const FALLBACK_DESCRIPTION = "Discover your personality archetype with big-ocean.";

export type OgProfileData = {
	archetypeName: string;
	description: string;
};

export type OgMetaTagInput = {
	profile: OgProfileData | null;
	publicProfileId: string;
	origin: string;
};

type MetaTitle = { title: string };
type MetaName = { name: string; content: string };
type MetaProperty = { property: string; content: string };
export type MetaTag = MetaTitle | MetaName | MetaProperty;

export function generateOgMetaTags({
	profile,
	publicProfileId,
	origin,
}: OgMetaTagInput): MetaTag[] {
	const title = profile ? `${profile.archetypeName} | big-ocean` : FALLBACK_TITLE;
	const description = profile?.description || FALLBACK_DESCRIPTION;
	const canonicalUrl = `${origin}/public-profile/${publicProfileId}`;
	const ogImageUrl = `${origin}/api/og/public-profile/${publicProfileId}`;
	const ogImageAlt = profile
		? `${profile.archetypeName} personality archetype card — big-ocean`
		: "Personality archetype card — big-ocean";

	return [
		{ title },
		{ name: "description", content: description },
		{ property: "og:title", content: title },
		{ property: "og:description", content: description },
		{ property: "og:url", content: canonicalUrl },
		{ property: "og:type", content: "profile" },
		{ property: "og:site_name", content: "big-ocean" },
		{ property: "og:image", content: ogImageUrl },
		{ property: "og:image:width", content: "1200" },
		{ property: "og:image:height", content: "630" },
		{ property: "og:image:alt", content: ogImageAlt },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: ogImageUrl },
	];
}
