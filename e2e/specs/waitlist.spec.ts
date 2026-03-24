import { execSync } from "node:child_process";
import { expect, test } from "../fixtures/base.fixture.js";
import { signUpAndLoginViaBrowser } from "../utils/browser-auth.js";

/**
 * Waitlist UI (Story 15.3)
 *
 * Tests:
 * - Waitlist form UI renders when circuit breaker is active
 * - Waitlist form submits email successfully
 *
 * API-only tests (POST /api/waitlist/signup) have been extracted to
 * __extracted-api-tests/waitlist-api.spec.ts for migration to integration tier.
 */

test.describe("Waitlist UI", () => {
	const todayKey = new Date().toISOString().slice(0, 10);
	const redisKey = `global_assessments:${todayKey}`;

	test.afterAll(() => {
		execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
	});

	test("waitlist form renders when circuit breaker is active @smoke", async ({ page }) => {
		await test.step("sign up and login via browser", async () => {
			await signUpAndLoginViaBrowser(page, {
				email: `e2e-waitlist-ui-render+${Date.now()}@gmail.com`,
				password: "OceanDepth#Nerin42xQ",
			});
		});

		await test.step("navigate to waitlist page and verify form renders", async () => {
			await page.goto("/chat?waitlist=true");

			const form = page.locator("[data-testid='waitlist-form']");
			await form.waitFor({ state: "visible", timeout: 15_000 });

			await expect(page.locator("[data-testid='waitlist-email-input']")).toBeVisible();
			await expect(page.locator("[data-testid='waitlist-submit-button']")).toBeVisible();
			await expect(page.locator("[data-testid='waitlist-submit-button']")).toHaveText(
				"Join the waitlist",
			);
		});
	});

	test("waitlist form submits email and API returns success @smoke", async ({ page }) => {
		await test.step("sign up and login via browser", async () => {
			await signUpAndLoginViaBrowser(page, {
				email: `e2e-waitlist-ui-submit+${Date.now()}@gmail.com`,
				password: "OceanDepth#Nerin42xQ",
			});
		});

		const uniqueEmail = `e2e-waitlist-ui-${Date.now()}@gmail.com`;

		await test.step("navigate to waitlist page and fill form", async () => {
			await page.goto("/chat?waitlist=true");
			await page
				.locator("[data-testid='waitlist-form']")
				.waitFor({ state: "visible", timeout: 15_000 });
			// Wait for hydration to complete so React event handlers are attached
			await page.waitForLoadState("networkidle");

			// Fill the form
			const emailInput = page.locator("[data-testid='waitlist-email-input']");
			await emailInput.fill(uniqueEmail);
			await expect(emailInput).toHaveValue(uniqueEmail);
		});

		await test.step("submit form and verify API response", async () => {
			const submitBtn = page.locator("[data-testid='waitlist-submit-button']");
			const [apiResponse] = await Promise.all([
				page.waitForResponse((res) => res.url().includes("/api/waitlist/signup")),
				submitBtn.click(),
			]);

			expect(apiResponse.status()).toBe(200);
			const body = await apiResponse.json();
			expect(body).toEqual({ ok: true });
		});
	});
});
