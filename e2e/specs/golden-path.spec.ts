import { expect, test } from "@playwright/test";
import pg from "pg";
import { TEST_DB_CONFIG } from "../e2e-env.js";
import { seedFullPortrait } from "../factories/assessment.factory.js";

const { Pool } = pg;

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

	const goldenEmail = `e2e-golden+${Date.now()}@gmail.com`;

	await test.step("auth gate appears inline → sign up", async () => {
		// Story 7.18: Auth gate is now inline in chat after farewell (not on results page)
		await page.getByTestId("chat-auth-gate-signup-btn").click();

		// Fill sign-up form
		await page.locator("#results-signup-email").fill(goldenEmail);
		await page.locator("#results-signup-password").fill("OceanDepth#Nerin42xQ");
		await page.getByTestId("auth-gate-signup-submit").click();
	});

	await test.step("verify email in DB, sign in via API, and reload chat (Story 31-7b bypass)", async () => {
		// With requireEmailVerification=true, signup doesn't auto-authenticate.
		// Bypass: verify email in DB, sign in via API to get cookies, then reload chat page.
		await page.waitForTimeout(1_000); // Let signup complete

		const pool = new Pool(TEST_DB_CONFIG);
		const client = await pool.connect();
		try {
			await client.query(`UPDATE "user" SET "email_verified" = true WHERE "email" = $1`, [
				goldenEmail,
			]);
		} finally {
			client.release();
			await pool.end();
		}

		// Sign in via API to establish auth cookies in the browser context
		const signInRes = await page.request.post("http://localhost:4001/api/auth/sign-in/email", {
			data: { email: goldenEmail, password: "OceanDepth#Nerin42xQ" },
		});
		if (!signInRes.ok()) {
			throw new Error(`Sign-in failed: ${await signInRes.text()}`);
		}

		// Reload chat page — now authenticated, TherapistChat shows "View Results"
		await page.goto(`/chat?sessionId=${sessionId}`);
	});

	await test.step("click View Results to navigate to results page", async () => {
		const viewResultsLink = page.getByRole("link", { name: "View Results" });
		await viewResultsLink.waitFor({ state: "visible", timeout: 15_000 });
		await viewResultsLink.click();
		await page.waitForURL(/\/results\//, { timeout: 15_000 });
	});

	await test.step("dismiss PWYW modal if present", async () => {
		const pwywModal = page.getByTestId("pwyw-modal");
		if (await pwywModal.isVisible({ timeout: 3_000 }).catch(() => false)) {
			await page.locator("[data-slot='dialog-close']").click();
			await pwywModal.waitFor({ state: "hidden", timeout: 3_000 });
		}
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
				// Dismiss PWYW modal again after reload
				const modal = page.getByTestId("pwyw-modal");
				if (await modal.isVisible({ timeout: 2_000 }).catch(() => false)) {
					await page.locator("[data-slot='dialog-close']").click();
					await modal.waitFor({ state: "hidden", timeout: 2_000 });
				}
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
		// The PWYW modal auto-opens on first results page visit for users without a portrait.
		// It may appear at any point during page rendering — wait for it and dismiss it.
		const pwyw = page.getByTestId("pwyw-modal");
		await pwyw.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
		if (await pwyw.isVisible()) {
			await page.locator("[data-slot='dialog-close']").click();
			await pwyw.waitFor({ state: "hidden", timeout: 5_000 });
		}

		// Portrait unlock CTA triggers PWYW modal for full portrait
		const portraitCta = page.getByTestId("portrait-unlock-cta");
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
		// Dismiss PWYW modal if it appears on revisit
		const pwywRevisit = page.getByTestId("pwyw-modal");
		await pwywRevisit.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
		if (await pwywRevisit.isVisible()) {
			await page.locator("[data-slot='dialog-close']").click();
			await pwywRevisit.waitFor({ state: "hidden", timeout: 5_000 });
		}
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
		await page.getByTestId("results-continue-chat").scrollIntoViewIfNeeded();
		await page.getByTestId("results-continue-chat").click();
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
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
		await page.goto(`/results/${sessionId}`);
		// Dismiss PWYW if it appears
		const pwywChat = page.getByTestId("pwyw-modal");
		await pwywChat.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
		if (await pwywChat.isVisible()) {
			await page.locator("[data-slot='dialog-close']").click();
			await pwywChat.waitFor({ state: "hidden", timeout: 5_000 });
		}
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
