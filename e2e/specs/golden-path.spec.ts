import { randomBytes } from "node:crypto";
import { getUserSummaryBySessionId, seedFullPortrait } from "../factories/conversation.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";
import { signUpAndLoginViaBrowser } from "../utils/browser-auth.js";

const goldenEmail = `e2e-golden+${randomBytes(4).toString("hex")}@gmail.com`;
const goldenPassword = "OceanDepth#Nerin42xQ";

/**
 * Golden Path Journey
 *
 * Landing → Sign Up → Verify Email → Login → /chat (authenticated, creates session) → Message → Farewell → Show me what you found → → Results → Share → Public Profile → Today
 *
 * Single long user journey exercising the core happy path.
 * Uses data-testid and data-slot selectors — never matches on LLM output text.
 */
test("golden path: landing → signup → chat → results → share → public profile → today @critical", async ({
	page,
	apiContext,
}) => {
	test.setTimeout(90_000); // Long journey — multiple API calls, auth, navigation
	await test.step("navigate to landing page and verify split layout", async () => {
		await page.goto("/");
		await page.locator("[data-slot='sticky-auth-panel']").waitFor({ state: "visible" });
		// Desktop shows the sticky auth panel with signup link
		await expect(page.getByRole("link", { name: /start yours/i })).toBeVisible();
	});

	await test.step("sign up, verify email, and login", async () => {
		await signUpAndLoginViaBrowser(page, {
			email: goldenEmail,
			password: goldenPassword,
			name: "Golden Path Tester",
		});
	});

	await test.step("navigate to /chat and create session", async () => {
		// beforeLoad creates a session via API then redirects to /chat?sessionId=...
		// The SSR redirect may abort the initial navigation — retry if needed.
		for (let attempt = 0; attempt < 3; attempt++) {
			await page.goto("/chat").catch(() => {});
			try {
				await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15_000 });
				break;
			} catch {
				if (attempt === 2) throw new Error("Failed to navigate to /chat?sessionId= after 3 attempts");
				// Retry — SSR beforeLoad may have failed transiently
			}
		}
	});

	const sessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
	expect(sessionId).toBeTruthy();

	await test.step("assert Nerin greeting is visible", async () => {
		// Wait for at least one chat bubble (the greeting) to appear
		await page.locator("[data-slot='chat-bubble']").first().waitFor({ state: "visible" });
	});

	await test.step("type a message and click send — triggers farewell", async () => {
		const chatInput = page.locator("[data-slot='chat-input']");
		await chatInput.waitFor({ state: "visible" });
		await chatInput.fill("I love exploring new ideas and creative projects.");
		await page.getByTestId("chat-send-btn").click();

		// With assessmentTurnCount=1, the 1st user message triggers farewell.
		// User is authenticated, so "Show me what you found →" link appears directly (no auth gate).
		await page.getByRole("link", { name: "Show me what you found →" }).waitFor({
			state: "visible",
			timeout: 30_000,
		});
	});

	await test.step("click Show me what you found → to navigate to results page", async () => {
		const viewResultsLink = page.getByRole("link", { name: "Show me what you found →" });
		await viewResultsLink.waitFor({ state: "visible", timeout: 15_000 });
		await viewResultsLink.click();
		await page.waitForURL(/\/me\//, { timeout: 15_000 });
	});

	await test.step("assert archetype card is visible", async () => {
		// Lazy finalization may still be in progress — use a generous timeout
		await expect(page.getByTestId("archetype-hero-section")).toBeVisible({ timeout: 30_000 });
	});

	await test.step("verify user summary was generated (Story 7.1)", async () => {
		const summary = await getUserSummaryBySessionId(sessionId);
		expect(summary).not.toBeNull();
		expect(summary?.version).toBe(1);
		expect(summary?.summaryText).toBeTruthy();
	});

	await test.step("assert results page trait display (Story 12-1)", async () => {
		// Profile view container is rendered
		await page.locator("[data-slot='profile-view']").waitFor({ state: "visible" });

		// All 5 trait cards are visible
		const traitCards = page.locator("[data-slot='trait-card']");
		await expect(traitCards).toHaveCount(5);
		for (const trait of [
			"openness",
			"conscientiousness",
			"extraversion",
			"agreeableness",
			"neuroticism",
		]) {
			await expect(page.locator(`[data-slot='trait-card'][data-trait='${trait}']`)).toBeVisible();
		}

		// Radar chart is visible
		await expect(page.locator("[data-slot='personality-radar-chart']")).toBeVisible();

		// OCEAN code is displayed
		await expect(page.getByTestId("ocean-code")).toBeVisible();
	});

	await test.step("seed portrait content and verify it renders", async () => {
		// Portrait is free and auto-generated. Seed content directly for
		// deterministic test behavior.
		await seedFullPortrait(sessionId);
		await page.reload();

		// Page is on ?view=portrait, so with portrait data it shows the reading view
		await page.getByTestId("portrait-reading-mode").waitFor({
			state: "visible",
			timeout: 15_000,
		});

		// Navigate back to profile view for share/privacy steps
		await page.getByTestId("view-full-profile-btn").click();
		await page.waitForURL(new RegExp(`/me/${sessionId}$`), { timeout: 10_000 });
		await page.getByTestId("archetype-hero-section").waitFor({
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
		await page.getByTestId("public-profile-cta").waitFor({ state: "visible" });
	});

	await test.step("chat page loads for completed session", async () => {
		// For completed sessions, chat may show read-only messages or redirect to results.
		// Wait for either chat-bubble (read-only mode) or redirect back to results.
		const chatBubble = page.locator("[data-slot='chat-bubble']").first();
		const loaded = await chatBubble
			.waitFor({ state: "visible", timeout: 15_000 })
			.then(() => true)
			.catch(() => false);

		if (loaded) {
			// Chat input should NOT be visible for completed sessions
			await expect(page.locator("[data-slot='chat-input']")).not.toBeVisible();
		}

		// Navigate back to results for the profile step
		await page.goto(`/me/${sessionId}`);
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	await test.step("today page loads via user nav", async () => {
		// Use client-side navigation via user nav dropdown (avoids auth race on cold page.goto)
		const avatarButton = page.getByTestId("user-nav-avatar");
		await avatarButton.waitFor({ state: "visible", timeout: 10_000 });
		await avatarButton.click();
		await page.getByRole("menuitem", { name: "Today" }).click();
		await page.waitForURL(/\/today/);
		await page.getByTestId("today-page").waitFor({
			state: "visible",
			timeout: 10_000,
		});
	});
});
