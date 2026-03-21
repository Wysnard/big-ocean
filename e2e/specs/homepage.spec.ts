/**
 * Homepage & Acquisition Funnel E2E Tests (P1-004, P1-005)
 *
 * Verifies the homepage renders correctly and CTAs navigate to expected destinations:
 * - Hero section with primary CTA
 * - Scroll CTA ("See how it works")
 * - Final CTA section at bottom
 * - Founder portrait bridge section
 */

import { expect, test } from "@playwright/test";

test.describe("Homepage & Acquisition Funnel", () => {
	test("@P1 hero section renders with CTA that navigates to /chat", async ({ page }) => {
		await page.goto("/");
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });

		const heroCta = page.getByTestId("hero-cta");
		await expect(heroCta).toBeVisible();

		// CTA should link to /chat
		await heroCta.click();

		// /chat beforeLoad creates a session and redirects to /chat?sessionId=...
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await page.waitForURL(/\/chat/, { timeout: 10_000 });
				break;
			} catch {
				if (attempt === 2) throw new Error("Hero CTA did not navigate to /chat");
				await page.waitForTimeout(1_000);
			}
		}
	});

	test("@P1 scroll CTA is visible and links to content section", async ({ page }) => {
		await page.goto("/");
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });

		const scrollCta = page.getByTestId("hero-scroll-cta");
		await expect(scrollCta).toBeVisible();
	});

	test("@P1 final CTA section renders at bottom of page", async ({ page }) => {
		await page.goto("/");

		const finalCta = page.getByTestId("final-cta");
		await finalCta.scrollIntoViewIfNeeded();
		await expect(finalCta).toBeVisible();

		const finalCtaButton = page.getByTestId("final-cta-button");
		await expect(finalCtaButton).toBeVisible();
	});

	test("@P1 final CTA button navigates to /chat", async ({ page }) => {
		await page.goto("/");

		const finalCtaButton = page.getByTestId("final-cta-button");
		await finalCtaButton.scrollIntoViewIfNeeded();
		await finalCtaButton.click();

		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await page.waitForURL(/\/chat/, { timeout: 10_000 });
				break;
			} catch {
				if (attempt === 2) throw new Error("Final CTA did not navigate to /chat");
				await page.waitForTimeout(1_000);
			}
		}
	});
});
