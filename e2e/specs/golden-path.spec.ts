import { expect, test } from "@playwright/test";
import { seedFullPortrait } from "../factories/assessment.factory.js";

/**
 * Golden Path Journey
 *
 * Landing → Chat → Farewell → Auth Gate Sign-up → Finalization Wait Screen → Results → Share → Public Profile → Continue Chat (read-only) → View Results → Profile
 *
 * Single long user journey exercising the core happy path.
 * Uses data-testid and data-slot selectors — never matches on LLM output text.
 *
 * Story 11.1: After auth gate signup, redirects to /finalize/$sessionId wait screen
 * which triggers generate-results and auto-redirects to results on completion.
 */
test("golden path: landing → chat → signup → results → share → public profile → continue chat → profile", async ({
	page,
}) => {
	test.setTimeout(90_000); // Long journey — multiple API calls, auth, navigation
	await test.step("navigate to landing page and verify CTA exists", async () => {
		await page.goto("/");
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
		await expect(page.getByTestId("hero-cta")).toBeVisible();
	});

	await test.step("navigate to /chat and create session", async () => {
		// beforeLoad creates a session via API then redirects to /chat?sessionId=...
		// The SSR redirect may abort the initial navigation — retry if needed.
		for (let attempt = 0; attempt < 3; attempt++) {
			await page.goto("/chat").catch(() => {});
			try {
				await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
				break;
			} catch {
				if (attempt === 2) throw new Error("Failed to navigate to /chat?sessionId= after 3 attempts");
				// Retry — SSR beforeLoad may have failed transiently
				await page.waitForTimeout(1_000);
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

		// With MESSAGE_THRESHOLD=1, the 1st user message triggers farewell.
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
		await page.locator("#results-signup-email").fill(`e2e-golden+${Date.now()}@gmail.com`);
		await page.locator("#results-signup-password").fill("OceanDepth#Nerin42xQ");
		await page.getByTestId("auth-gate-signup-submit").click();
	});

	await test.step("click View Results to navigate to results page", async () => {
		const viewResultsLink = page.getByRole("link", { name: "View Results" });
		await viewResultsLink.waitFor({ state: "visible", timeout: 15_000 });
		await viewResultsLink.click();
		await page.waitForURL(/\/results\//, { timeout: 15_000 });
	});

	await test.step("assert archetype card is visible", async () => {
		// Lazy finalization may still be in progress — retry with reload if needed
		for (let attempt = 0; attempt < 3; attempt++) {
			const hero = page.getByTestId("archetype-hero-section");
			const visible = await hero.isVisible().catch(() => false);
			if (visible) break;

			if (attempt < 2) {
				await page.waitForTimeout(2_000);
				await page.reload();
				await page.waitForLoadState("networkidle");
			} else {
				await hero.waitFor({ state: "visible", timeout: 15_000 });
			}
		}
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

	await test.step("assert Polar checkout button is present", async () => {
		// Portrait unlock CTA triggers Polar checkout for full portrait
		const portraitCta = page.getByTestId("reveal-portrait-cta");
		await portraitCta.scrollIntoViewIfNeeded();
		await expect(portraitCta).toBeVisible();
	});

	await test.step("seed full portrait and verify it renders", async () => {
		// Simulate full portrait generation by seeding directly in the DB
		// (bypasses Polar checkout → webhook → LLM pipeline)
		await seedFullPortrait(sessionId);
		await page.reload();
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});

		// PersonalPortrait component should render
		const portrait = page.locator("[data-slot='personal-portrait']");
		await portrait.scrollIntoViewIfNeeded();
		await expect(portrait).toBeVisible();
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

	await test.step("navigate back to results and click Continue Chat", async () => {
		await page.goto(`/results/${sessionId}`);
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
		await page.getByTestId("results-continue-chat").scrollIntoViewIfNeeded();
		await page.getByTestId("results-continue-chat").click();
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
	});

	await test.step("chat page shows read-only conversation with View Results link", async () => {
		// Conversation messages are visible
		await page.locator("[data-slot='chat-bubble']").first().waitFor({ state: "visible" });

		// Input bar is NOT visible (replaced by View Results link for completed sessions)
		await expect(page.locator("[data-slot='chat-input']")).not.toBeVisible();

		// View Results link is visible
		const viewResultsLink = page.getByRole("link", { name: "View Results" });
		await expect(viewResultsLink).toBeVisible();

		// Click View Results to navigate back to results
		await viewResultsLink.click();
		await page.waitForURL(/\/results\//, { timeout: 10_000 });
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	await test.step("profile page shows completed assessment card", async () => {
		// Use client-side navigation via user nav dropdown (avoids auth race on cold page.goto)
		const avatarButton = page.locator("[data-slot='user-nav'] button.rounded-full");
		await avatarButton.waitFor({ state: "visible", timeout: 10_000 });
		await avatarButton.click();
		await page.getByRole("menuitem", { name: "Profile" }).click();
		await page.waitForURL(/\/profile\/?$/);
		await page.locator("[data-slot='assessment-card']").waitFor({
			state: "visible",
			timeout: 10_000,
		});
		await expect(
			page.locator("[data-slot='assessment-card'][data-status='completed']"),
		).toBeVisible();
		await expect(page.locator("[data-slot='status-badge']")).toContainText("Complete");
	});
});
