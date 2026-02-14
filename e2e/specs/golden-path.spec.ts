import { expect, test } from "@playwright/test";

/**
 * Golden Path Journey
 *
 * Landing → Chat → Sign-up → Results → Share → Public Profile
 *
 * Single long user journey exercising the core happy path.
 * Uses data-testid and data-slot selectors — never matches on LLM output text.
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
		// Use full navigation so beforeLoad runs server-side (SSR) for session creation
		await page.goto("/chat");
		await page.waitForURL(/\/chat\?sessionId=/);
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

	await test.step("sign-up modal appears → fill and submit", async () => {
		const dialog = page.getByRole("dialog");
		await dialog.waitFor({ state: "visible" });

		await page.getByTestId("modal-signup-email").fill("e2e-golden@test.bigocean.dev");
		await page.getByTestId("modal-signup-password").fill("TestPassword123!");
		await page.getByTestId("modal-signup-submit").click();
	});

	await test.step("assert success message and modal closes", async () => {
		await page.getByTestId("modal-signup-success").waitFor({ state: "visible" });
		// Modal auto-closes after 1.5s delay
		await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 5_000 });
	});

	await test.step("wait for Nerin response to first message", async () => {
		// Response cycle complete when chat input is re-enabled
		const chatInput = page.locator("[data-slot='chat-input']");
		await expect(chatInput).toBeEnabled({ timeout: 30_000 });
	});

	await test.step("assert progress bar is visible and updating", async () => {
		const progressBar = page.getByTestId("progress-track");
		await expect(progressBar).toBeVisible();
		// With MESSAGE_READY_THRESHOLD=2, 1 user message = 50% progress
		await expect(progressBar).toHaveAttribute("aria-valuenow", "50");
	});

	await test.step("send a second message and wait for response", async () => {
		const chatInput = page.locator("[data-slot='chat-input']");
		await chatInput.fill("I tend to be very organized and plan everything in advance.");
		await page.getByTestId("chat-send-btn").click();

		// Wait for response cycle to complete
		await expect(chatInput).toBeEnabled({ timeout: 30_000 });
	});

	await test.step("celebration card appears → click View Results", async () => {
		// With MESSAGE_READY_THRESHOLD=2, the celebration card appears after 2 user messages
		await page.locator("[data-slot='celebration-card']").waitFor({
			state: "visible",
			timeout: 10_000,
		});
		await page.getByTestId("view-results-btn").click();
		await page.waitForURL(/\/results\//);
	});

	await test.step("assert archetype card is visible", async () => {
		await page.locator("[data-slot='archetype-hero-section']").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	await test.step("generate share link", async () => {
		const generateBtn = page.getByTestId("share-generate-btn");
		await generateBtn.scrollIntoViewIfNeeded();
		await generateBtn.click();
	});

	await test.step("assert share URL visible and copy works", async () => {
		await page.getByTestId("share-url").waitFor({ state: "visible" });
		await page.getByTestId("share-copy-btn").click();
	});

	await test.step("toggle privacy to public", async () => {
		await page.getByTestId("share-privacy-toggle").click();
		await expect(page.getByTestId("share-visibility-status")).toContainText("public", {
			timeout: 5_000,
		});
	});

	await test.step("navigate to public profile", async () => {
		const shareUrl = await page.getByTestId("share-url").textContent();
		expect(shareUrl).toBeTruthy();

		// Extract the path from the full URL
		const url = new URL(shareUrl as string);
		await page.goto(url.pathname);
	});

	await test.step("assert public profile elements", async () => {
		await page.getByTestId("public-archetype-name").waitFor({ state: "visible" });
		await page.getByTestId("public-cta").waitFor({ state: "visible" });
	});
});
