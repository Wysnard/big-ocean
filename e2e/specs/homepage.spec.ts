/**
 * Homepage & Acquisition Funnel E2E Tests (P1-004, P1-005)
 *
 * Verifies the homepage CTAs navigate to expected destinations:
 * - Hero section with primary CTA → /login
 * - Final CTA button → /login
 */

import { expect, test } from "@playwright/test";

test.describe("Homepage & Acquisition Funnel", () => {
	test("hero CTA navigates to /login when unauthenticated @smoke", async ({ page }) => {
		await test.step("load homepage and verify hero section", async () => {
			await page.goto("/");
			await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });

			const heroCta = page.getByTestId("hero-cta");
			await expect(heroCta).toBeVisible();
		});

		await test.step("click hero CTA and verify redirect to /login", async () => {
			const heroCta = page.getByTestId("hero-cta");
			await heroCta.click();
			await page.waitForURL(/\/login/, { timeout: 10_000 });
		});
	});

	test("final CTA button navigates to /login when unauthenticated @smoke", async ({ page }) => {
		await test.step("load homepage and scroll to final CTA", async () => {
			await page.goto("/");

			const finalCtaButton = page.getByTestId("final-cta-button");
			await finalCtaButton.scrollIntoViewIfNeeded();
		});

		await test.step("click final CTA and verify redirect to /login", async () => {
			const finalCtaButton = page.getByTestId("final-cta-button");
			await finalCtaButton.click();

			// CTA links to /chat, which redirects unauthenticated users to /login
			await page.waitForURL(/\/login/, { timeout: 10_000 });
		});
	});
});
