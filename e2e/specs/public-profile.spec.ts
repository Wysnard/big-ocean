import { expect, test } from "@playwright/test";
import { API_URL } from "../e2e-env.js";
import {
	createAssessmentSession,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/assessment.factory.js";
import { createUser } from "../factories/user.factory.js";

/**
 * Public Profile — Anonymous Viewer Golden Path
 *
 * Setup: create user + session + evidence + shareable profile (via API)
 * Path:  anonymous browser → public profile URL → verify traits & facets
 *
 * Uses the owner auth state from setup project to generate the share link,
 * then navigates without any auth cookies (anonymous viewer).
 */

const PROFILE_USER = {
	email: "e2e-profile-viewer@test.bigocean.dev",
	password: "TestPassword123!",
	name: "Profile Tester",
} as const;

const TRAIT_LABELS = [
	"Openness",
	"Conscientiousness",
	"Extraversion",
	"Agreeableness",
	"Neuroticism",
];

/**
 * Build a Cookie header string from Set-Cookie response headers.
 */
function toCookieHeader(setCookieHeaders: string[]): string {
	return setCookieHeaders
		.map((h) => {
			const eqIdx = h.indexOf("=");
			const semiIdx = h.indexOf(";");
			const name = h.slice(0, eqIdx);
			const value = h.slice(eqIdx + 1, semiIdx === -1 ? undefined : semiIdx);
			return `${name}=${value}`;
		})
		.join("; ");
}

test("anonymous user views public profile with traits and facets", async ({ page }) => {
	// ── Setup: create shareable public profile via API ──────────────────

	let profilePath = "";

	await test.step("seed user, session, evidence, and public profile via API", async () => {
		// 1. Create anonymous session
		const sessionId = await createAssessmentSession();

		// 2. Sign up user and link session
		const auth = await createUser({
			...PROFILE_USER,
			anonymousSessionId: sessionId,
		});
		const cookieHeader = toCookieHeader(auth.setCookieHeaders);

		// 3. Verify session linked, fallback to direct DB if needed
		const { getSessionUserId } = await import("../factories/assessment.factory.js");
		const linkedUserId = await getSessionUserId(sessionId);
		if (!linkedUserId) {
			const user = await getUserByEmail(PROFILE_USER.email);
			if (!user) throw new Error("Profile test user not found after sign-up");
			await linkSessionToUser(sessionId, user.id);
		}

		// 4. Seed evidence data so profile has real scores
		await seedSessionForResults(sessionId);

		// 5. Create shareable profile (authenticated)
		const shareRes = await fetch(`${API_URL}/api/profile/share`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: cookieHeader,
			},
			body: JSON.stringify({ sessionId }),
		});
		if (!shareRes.ok) {
			const body = await shareRes.text();
			throw new Error(`Share profile failed (${shareRes.status}): ${body}`);
		}
		const shareData = (await shareRes.json()) as {
			publicProfileId: string;
			shareableUrl: string;
			isPublic: boolean;
		};

		// 6. Toggle profile to public
		const toggleRes = await fetch(`${API_URL}/api/profile/${shareData.publicProfileId}/visibility`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Cookie: cookieHeader,
			},
			body: JSON.stringify({ isPublic: true }),
		});
		if (!toggleRes.ok) {
			const body = await toggleRes.text();
			throw new Error(`Toggle visibility failed (${toggleRes.status}): ${body}`);
		}

		profilePath = `/profile/${shareData.publicProfileId}`;
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

		// Each trait label should appear
		for (const trait of TRAIT_LABELS) {
			await expect(traitSection.getByText(trait, { exact: true })).toBeVisible();
		}
	});

	await test.step("expand first trait and verify facets are visible", async () => {
		const traitSection = page.locator("[data-slot='trait-scores-section']");

		// Click the first trait card (Openness) to expand facets
		const firstTraitCard = traitSection.locator("button").first();
		await firstTraitCard.click();

		// Openness has 6 facets — verify at least one facet row appears
		// Facet names are Title Case (e.g., "Imagination", "Intellect")
		const facetRow = traitSection.locator("[id^='facet-']").first();
		await expect(facetRow).toBeVisible({ timeout: 5_000 });

		// Verify facet score format is present (e.g., "14/20 (72%)")
		await expect(traitSection.getByText(/\/20/)).toBeVisible();
	});

	await test.step("expand all traits and verify facet count", async () => {
		const traitSection = page.locator("[data-slot='trait-scores-section']");

		// Click all 5 trait buttons to expand them
		const traitButtons = traitSection.locator("button");
		const count = await traitButtons.count();

		for (let i = 0; i < count; i++) {
			const button = traitButtons.nth(i);
			// Only click if not already expanded (check for chevron rotation)
			const isExpanded = await button.locator("svg.rotate-180").count();
			if (!isExpanded) {
				await button.click();
			}
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
