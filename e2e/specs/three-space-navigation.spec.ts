import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Three-space navigation (Today / Me / Circle)
 *
 * Verifies BottomNav client-side navigation between core authenticated surfaces.
 * Uses the pre-seeded owner session (completed assessment) from global setup.
 */

const AUTH_DIR = resolve(import.meta.dirname, "../.auth");

test.describe("three-space nav: authenticated owner", () => {
	test.use({ storageState: resolve(AUTH_DIR, "owner.json") });

	test("BottomNav navigates Today → Me → Circle → Today @smoke", async ({ page }) => {
		await test.step("open Today", async () => {
			await page.goto("/today");
			await page.waitForURL(/\/today/, { timeout: 15_000 });
			await page.getByTestId("today-page").waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("navigate to Me via BottomNav (desktop)", async () => {
			await page.getByTestId("bottom-nav-tab-me-desktop").click();
			await page.waitForURL(/\/me/, { timeout: 15_000 });
			await page.getByTestId("me-page").waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("navigate to Circle", async () => {
			await page.getByTestId("bottom-nav-tab-circle-desktop").click();
			await page.waitForURL(/\/circle/, { timeout: 15_000 });
			await page.getByTestId("circle-page").waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("return to Today", async () => {
			await page.getByTestId("bottom-nav-tab-today-desktop").click();
			await page.waitForURL(/\/today/, { timeout: 15_000 });
			await page.getByTestId("today-page").waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("active tab reflects Today", async () => {
			const todayTab = page.getByTestId("bottom-nav-tab-today-desktop");
			await expect(todayTab).toHaveAttribute("data-state", "active");
		});
	});
});
