/**
 * Homepage & Acquisition Funnel E2E Tests (P1-004, P1-005)
 *
 * Verifies the homepage split layout renders correctly:
 * - Skip-to-content accessibility
 * - Desktop: sticky auth panel with signup + login links
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

	test("desktop split layout shows auth panel with signup link @smoke", async ({ page }) => {
		await test.step("load homepage and verify split layout", async () => {
			await page.goto("/");
			await page.locator("[data-slot='sticky-auth-panel']").waitFor({ state: "visible" });

			// Desktop: sticky auth panel with signup and login links
			await expect(page.getByRole("link", { name: /start yours/i })).toBeVisible();
		});

		await test.step("login link navigates to /login", async () => {
			const loginLink = page.getByRole("link", { name: /log in/i });
			await expect(loginLink).toBeVisible();
			await loginLink.click();
			await page.waitForURL(/\/login/, { timeout: 10_000 });
		});
	});
});
