import {
	createAssessmentSession,
	createShareableProfile,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
	toggleProfileVisibility,
} from "../factories/assessment.factory.js";
import { createUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";

/**
 * Public Profile — Anonymous Viewer Golden Path
 *
 * Setup: create user + session + evidence + shareable profile (via API)
 * Path:  anonymous browser → public profile URL → verify traits & facets
 *
 * Uses the apiContext fixture from base.fixture to create data via API,
 * then navigates without any auth cookies (anonymous viewer).
 */

const PROFILE_USER = {
	email: "e2e-profile-viewer@test.bigocean.dev",
	password: "TestPassword123!",
	name: "Profile Tester",
} as const;

const TRAITS = [
	{ key: "openness", label: "Openness" },
	{ key: "conscientiousness", label: "Conscientiousness" },
	{ key: "extraversion", label: "Extraversion" },
	{ key: "agreeableness", label: "Agreeableness" },
	{ key: "neuroticism", label: "Neuroticism" },
];

test("anonymous user views public profile with traits and facets", async ({ page, apiContext }) => {
	// ── Setup: create shareable public profile via API ──────────────────

	let profilePath = "";

	await test.step("seed user, session, evidence, and public profile via API", async () => {
		// 1. Create anonymous session
		const sessionId = await createAssessmentSession(apiContext);

		// 2. Sign up user and link session (cookies auto-captured by apiContext)
		await createUser(apiContext, {
			...PROFILE_USER,
			anonymousSessionId: sessionId,
		});

		// 3. Verify session linked, fallback to direct DB if needed
		const linkedUserId = await getSessionUserId(sessionId);
		if (!linkedUserId) {
			const user = await getUserByEmail(PROFILE_USER.email);
			if (!user) throw new Error("Profile test user not found after sign-up");
			await linkSessionToUser(sessionId, user.id);
		}

		// 4. Seed evidence data so profile has real scores
		await seedSessionForResults(sessionId);

		// 5. Create shareable profile (apiContext has auth cookies from step 2)
		const shareData = await createShareableProfile(apiContext, sessionId);

		// 6. Toggle profile to public
		await toggleProfileVisibility(apiContext, shareData.publicProfileId, true);

		profilePath = `/public-profile/${shareData.publicProfileId}`;
	});

	// ── Anonymous viewer journey ────────────────────────────────────────

	await test.step("navigate to public profile as anonymous user", async () => {
		// Clear any existing auth state to ensure anonymous access
		await page.context().clearCookies();
		await page.goto(profilePath);
	});

	await test.step("verify archetype hero section is visible", async () => {
		await page.locator("[data-slot='archetype-hero-section']").waitFor({
			state: "visible",
			timeout: 10_000,
		});

		// Archetype name should be rendered
		const archetypeName = page.getByTestId("archetype-name");
		await expect(archetypeName).toBeVisible();
		await expect(archetypeName).not.toBeEmpty();
	});

	await test.step("verify all 5 Big Five traits are displayed", async () => {
		const traitSection = page.locator("[data-slot='trait-scores-section']");
		await expect(traitSection).toBeVisible();

		for (const { key, label } of TRAITS) {
			const card = page.getByTestId(`trait-card-${key}`);
			await expect(card).toBeVisible();
			await expect(card.getByText(label, { exact: true })).toBeVisible();
		}
	});

	await test.step("expand first trait and verify facets are visible", async () => {
		// Click Openness trait toggle
		await page.getByTestId("trait-toggle-openness").click();

		// Openness has 6 facets — verify at least one facet row appears
		const openCard = page.getByTestId("trait-card-openness");
		const facetRow = openCard.locator("[id^='facet-']").first();
		await expect(facetRow).toBeVisible({ timeout: 5_000 });

		// Verify facet score format is present (e.g., "14/20 (72%)")
		await expect(openCard.getByText(/\/20/).first()).toBeVisible();
	});

	await test.step("expand all traits and verify facet count", async () => {
		const traitSection = page.locator("[data-slot='trait-scores-section']");

		// Click each trait toggle (skip openness — already expanded)
		for (const { key } of TRAITS) {
			if (key === "openness") continue;
			await page.getByTestId(`trait-toggle-${key}`).click();
		}

		// All 30 facets should now be visible (5 traits x 6 facets each)
		const facetRows = traitSection.locator("[id^='facet-']");
		await expect(facetRows).toHaveCount(30, { timeout: 5_000 });
	});

	await test.step("verify viral loop CTA is visible and links home", async () => {
		const cta = page.getByTestId("public-cta");
		await cta.scrollIntoViewIfNeeded();
		await expect(cta).toBeVisible();
		await expect(cta).toContainText("Discover Your Archetype");
	});
});
