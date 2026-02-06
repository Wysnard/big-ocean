import { test, expect } from "@playwright/test";

/**
 * E2E Tests for full authentication flow: Sign Up → Login → Logout
 *
 * Requires Docker test environment with working auth API:
 *   pnpm docker:test:up
 *   (API on port 4001, PostgreSQL on port 5433, Redis on port 6380)
 */

const TEST_PASSWORD = "SecurePassword1234";

function uniqueEmail() {
	return `e2e-flow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

test.describe("Auth Flow: Sign Up → Login → Logout", () => {
	let testEmail: string;

	test.beforeEach(() => {
		testEmail = uniqueEmail();
	});

	test("should sign up, be redirected to dashboard, then logout", async ({ page }) => {
		// --- Sign Up ---
		await page.goto("/signup", { waitUntil: "networkidle" });
		await expect(page.getByText(/Create Account/i)).toBeVisible({ timeout: 10000 });

		await page.getByLabel(/name/i).fill("E2E Test User");
		await page.getByLabel(/^email$/i).fill(testEmail);
		await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
		await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
		await page.getByRole("button", { name: /sign up/i }).click();

		// Should redirect to /dashboard
		await page.waitForURL("**/dashboard", { timeout: 15000 });
		await expect(page.getByText(/Welcome, E2E Test User/i)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(testEmail).first()).toBeVisible();

		// --- Logout ---
		const signOutButton = page.getByRole("button", { name: /sign out/i });
		await expect(signOutButton).toBeVisible({ timeout: 5000 });
		await signOutButton.click();

		// After sign out, should no longer see user info
		await expect(page.getByText(/Welcome, E2E Test User/i)).not.toBeVisible({ timeout: 10000 });
	});

	test("should sign up, logout, then login with same credentials", async ({ page }) => {
		// --- Sign Up ---
		await page.goto("/signup", { waitUntil: "networkidle" });
		await expect(page.getByText(/Create Account/i)).toBeVisible({ timeout: 10000 });

		await page.getByLabel(/name/i).fill("E2E Login User");
		await page.getByLabel(/^email$/i).fill(testEmail);
		await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
		await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
		await page.getByRole("button", { name: /sign up/i }).click();

		// Wait for dashboard
		await page.waitForURL("**/dashboard", { timeout: 15000 });
		await expect(page.getByText(/Welcome, E2E Login User/i)).toBeVisible({ timeout: 10000 });

		// --- Logout ---
		await page.getByRole("button", { name: /sign out/i }).click();
		await expect(page.getByText(/Welcome, E2E Login User/i)).not.toBeVisible({ timeout: 10000 });

		// --- Login ---
		// Wait for any logout redirect to settle before navigating
		await page.waitForTimeout(500);
		await page.goto("/login", { waitUntil: "networkidle" });
		await expect(page.getByText(/Sign In/i).first()).toBeVisible({ timeout: 10000 });

		await page.getByLabel(/^email$/i).fill(testEmail);
		await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
		await page.getByRole("button", { name: /sign in/i }).click();

		// Should redirect to /dashboard with same user
		await page.waitForURL("**/dashboard", { timeout: 15000 });
		await expect(page.getByText(/Welcome, E2E Login User/i)).toBeVisible({ timeout: 10000 });
		await expect(page.getByText(testEmail).first()).toBeVisible();
	});

	test("should not login with wrong password", async ({ page }) => {
		// --- Create account first ---
		await page.goto("/signup", { waitUntil: "networkidle" });
		await page.getByLabel(/name/i).fill("Wrong Pass User");
		await page.getByLabel(/^email$/i).fill(testEmail);
		await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
		await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
		await page.getByRole("button", { name: /sign up/i }).click();
		await page.waitForURL("**/dashboard", { timeout: 15000 });

		// --- Logout ---
		await page.getByRole("button", { name: /sign out/i }).click();
		await expect(page.getByText(/Welcome/i)).not.toBeVisible({ timeout: 10000 });

		// --- Try login with wrong password ---
		// Wait for any logout redirect to settle before navigating
		await page.waitForTimeout(500);
		await page.goto("/login", { waitUntil: "networkidle" });
		await page.getByLabel(/^email$/i).fill(testEmail);
		await page.getByLabel(/^password$/i).fill("WrongPassword1234");
		await page.getByRole("button", { name: /sign in/i }).click();

		// Should show error, not redirect
		await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 10000 });
		await expect(page).toHaveURL(/\/login/);
	});

	test("should not access dashboard when logged out", async ({ page }) => {
		// Navigate to dashboard without being authenticated
		await page.goto("/dashboard", { waitUntil: "networkidle" });

		// useRequireAuth redirects to /login
		await page.waitForURL("**/login", { timeout: 10000 });
	});
});
