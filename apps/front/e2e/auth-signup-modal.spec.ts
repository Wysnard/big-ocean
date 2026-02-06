import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Story 4.1: Authentication UI (Sign-Up Modal)
 *
 * Tests the sign-up modal that appears after the user's first message
 * in the assessment conversation.
 */

test.describe("Sign-Up Modal", () => {
	test("should show sign-up modal after first message", async ({ page }) => {
		// Navigate to assessment page
		await page.goto("/chat");

		// Wait for chat interface to load
		await expect(page.getByText(/welcome/i)).toBeVisible();

		// Type and send first message
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Hello, I'm ready to start the assessment");
		await messageInput.press("Enter");

		// Wait for Nerin's response
		await expect(page.getByText(/nerin/i)).toBeVisible();

		// Modal should appear after first message
		await expect(
			page.getByRole("dialog").getByText(/save your results/i),
		).toBeVisible();
	});

	test("should allow dismissing modal to continue as guest", async ({
		page,
	}) => {
		await page.goto("/chat");

		// Send first message (trigger modal)
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Test message");
		await messageInput.press("Enter");

		// Wait for modal
		const modal = page.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Click "Continue without account" button
		await modal.getByRole("button", { name: /continue without/i }).click();

		// Modal should close
		await expect(modal).not.toBeVisible();

		// User should be able to continue chatting
		await expect(messageInput).toBeVisible();
	});

	test("should validate email format", async ({ page }) => {
		await page.goto("/chat");

		// Trigger modal
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Test message");
		await messageInput.press("Enter");

		const modal = page.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Try invalid email
		await modal.getByPlaceholder(/email/i).fill("invalid-email");
		await modal.getByPlaceholder(/password/i).fill("SecurePassword123!");
		await modal.getByRole("button", { name: /sign up/i }).click();

		// Should show validation error
		await expect(modal.getByText(/invalid email/i)).toBeVisible();
	});

	test("should validate password length (12+ chars)", async ({ page }) => {
		await page.goto("/chat");

		// Trigger modal
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Test message");
		await messageInput.press("Enter");

		const modal = page.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Try short password
		await modal.getByPlaceholder(/email/i).fill("test@example.com");
		await modal.getByPlaceholder(/password/i).fill("short");
		await modal.getByRole("button", { name: /sign up/i }).click();

		// Should show validation error
		await expect(modal.getByText(/12 characters/i)).toBeVisible();
	});

	test("should successfully sign up and link session", async ({ page }) => {
		await page.goto("/chat");

		// Trigger modal
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Test message");
		await messageInput.press("Enter");

		const modal = page.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Fill valid credentials
		const timestamp = Date.now();
		await modal
			.getByPlaceholder(/email/i)
			.fill(`test-${timestamp}@example.com`);
		await modal.getByPlaceholder(/password/i).fill("SecurePassword123!");
		await modal.getByRole("button", { name: /sign up/i }).click();

		// Should show success message
		await expect(
			page.getByText(/your results are being saved/i),
		).toBeVisible();

		// Modal should close
		await expect(modal).not.toBeVisible();

		// User should be authenticated (check for user menu or logout button)
		await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
	});

	test("should handle duplicate email error", async ({ page }) => {
		await page.goto("/chat");

		// Trigger modal
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Test message");
		await messageInput.press("Enter");

		const modal = page.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Try to sign up with existing email
		await modal.getByPlaceholder(/email/i).fill("existing@example.com");
		await modal.getByPlaceholder(/password/i).fill("SecurePassword123!");
		await modal.getByRole("button", { name: /sign up/i }).click();

		// Should show error message
		await expect(modal.getByText(/already exists/i)).toBeVisible();
	});
});

test.describe("Mobile Responsiveness", () => {
	test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

	test("should display modal correctly on mobile", async ({ page }) => {
		await page.goto("/chat");

		// Trigger modal
		const messageInput = page.getByPlaceholder(/type your message/i);
		await messageInput.fill("Test message");
		await messageInput.press("Enter");

		const modal = page.getByRole("dialog");
		await expect(modal).toBeVisible();

		// Modal should be responsive and readable
		await expect(modal.getByText(/save your results/i)).toBeVisible();
		await expect(modal.getByPlaceholder(/email/i)).toBeVisible();
		await expect(modal.getByPlaceholder(/password/i)).toBeVisible();

		// Form should be usable on mobile
		await expect(modal.getByRole("button", { name: /sign up/i })).toBeVisible();
		await expect(
			modal.getByRole("button", { name: /continue without/i }),
		).toBeVisible();
	});
});
