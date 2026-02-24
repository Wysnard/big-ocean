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
 * Archetype Card & OG Image Generation — E2E Tests
 *
 * Validates that the frontend-hosted image generation routes return valid PNGs.
 * Routes:
 *   GET /api/archetype-card/:publicProfileId?format=9:16|1:1
 *   GET /api/og/public-profile/:publicProfileId
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

test("archetype card and OG image routes return valid PNGs", async ({
	page,
	request,
	apiContext,
}) => {
	let profileId = "";

	await test.step("seed user, session, evidence, and public profile", async () => {
		const sessionId = await createAssessmentSession(apiContext);

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

	await test.step("GET /api/archetype-card/:id?format=9:16 returns PNG", async () => {
		const response = await request.get(`/api/archetype-card/${profileId}?format=9:16`);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toBe("image/png");
		const body = await response.body();
		expect(body.length).toBeGreaterThan(1000);
		expectPngBytes(body);
	});

	await test.step("GET /api/archetype-card/:id?format=1:1 returns PNG", async () => {
		const response = await request.get(`/api/archetype-card/${profileId}?format=1:1`);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toBe("image/png");
		const body = await response.body();
		expect(body.length).toBeGreaterThan(1000);
		expectPngBytes(body);
	});

	await test.step("GET /api/archetype-card/:id defaults to 9:16", async () => {
		const response = await request.get(`/api/archetype-card/${profileId}`);
		expect(response.status()).toBe(200);
		expect(response.headers()["content-type"]).toBe("image/png");
	});

	await test.step("GET /api/archetype-card/:id returns 404 for unknown profile", async () => {
		const response = await request.get("/api/archetype-card/nonexistent-profile-id");
		expect(response.status()).toBe(404);
	});

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

	await test.step("public profile page OG meta tags reference same-origin image URL", async () => {
		await page.goto(`/public-profile/${profileId}`);

		const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
		expect(ogImage).toContain(`/api/og/public-profile/${profileId}`);

		const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute("content");
		expect(twitterImage).toContain(`/api/og/public-profile/${profileId}`);
	});
});
