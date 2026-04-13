import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Dashboard E2E Tests (migrated from profile-page)
 *
 * Two golden-path scenarios:
 * 1. Auth user without assessment → empty dashboard state
 * 2. Auth user with completed assessment → dashboard → results page
 *
 * The E2E Docker compose sets FREE_TIER_MESSAGE_THRESHOLD=2.
 * Global setup seeds a completed session via seedSessionForResults.
 * Assessment card completion is derived from session status, not message count.
 */

const AUTH_DIR = resolve(import.meta.dirname, "../.auth");

test.describe("dashboard: auth user without assessment", () => {
	test.use({ storageState: resolve(AUTH_DIR, "other-user.json") });

	test("home → header avatar → dashboard shows empty state", async ({ page }) => {
		await test.step("navigate to home page", async () => {
			await page.goto("/");
			await page.locator("[data-slot='sticky-auth-panel']").waitFor({ state: "visible" });
		});

		await test.step("click dashboard link in user nav dropdown", async () => {
			// Wait for auth to resolve — the avatar button appears
			// only when the user is authenticated (not during loading skeleton)
			const avatarButton = page.getByTestId("user-nav-avatar");
			await avatarButton.waitFor({ state: "visible", timeout: 10_000 });
			await avatarButton.click();

			// Click the "Dashboard" link in the dropdown
			await page.getByRole("menuitem", { name: "Dashboard" }).click();
			await page.waitForURL(/\/dashboard\/?$/);
		});

		await test.step("verify empty dashboard state", async () => {
			await page.getByTestId("dashboard-empty-state").waitFor({
				state: "visible",
				timeout: 10_000,
			});
			// Verify the CTA to start assessment is present
			await expect(page.getByRole("link", { name: "Start Your Conversation" })).toBeVisible();
		});
	});
});

test.describe("dashboard: auth user with completed assessment", () => {
	test.use({ storageState: resolve(AUTH_DIR, "owner.json") });

	test("dashboard shows identity card → click View Full Results → results page", async ({
		page,
	}) => {
		await test.step("navigate to dashboard", async () => {
			// Navigate to home first so the SPA loads and auth cookies are established,
			// then use client-side navigation to /dashboard (avoids race condition where
			// getSession() in beforeLoad may fail on a cold page.goto to an auth route).
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const avatarButton = page.getByTestId("user-nav-avatar");
			await avatarButton.waitFor({ state: "visible", timeout: 10_000 });
			await avatarButton.click();
			await page.getByRole("menuitem", { name: "Dashboard" }).click();
			await page.waitForURL(/\/dashboard\/?$/);

			await page.getByTestId("dashboard-page").waitFor({
				state: "visible",
				timeout: 15_000,
			});
		});

		await test.step("verify identity card is visible with archetype name", async () => {
			await page.getByTestId("dashboard-identity-card").waitFor({
				state: "visible",
				timeout: 10_000,
			});
			await expect(page.getByTestId("dashboard-archetype-name")).toBeVisible();
		});

		await test.step("click View Full Results and navigate to results page", async () => {
			await page.getByRole("link", { name: "View Full Results" }).click();
			await page.waitForURL(/\/results\//);
		});

		await test.step("verify results page renders archetype hero", async () => {
			await page.getByTestId("archetype-hero-section").waitFor({
				state: "visible",
				timeout: 15_000,
			});
		});
	});
});
