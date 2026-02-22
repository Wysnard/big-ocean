import { expect, test } from "@playwright/test";

/**
 * Golden Path Journey
 *
 * Landing → Chat → Farewell → Auth Gate Sign-up → Wait Screen → Portrait → Full Results → Share → Public Profile
 *
 * Single long user journey exercising the core happy path.
 * Uses data-testid and data-slot selectors — never matches on LLM output text.
 *
 * Story 7.18: Updated flow — farewell replaces celebration card, auth gate is inline in chat,
 * wait screen leads to portrait-first reading view before full results.
 */
test("golden path: landing → chat → signup → results → share → public profile", async ({
	page,
}) => {
	await test.step("navigate to landing page and verify CTA exists", async () => {
		await page.goto("/");
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
		await expect(page.getByTestId("hero-cta")).toBeVisible();
	});

	await test.step("navigate to /chat and create session", async () => {
		// beforeLoad throws a redirect after creating the session (SSR),
		// which aborts the initial navigation — ignore the abort and wait for the final URL.
		await page.goto("/chat").catch(() => {});
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15_000 });
	});

	const sessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
	expect(sessionId).toBeTruthy();

	await test.step("assert Nerin greeting is visible", async () => {
		// Wait for at least one chat bubble (the greeting) to appear
		await page.locator("[data-slot='chat-bubble']").first().waitFor({ state: "visible" });
	});

	await test.step("type a message and click send", async () => {
		const chatInput = page.locator("[data-slot='chat-input']");
		await chatInput.waitFor({ state: "visible" });
		await chatInput.fill("I love exploring new ideas and creative projects.");
		await page.getByTestId("chat-send-btn").click();
	});

	await test.step("wait for Nerin response to first message", async () => {
		// Response cycle complete when chat input is re-enabled
		const chatInput = page.locator("[data-slot='chat-input']");
		await expect(chatInput).toBeEnabled({ timeout: 30_000 });
	});

	await test.step("assert depth meter is visible", async () => {
		const depthMeter = page.locator("[data-slot='depth-meter']");
		await expect(depthMeter).toBeVisible();
	});

	await test.step("send second message — triggers farewell", async () => {
		const chatInput = page.locator("[data-slot='chat-input']");
		await chatInput.fill("I tend to be very organized and plan everything in advance.");
		await page.getByTestId("chat-send-btn").click();

		// Story 7.18: With FREE_TIER_MESSAGE_THRESHOLD=2, the 2nd message triggers farewell.
		// Wait for the auth gate to appear (anonymous user) — farewell + auth gate render together.
		await page.locator("[data-slot='chat-auth-gate']").waitFor({
			state: "visible",
			timeout: 30_000,
		});
	});

	await test.step("auth gate appears inline → sign up", async () => {
		// Story 7.18: Auth gate is now inline in chat after farewell (not on results page)
		await page.getByTestId("chat-auth-gate-signup-btn").click();

		// Fill sign-up form
		await page.locator("#results-signup-email").fill("e2e-golden@test.bigocean.dev");
		await page.locator("#results-signup-password").fill("TestPassword123!");
		await page.getByTestId("auth-gate-signup-submit").click();
	});

	await test.step("wait screen appears → click Read what Nerin wrote", async () => {
		// Story 7.18: After auth, wait screen appears with rotating Nerin-voiced lines
		await page.locator("[data-slot='portrait-wait-screen']").waitFor({
			state: "visible",
			timeout: 15_000,
		});

		// Wait for portrait to be ready (min wait + API)
		await page.getByTestId("read-portrait-btn").waitFor({
			state: "visible",
			timeout: 30_000,
		});
		await page.getByTestId("read-portrait-btn").click();
	});

	await test.step("portrait reading view → navigate to full results", async () => {
		// Story 7.18: Portrait-first reading view
		await page.locator("[data-slot='portrait-reading-view']").waitFor({
			state: "visible",
			timeout: 15_000,
		});

		// Click "See your full personality profile →"
		await page.getByTestId("view-full-profile-btn").click();
		await page.waitForURL(/\/results\/[^?]+$/);
	});

	await test.step("assert archetype card is visible", async () => {
		await page.locator("[data-slot='archetype-hero-section']").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	await test.step("wait for auto-generated share link", async () => {
		// Share link is auto-generated when results load — wait for the URL to appear
		const shareUrl = page.getByTestId("share-url");
		await shareUrl.scrollIntoViewIfNeeded();
		await expect(shareUrl).toBeVisible({ timeout: 10_000 });
	});

	await test.step("toggle privacy to public", async () => {
		await page.getByTestId("share-privacy-toggle").click();
		await expect(page.getByTestId("share-visibility-status")).toContainText("Public", {
			timeout: 5_000,
		});
	});

	await test.step("copy share link and verify clipboard", async () => {
		await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
		const shareUrl = await page.getByTestId("share-url").textContent();
		await page.getByTestId("share-copy-btn").click();
		const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboardText).toBe(shareUrl);
	});

	await test.step("navigate to public profile", async () => {
		const shareUrl = await page.getByTestId("share-url").textContent();
		expect(shareUrl).toBeTruthy();

		// Extract the path from the full URL
		const url = new URL(shareUrl as string);
		await page.goto(url.pathname);
	});

	await test.step("assert public profile elements", async () => {
		await page.getByTestId("archetype-name").waitFor({ state: "visible" });
		await page.getByTestId("public-cta").waitFor({ state: "visible" });
	});
});
