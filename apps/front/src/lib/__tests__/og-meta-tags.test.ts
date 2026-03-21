import { describe, expect, it } from "vitest";
import { generateOgMetaTags } from "../og-meta-tags";

describe("generateOgMetaTags", () => {
	const defaultOrigin = "https://bigocean.dev";
	const defaultProfileId = "test-profile-123";

	const mockProfile = {
		archetypeName: "The Beacon",
		description: "A visionary leader who illuminates paths for others.",
	};

	describe("when profile exists", () => {
		it("og:title contains archetype name", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogTitle = meta.find((m) => "property" in m && m.property === "og:title");
			expect(ogTitle).toBeDefined();
			expect(ogTitle?.content).toContain("The Beacon");
		});

		it("og:description contains archetype description", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogDesc = meta.find((m) => "property" in m && m.property === "og:description");
			expect(ogDesc).toBeDefined();
			expect(ogDesc?.content).toContain("A visionary leader");
		});

		it("og:image points to /api/og/public-profile/{id}", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogImage = meta.find((m) => "property" in m && m.property === "og:image");
			expect(ogImage).toBeDefined();
			expect(ogImage?.content).toBe(`${defaultOrigin}/api/og/public-profile/${defaultProfileId}`);
		});

		it("og:image:alt contains archetype name for accessibility", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogImageAlt = meta.find((m) => "property" in m && m.property === "og:image:alt");
			expect(ogImageAlt).toBeDefined();
			expect(ogImageAlt?.content).toContain("The Beacon");
		});

		it("og:image:width is 1200 and og:image:height is 630", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogWidth = meta.find((m) => "property" in m && m.property === "og:image:width");
			const ogHeight = meta.find((m) => "property" in m && m.property === "og:image:height");
			expect(ogWidth?.content).toBe("1200");
			expect(ogHeight?.content).toBe("630");
		});

		it("twitter:card is summary_large_image", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const twitterCard = meta.find((m) => "name" in m && m.name === "twitter:card");
			expect(twitterCard).toBeDefined();
			expect(twitterCard?.content).toBe("summary_large_image");
		});

		it("includes canonical URL in og:url", () => {
			const meta = generateOgMetaTags({
				profile: mockProfile,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogUrl = meta.find((m) => "property" in m && m.property === "og:url");
			expect(ogUrl).toBeDefined();
			expect(ogUrl?.content).toBe(`${defaultOrigin}/public-profile/${defaultProfileId}`);
		});
	});

	describe("when profile is null (fallback)", () => {
		it("uses fallback title and description", () => {
			const meta = generateOgMetaTags({
				profile: null,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const titleMeta = meta.find((m) => "title" in m);
			expect(titleMeta).toBeDefined();
			expect((titleMeta as { title: string }).title).toBe("Personality Profile | big-ocean");

			const ogDesc = meta.find((m) => "property" in m && m.property === "og:description");
			expect(ogDesc?.content).toBe("Discover your personality archetype with big-ocean.");
		});

		it("og:image:alt uses fallback text when profile is null", () => {
			const meta = generateOgMetaTags({
				profile: null,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogImageAlt = meta.find((m) => "property" in m && m.property === "og:image:alt");
			expect(ogImageAlt).toBeDefined();
			expect(ogImageAlt?.content).toBe("Personality archetype card — big-ocean");
		});

		it("still includes og:image pointing to generation endpoint", () => {
			const meta = generateOgMetaTags({
				profile: null,
				publicProfileId: defaultProfileId,
				origin: defaultOrigin,
			});

			const ogImage = meta.find((m) => "property" in m && m.property === "og:image");
			expect(ogImage).toBeDefined();
			expect(ogImage?.content).toContain("/api/og/public-profile/");
		});
	});
});
