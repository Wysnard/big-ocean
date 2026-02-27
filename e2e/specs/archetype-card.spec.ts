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
 * Archetype Card & OG Image — E2E Tests
 *
 * Validates:
 * 1. Archetype share card component on the results page (preview, format toggle, download)
 * 2. OG image Nitro route returns valid PNGs for social media crawlers
 */

const CARD_USER = {
	email: "e2e-card-gen@test.bigocean.dev",
	password: "OceanDepth#Nerin42xQ",
	name: "Card Tester",
} as const;

/** PNG magic bytes: 0x89 P N G */
function expectPngBytes(body: Buffer) {
	expect(body[0]).toBe(0x89);
	expect(body[1]).toBe(0x50);
	expect(body[2]).toBe(0x4e);
	expect(body[3]).toBe(0x47);
}

test("archetype share card and OG image route", async ({ page, request, apiContext }) => {
	test.setTimeout(60_000);

	let sessionId = "";
	let profileId = "";

	await test.step("seed user, session, evidence, and public profile", async () => {
		sessionId = await createAssessmentSession(apiContext);

		await createUser(apiContext, {
			...CARD_USER,
			anonymousSessionId: sessionId,
		});

		const linkedUserId = await getSessionUserId(sessionId);
		if (!linkedUserId) {
			const user = await getUserByEmail(CARD_USER.email);
			if (!user) throw new Error("Card test user not found after sign-up");
			await linkSessionToUser(sessionId, user.id);
		}

		try {
			await seedSessionForResults(sessionId);
		} catch (err) {
			console.warn(
				`[archetype-card] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
			);
		}

		const shareData = await createShareableProfile(apiContext, sessionId);
		await toggleProfileVisibility(apiContext, shareData.publicProfileId, true);
		profileId = shareData.publicProfileId;
	});

	await test.step("transfer auth cookies to browser context", async () => {
		const storageState = await apiContext.storageState();
		await page.context().addCookies(storageState.cookies);
	});

	await test.step("navigate to results page", async () => {
		await page.goto(`/results/${sessionId}`);
		await page.locator("[data-slot='archetype-share-card']").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	await test.step("archetype card preview image loads (1:1 default)", async () => {
		const shareCard = page.locator("[data-slot='archetype-share-card']");
		const previewImg = shareCard.locator("img");

		await expect(previewImg).toBeVisible({ timeout: 15_000 });
		const src = await previewImg.getAttribute("src");
		expect(src).toContain("blob:");
	});

	await test.step("toggle to 9:16 format updates preview", async () => {
		const shareCard = page.locator("[data-slot='archetype-share-card']");

		await shareCard.getByText("9:16 Story").click();

		const previewImg = shareCard.locator("img");
		await expect(previewImg).toBeVisible({ timeout: 15_000 });
		const src = await previewImg.getAttribute("src");
		expect(src).toContain("blob:");
	});

	await test.step("download button triggers file download", async () => {
		const shareCard = page.locator("[data-slot='archetype-share-card']");

		const [download] = await Promise.all([
			page.waitForEvent("download", { timeout: 10_000 }),
			shareCard.getByRole("button", { name: "Download", exact: true }).click(),
		]);

		expect(download.suggestedFilename()).toMatch(/\.png$/);
	});

	// ── OG Image Nitro route tests ──────────────────────────────────────

	await test.step("GET /api/og/public-profile/:id returns PNG", async () => {
		const response = await request.get(`/api/og/public-profile/${profileId}`);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toBe("image/png");
		const body = await response.body();
		expect(body.length).toBeGreaterThan(500);
		expectPngBytes(body);
	});

	await test.step("GET /api/og/public-profile/:id returns 404 for unknown profile", async () => {
		const response = await request.get("/api/og/public-profile/nonexistent-profile-id");
		expect(response.status()).toBe(404);
	});

	await test.step("public profile page OG meta tags reference OG image URL", async () => {
		await page.goto(`/public-profile/${profileId}`);

		const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
		expect(ogImage).toContain(`/api/og/public-profile/${profileId}`);

		const twitterImage = await page
			.locator('meta[name="twitter:image"]')
			.first()
			.getAttribute("content");
		expect(twitterImage).toContain(`/api/og/public-profile/${profileId}`);
	});
});
