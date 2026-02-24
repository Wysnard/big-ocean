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
	password: "OceanDepth#Nerin42xQ",
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
		// Non-fatal: facet_evidence table may not exist in Phase 2 schema (Epic 10+)
		try {
			await seedSessionForResults(sessionId);
		} catch (err) {
			console.warn(
				`[public-profile] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
			);
		}

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
		const traitStrata = page.locator("[data-slot='trait-strata']");
		await expect(traitStrata).toBeVisible();

		for (const { key, label } of TRAITS) {
			const band = page.locator(`[data-slot='trait-band'][data-trait='${key}']`);
			await expect(band).toBeVisible();
			await expect(band.getByText(label, { exact: true })).toBeVisible();
		}
	});

	await test.step("verify trait bands show facet scores inline", async () => {
		// The TraitBand component shows all 6 facets inline via FacetScoreBar.
		// Verify the Openness band has facet names visible.
		const openBand = page.locator("[data-slot='trait-band'][data-trait='openness']");
		await expect(openBand.getByText("Imagination")).toBeVisible();
		await expect(openBand.getByText("Artistic Interests")).toBeVisible();
	});

	await test.step("verify viral loop CTA is visible", async () => {
		const cta = page.getByTestId("public-profile-cta");
		await cta.scrollIntoViewIfNeeded();
		await expect(cta).toBeVisible();
		await expect(cta).toContainText("Discover Your Personality");
	});
});
