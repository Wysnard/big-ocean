import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Dashboard Redirect E2E Tests (Story 1.2)
 *
 * The /dashboard route has been retired. Visits now redirect to /today.
 * These tests verify the redirect works for both authenticated user scenarios.
 */

const AUTH_DIR = resolve(import.meta.dirname, "../.auth");

test.describe("dashboard redirect: auth user without assessment", () => {
	test.use({ storageState: resolve(AUTH_DIR, "other-user.json") });

	test("visiting /dashboard redirects to /today", async ({ page }) => {
		await test.step("navigate to home so auth cookies are established", async () => {
			await page.goto("/");
			await page.waitForLoadState("networkidle");
		});

		await test.step("navigate to /dashboard and verify redirect to /today", async () => {
			await page.goto("/dashboard");
			await page.waitForURL(/\/today/, { timeout: 10_000 });
			expect(page.url()).toContain("/today");
		});
	});
});

test.describe("dashboard redirect: auth user with completed assessment", () => {
	test.use({ storageState: resolve(AUTH_DIR, "owner.json") });

	test("visiting /dashboard redirects to /today and shows today page", async ({ page }) => {
		await test.step("navigate to home so auth cookies are established", async () => {
			await page.goto("/");
			await page.waitForLoadState("networkidle");
		});

		await test.step("navigate to /dashboard and verify redirect to /today", async () => {
			await page.goto("/dashboard");
			await page.waitForURL(/\/today/, { timeout: 10_000 });
			expect(page.url()).toContain("/today");
		});

		await test.step("verify today page renders", async () => {
			await page.getByTestId("today-page").waitFor({
				state: "visible",
				timeout: 10_000,
			});
		});
	});
});
