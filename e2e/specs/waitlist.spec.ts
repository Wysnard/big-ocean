import { expect, test } from "../fixtures/base.fixture.js";
import { signUpAndLoginViaBrowser } from "../utils/browser-auth.js";

/**
 * Waitlist & Circuit Breaker (Story 15.3)
 *
 * Tests:
 * - POST /api/waitlist/signup accepts valid email
 * - Duplicate email is handled gracefully (idempotent)
 * - Invalid email is rejected by contract validation
 * - Waitlist form UI renders when circuit breaker is active
 * - Waitlist form submits email successfully
 */

test.describe("Waitlist API", () => {
	test("POST /api/waitlist/signup — valid email returns ok", async ({ apiContext, apiUrl }) => {
		const uniqueEmail = `e2e-waitlist-${Date.now()}@gmail.com`;

		const res = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});

		if (res.status() !== 200) {
			console.error("API error:", res.status(), await res.text());
		}
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ ok: true });
	});

	test("POST /api/waitlist/signup — duplicate email succeeds (idempotent)", async ({
		apiContext,
		apiUrl,
	}) => {
		const uniqueEmail = `e2e-waitlist-dup-${Date.now()}@gmail.com`;

		// First signup
		const res1 = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});
		expect(res1.status()).toBe(200);

		// Same email again — should still succeed
		const res2 = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});
		expect(res2.status()).toBe(200);
		const body = await res2.json();
		expect(body).toEqual({ ok: true });
	});

	test("POST /api/waitlist/signup — invalid email rejected", async ({ apiContext, apiUrl }) => {
		const res = await apiContext.post(`${apiUrl}/api/waitlist/signup`, {
			data: { email: "not-an-email" },
		});

		// Contract validation rejects malformed email
		expect(res.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe("Waitlist UI", () => {
	// Navigate directly to /chat?waitlist=true to test the waitlist form UI.
	// The circuit breaker redirect (Redis counter → 503 → /chat?waitlist=true)
	// is tested implicitly by the route logic; here we focus on form rendering.

	test("waitlist form renders when circuit breaker is active", async ({ page }) => {
		await signUpAndLoginViaBrowser(page, {
			email: `e2e-waitlist-ui-render+${Date.now()}@gmail.com`,
			password: "OceanDepth#Nerin42xQ",
		});

		await page.goto("/chat?waitlist=true");

		const form = page.locator("[data-testid='waitlist-form']");
		await form.waitFor({ state: "visible", timeout: 15_000 });

		await expect(page.locator("[data-testid='waitlist-email-input']")).toBeVisible();
		await expect(page.locator("[data-testid='waitlist-submit-button']")).toBeVisible();
		await expect(page.locator("[data-testid='waitlist-submit-button']")).toHaveText(
			"Join the waitlist",
		);
	});

	test("waitlist form submits email and API returns success", async ({ page }) => {
		await signUpAndLoginViaBrowser(page, {
			email: `e2e-waitlist-ui-submit+${Date.now()}@gmail.com`,
			password: "OceanDepth#Nerin42xQ",
		});

		const uniqueEmail = `e2e-waitlist-ui-${Date.now()}@gmail.com`;

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

		// Submit and verify API response
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
