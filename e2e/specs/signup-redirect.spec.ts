import { expect, test } from "@playwright/test";

/**
 * Signup Redirect Flow
 *
 * Verifies that signing up from the standalone /signup page redirects
 * to the correct destination (home by default), then navigates to profile.
 */
test("signup from home → redirects to home → navigate to profile", async ({ page }) => {
	const uniqueEmail = `e2e-signup-redirect-${Date.now()}@test.bigocean.dev`;

	await test.step("navigate to landing page", async () => {
		await page.goto("/");
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
	});

	await test.step("go to signup page with redirectTo=/", async () => {
		await page.goto("/signup?redirectTo=/");
		// Wait for hydration — submit button enabled means React has hydrated the form
		const submitBtn = page.locator('button[type="submit"]');
		await submitBtn.waitFor({ state: "visible" });
		await page.waitForTimeout(1_000); // Extra buffer for hydration to stabilize
	});

	await test.step("fill and submit signup form", async () => {
		await page.locator("#signup-name").fill("E2E Redirect Test");
		await page.locator("#signup-email").fill(uniqueEmail);
		await page.locator("#signup-password").fill("OceanDepth#Nerin42xQ");
		await page.locator("#signup-confirm-password").fill("OceanDepth#Nerin42xQ");

		// Verify fields retained values (hydration may have cleared them — re-fill if needed)
		if ((await page.locator("#signup-name").inputValue()) === "") {
			await page.locator("#signup-name").fill("E2E Redirect Test");
			await page.locator("#signup-email").fill(uniqueEmail);
			await page.locator("#signup-password").fill("OceanDepth#Nerin42xQ");
			await page.locator("#signup-confirm-password").fill("OceanDepth#Nerin42xQ");
		}

		await expect(page.locator("#signup-name")).toHaveValue("E2E Redirect Test");
		await expect(page.locator("#signup-email")).toHaveValue(uniqueEmail);

		await page.locator('button[type="submit"]').click();
	});

	await test.step("verify redirect to home page", async () => {
		await page.waitForURL("/", { timeout: 15_000 });
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
	});

	await test.step("navigate to profile and verify access", async () => {
		await page.goto("/profile");
		await page.waitForURL(/\/profile/, { timeout: 10_000 });
		// Authenticated user should see the profile page, not be redirected to login
		expect(page.url()).toContain("/profile");
	});
});
