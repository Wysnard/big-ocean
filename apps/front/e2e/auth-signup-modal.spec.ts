import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Story 4.1: Authentication UI (Sign-Up Modal)
 *
 * Tests the sign-up modal that appears after the user's first message
 * in the assessment conversation.
 *
 * The chat page loads with Nerin's greeting already visible (pre-populated
 * by useTherapistChat hook). There is no welcome screen or "Start Assessment"
 * button — users type directly into the input field.
 */

/**
 * Helper: navigate to /chat, wait for Nerin's greeting and input,
 * send a first message to trigger the sign-up modal.
 * Returns { messageInput, modal } for further interaction.
 */
async function triggerSignUpModal(page: import("@playwright/test").Page) {
	await page.goto("/chat", { waitUntil: "networkidle" });

	// Wait for the page header and Nerin's pre-populated greeting
	await expect(page.getByText(/Big Five Personality Assessment/i).first()).toBeVisible({ timeout: 10000 });
	await expect(page.getByText(/I'm Nerin/i).first()).toBeVisible({ timeout: 10000 });

	// Type and send first user message to trigger the modal
	const messageInput = page.getByPlaceholder(/type your response here/i);
	await expect(messageInput).toBeVisible({ timeout: 5000 });
	await messageInput.fill("Hello, I'm ready to start the assessment");
	await messageInput.press("Enter");

	// Wait for modal to appear after first user message
	const modal = page.getByRole("dialog");
	await expect(modal).toBeVisible({ timeout: 15000 });

	return { messageInput, modal };
}

test.describe("Sign-Up Modal", () => {
	test("should show sign-up modal after first message", async ({ page }) => {
		const { modal } = await triggerSignUpModal(page);

		// Modal should display the save prompt
		await expect(modal.getByText(/save your results/i)).toBeVisible({ timeout: 5000 });
	});

	test("should allow dismissing modal to continue as guest", async ({ page }) => {
		const { messageInput, modal } = await triggerSignUpModal(page);

		// Click "Continue without account" button
		const continueButton = modal.getByRole("button", { name: /continue without/i });
		await expect(continueButton).toBeVisible({ timeout: 5000 });
		await continueButton.click();

		// Modal should close
		await expect(modal).not.toBeVisible({ timeout: 5000 });

		// User should be able to continue chatting
		await expect(messageInput).toBeVisible();
	});

	test("should validate email format", async ({ page }) => {
		const { modal } = await triggerSignUpModal(page);

		// Bypass browser's native type="email" validation so our custom validation runs
		await modal.locator("form").evaluate((form) => form.setAttribute("novalidate", ""));

		// Try invalid email
		const emailInput = modal.getByPlaceholder(/email/i);
		const passwordInput = modal.getByPlaceholder(/at least 12 characters/i);
		const signUpButton = modal.getByRole("button", { name: /sign up/i });

		await expect(emailInput).toBeVisible({ timeout: 5000 });
		await emailInput.fill("notanemail");
		await passwordInput.fill("SecurePassword123!");
		await signUpButton.click();

		// Should show custom validation error
		await expect(modal.getByText(/please enter a valid email address/i)).toBeVisible({ timeout: 5000 });
	});

	test("should validate password length (12+ chars)", async ({ page }) => {
		const { modal } = await triggerSignUpModal(page);

		// Try short password
		const emailInput = modal.getByPlaceholder(/email/i);
		const passwordInput = modal.getByPlaceholder(/at least 12 characters/i);
		const signUpButton = modal.getByRole("button", { name: /sign up/i });

		await expect(emailInput).toBeVisible({ timeout: 5000 });
		await emailInput.fill("test@example.com");
		await passwordInput.fill("short");
		await signUpButton.click();

		// Should show validation error
		await expect(modal.getByText(/12 characters/i)).toBeVisible({ timeout: 5000 });
	});

	// Requires Docker test environment: pnpm test:e2e:setup
	test("should successfully sign up and link session", async ({ page }) => {
		const { modal } = await triggerSignUpModal(page);

		// Fill valid credentials (unique email with timestamp)
		const timestamp = Date.now();
		const emailInput = modal.getByPlaceholder(/email/i);
		const passwordInput = modal.getByPlaceholder(/at least 12 characters/i);
		const signUpButton = modal.getByRole("button", { name: /sign up/i });

		await expect(emailInput).toBeVisible({ timeout: 5000 });
		await emailInput.fill(`test-${timestamp}@example.com`);
		await passwordInput.fill("SecurePassword123!");
		await signUpButton.click();

		// Should show success message (inside modal before it closes)
		await expect(modal.getByText(/your results are being saved/i)).toBeVisible({ timeout: 10000 });

		// Modal should close after brief delay
		await expect(modal).not.toBeVisible({ timeout: 5000 });
	});

	// Requires Docker test environment: pnpm test:e2e:setup
	test("should handle duplicate email error", async ({ page }) => {
		// First, create an account on the signup page
		await page.goto("/signup", { waitUntil: "networkidle" });
		const timestamp = Date.now();
		const testEmail = `duplicate-${timestamp}@example.com`;

		await expect(page.getByText(/Create Account/i)).toBeVisible({ timeout: 10000 });

		// Fill the signup form (has Name, Email, Password, Confirm Password fields)
		const nameInput = page.getByLabel(/name/i);
		const emailInput = page.getByLabel(/^email$/i);
		const passwordInput = page.getByLabel(/^password$/i);
		const confirmPasswordInput = page.getByLabel(/confirm password/i);
		const signUpButton = page.getByRole("button", { name: /sign up/i });

		await nameInput.fill("Test User");
		await emailInput.fill(testEmail);
		await passwordInput.fill("SecurePassword123!");
		await confirmPasswordInput.fill("SecurePassword123!");
		await signUpButton.click();

		// Wait for signup to complete and redirect to dashboard
		await page.waitForURL("**/dashboard", { timeout: 15000 });

		// Sign out so the modal will appear on /chat (only shows for unauthenticated users)
		await page.getByRole("button", { name: /sign out/i }).click();
		await page.waitForTimeout(500);

		// Now try to sign up again with the same email via modal
		const { modal } = await triggerSignUpModal(page);

		// Try to sign up with existing email
		const modalEmailInput = modal.getByPlaceholder(/email/i);
		const modalPasswordInput = modal.getByPlaceholder(/at least 12 characters/i);
		const modalSignUpButton = modal.getByRole("button", { name: /sign up/i });

		await expect(modalEmailInput).toBeVisible({ timeout: 5000 });
		await modalEmailInput.fill(testEmail);
		await modalPasswordInput.fill("SecurePassword123!");
		await modalSignUpButton.click();

		// Should show error message about existing account
		await expect(modal.getByText(/already exists|already registered|already in use/i)).toBeVisible({ timeout: 10000 });
	});
});

test.describe("Mobile Responsiveness", () => {
	test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

	test("should display modal correctly on mobile", async ({ page }) => {
		const { modal } = await triggerSignUpModal(page);

		// Modal should be responsive and readable
		await expect(modal.getByText(/save your results/i)).toBeVisible({ timeout: 5000 });
		await expect(modal.getByPlaceholder(/email/i)).toBeVisible({ timeout: 5000 });
		await expect(modal.getByPlaceholder(/at least 12 characters/i)).toBeVisible({ timeout: 5000 });

		// Form should be usable on mobile
		await expect(modal.getByRole("button", { name: /sign up/i })).toBeVisible({ timeout: 5000 });
		await expect(modal.getByRole("button", { name: /continue without/i })).toBeVisible({ timeout: 5000 });
	});
});
