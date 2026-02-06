import { test, expect } from "@playwright/test";

/**
 * Basic E2E test to verify Playwright setup
 */

test.describe("Homepage", () => {
	test("should load homepage successfully", async ({ page }) => {
		await page.goto("/");

		// Check if page loaded
		await expect(page).toHaveURL("/");

		// Verify title or main heading exists
		await expect(page.locator("h1").first()).toBeVisible();
	});

	test("should have working navigation", async ({ page }) => {
		await page.goto("/");

		// Check for navigation links
		const links = page.locator("nav a");
		await expect(links.first()).toBeVisible();
	});
});

test.describe("Accessibility", () => {
	test("should have proper document structure", async ({ page }) => {
		await page.goto("/");

		// Check for semantic HTML
		await expect(page.locator("header")).toBeVisible();
		await expect(page.locator("main")).toBeVisible();
	});
});
