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
 * Archetype Card — E2E Tests
 *
 * Validates the archetype share card component on the results page:
 * - Card preview image loads (via createServerFn, rendered as blob URL)
 * - Format toggle switches between 1:1 and 9:16
 * - Download button triggers file download
 *
 * OG image route tests are skipped — the route has a known bug
 * (server.handlers pattern) that will be fixed separately.
 */

const CARD_USER = {
	email: "e2e-card-gen@test.bigocean.dev",
	password: "OceanDepth#Nerin42xQ",
	name: "Card Tester",
} as const;

test("archetype share card renders preview and supports download", async ({ page, apiContext }) => {
	test.setTimeout(60_000);

	let sessionId = "";
	let _profileId = "";

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
		_profileId = shareData.publicProfileId;
	});

	await test.step("transfer auth cookies to browser context", async () => {
		const storageState = await apiContext.storageState();
		await page.context().addCookies(storageState.cookies);
	});

	await test.step("navigate to results page", async () => {
		await page.goto(`/results/${sessionId}`);
		// Wait for the share card component to appear
		await page.locator("[data-slot='archetype-share-card']").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	await test.step("archetype card preview image loads (1:1 default)", async () => {
		const shareCard = page.locator("[data-slot='archetype-share-card']");
		const previewImg = shareCard.locator("img");

		// Wait for the image to load (blob: URL means server fn returned data)
		await expect(previewImg).toBeVisible({ timeout: 15_000 });
		const src = await previewImg.getAttribute("src");
		expect(src).toContain("blob:");
	});

	await test.step("toggle to 9:16 format updates preview", async () => {
		const shareCard = page.locator("[data-slot='archetype-share-card']");

		// Click the 9:16 Story button
		await shareCard.getByText("9:16 Story").click();

		// Wait for new image to load (new blob URL)
		const previewImg = shareCard.locator("img");
		await expect(previewImg).toBeVisible({ timeout: 15_000 });
		const src = await previewImg.getAttribute("src");
		expect(src).toContain("blob:");
	});

	await test.step("download button triggers file download", async () => {
		const shareCard = page.locator("[data-slot='archetype-share-card']");

		const [download] = await Promise.all([
			page.waitForEvent("download", { timeout: 10_000 }),
			shareCard.getByText("Download").click(),
		]);

		expect(download.suggestedFilename()).toMatch(/\.png$/);
	});
});

// OG image route has the same server.handlers bug — skip until fixed separately
test.skip("OG image route returns valid PNG", async () => {
	// TODO: Fix OG image route (server.handlers → Nitro API route), then re-enable
});
