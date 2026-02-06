import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Story 4.2: Assessment Conversation Component
 *
 * Tests the full chat flow against the Dockerized API with MOCK_LLM=true.
 * Mock Nerin returns keyword-based pattern responses and precision scores.
 *
 * Requires: `pnpm docker:test:up` or runs automatically via globalSetup.
 */

test.describe("Assessment Conversation", () => {
	test("should load chat page with Nerin greeting and real session ID", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });

		// The route's beforeLoad calls POST /api/assessment/start and redirects with ?sessionId=
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });

		// Nerin's initial greeting should be visible
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		// Session ID in header should be a real server-generated ID (not client-side pattern)
		const sessionCode = page.locator("code").first();
		await expect(sessionCode).toBeVisible();
		const sessionId = await sessionCode.textContent();
		expect(sessionId).toBeTruthy();
		// Server-generated session IDs won't match the old client pattern `session_<timestamp>_<random>`
		expect(sessionId).not.toMatch(/^session_\d+_/);
	});

	test("should send message and receive Nerin response", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		// Type and send a message
		const input = page.getByPlaceholder(/type your response here/i);
		await expect(input).toBeVisible({ timeout: 5000 });
		await input.fill("I love exploring new creative ideas and imagining possibilities");
		await input.press("Enter");

		// User message should appear immediately (optimistic update)
		await expect(page.getByText(/I love exploring new creative ideas/i)).toBeVisible({ timeout: 3000 });

		// Typing indicator should appear while waiting for response
		// (bouncing dots are rendered as span elements with animate-bounce)

		// Wait for Nerin's response — mock returns openness-themed response for "creative"/"imagining"
		await expect(page.getByText(/creative perspective|think about things differently/i)).toBeVisible({
			timeout: 30000,
		});
	});

	test("should update trait precision scores after message exchange", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		// Send a message to trigger score update
		const input = page.getByPlaceholder(/type your response here/i);
		await input.fill("I enjoy organizing my tasks and planning ahead");
		await input.press("Enter");

		// Wait for response
		await expect(page.getByText(/structured approach|value having a plan/i)).toBeVisible({ timeout: 30000 });

		// Trait labels should be visible in sidebar (desktop) or floating button (mobile)
		await expect(page.getByText("Openness")).toBeVisible({ timeout: 5000 });
		await expect(page.getByText("Conscientiousness")).toBeVisible({ timeout: 5000 });
	});

	test("should support multiple message exchanges", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		const input = page.getByPlaceholder(/type your response here/i);

		// First message
		await input.fill("I enjoy organizing my tasks and planning ahead carefully");
		await input.press("Enter");
		// Wait for Nerin's conscientiousness-themed response
		await expect(page.getByText(/structured approach|value having a plan/i)).toBeVisible({ timeout: 30000 });

		// Dismiss sign-up modal if it appears (triggers after first user message for unauthenticated users)
		const continueButton = page.getByText("Continue without account");
		if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			await continueButton.click();
		}

		// Wait for input to be ready again
		await expect(input).toBeEnabled({ timeout: 5000 });

		// Second message — openness-themed
		await input.fill("I love exploring new creative ideas and imagining possibilities");
		await input.press("Enter");
		// Wait for Nerin's second response (any new assistant message bubble)
		const assistantMessages = page.locator(".bg-slate-700\\/50");
		// Should have at least 3 assistant-styled messages (greeting + 2 responses)
		await expect(assistantMessages.nth(2)).toBeVisible({ timeout: 30000 });

		// Both user messages should still be visible (scroll history preserved)
		await expect(page.getByText(/organizing my tasks/i)).toBeVisible();
		await expect(page.getByText(/exploring new creative/i)).toBeVisible();
	});

	test("user messages should be clickable with data-message-id", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		// Send a message
		const input = page.getByPlaceholder(/type your response here/i);
		await input.fill("I think creativity is important");
		await input.press("Enter");

		// Wait for the user message to appear
		await expect(page.getByText(/I think creativity is important/i)).toBeVisible({ timeout: 3000 });

		// User message should be a button element with data-message-id
		const userMessageButton = page.locator("button[data-message-id]").first();
		await expect(userMessageButton).toBeVisible();
		const messageId = await userMessageButton.getAttribute("data-message-id");
		expect(messageId).toBeTruthy();
	});

	test("should disable input while waiting for response", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		const input = page.getByPlaceholder(/type your response here/i);
		await input.fill("Tell me about personality");
		await input.press("Enter");

		// Input should be disabled while loading
		await expect(input).toBeDisabled({ timeout: 3000 });

		// After response arrives, input should be enabled again
		await expect(page.getByText(/thank you for sharing|tell me a bit more/i)).toBeVisible({ timeout: 30000 });
		await expect(input).toBeEnabled({ timeout: 5000 });
	});
});

test.describe("Assessment Conversation - Mobile", () => {
	test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

	test("should show floating trait button on mobile instead of sidebar", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		// Floating button should be visible on mobile
		const traitButton = page.getByLabel("Show trait scores");
		await expect(traitButton).toBeVisible({ timeout: 5000 });

		// Click to open bottom sheet
		await traitButton.click();

		// Bottom sheet should show trait scores
		await expect(page.getByText("Trait Scores")).toBeVisible({ timeout: 5000 });
		// Scope to the bottom sheet container since traits also exist in the hidden desktop sidebar
		const bottomSheet = page.locator(".fixed.inset-0");
		await expect(bottomSheet.getByText("Openness")).toBeVisible();

		// Close button should dismiss the sheet
		const closeButton = page.getByLabel("Close", { exact: true });
		await closeButton.click();
		await expect(page.getByText("Trait Scores")).not.toBeVisible({ timeout: 3000 });
	});

	test("should allow messaging on mobile viewport", async ({ page }) => {
		await page.goto("/chat", { waitUntil: "networkidle" });
		await page.waitForURL(/\/chat\?sessionId=/, { timeout: 15000 });
		await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

		const input = page.getByPlaceholder(/type your response here/i);
		await input.fill("I love reading books");
		await input.press("Enter");

		// User message should appear
		await expect(page.getByText(/I love reading books/i)).toBeVisible({ timeout: 3000 });

		// Nerin should respond
		await expect(page.locator(".bg-slate-700\\/50").last()).toBeVisible({ timeout: 30000 });
	});
});
