/**
 * Homepage & Acquisition Funnel E2E Tests (P1-004, P1-005)
 *
 * Verifies the homepage split layout renders correctly:
 * - Skip-to-content accessibility
 * - Desktop: sticky auth panel with signup form + login link
 * - Desktop: hero section visible in left pane
 */

import { expect, test } from "@playwright/test";

test.describe("Homepage & Acquisition Funnel", () => {
	test("keyboard users can skip repeated navigation to main content @smoke", async ({ page }) => {
		await page.goto("/");

		const skipLink = page.getByTestId("skip-to-content");
		const main = page.locator("main#main-content");

		await page.keyboard.press("Tab");

		await expect(skipLink).toBeVisible();
		await expect(skipLink).toBeFocused();

		await page.keyboard.press("Enter");

		await expect(main).toBeFocused();
	});

	test("desktop split layout shows auth panel with signup form @smoke", async ({ page }) => {
		await test.step("load homepage and verify split layout", async () => {
			await page.goto("/");
			await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });

			// Desktop: sticky auth panel with inline signup form is visible
			await expect(page.getByTestId("sticky-auth-panel")).toBeVisible();
			await expect(page.getByTestId("homepage-signup-form")).toBeVisible();
		});

		await test.step("login link navigates to /login", async () => {
			const loginLink = page.getByTestId("login-link");
			await expect(loginLink).toBeVisible();
			await loginLink.click();
			await page.waitForURL(/\/login/, { timeout: 10_000 });
		});
	});
});
