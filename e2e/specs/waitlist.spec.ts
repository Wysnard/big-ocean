import { execSync } from "node:child_process";
import { API_URL } from "../e2e-env.js";
import { expect, test } from "../fixtures/base.fixture.js";

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
	test("POST /api/waitlist/signup — valid email returns ok", async ({ apiContext }) => {
		const uniqueEmail = `e2e-waitlist-${Date.now()}@test.bigocean.dev`;

		const res = await apiContext.post(`${API_URL}/api/waitlist/signup`, {
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
	}) => {
		const uniqueEmail = `e2e-waitlist-dup-${Date.now()}@test.bigocean.dev`;

		// First signup
		const res1 = await apiContext.post(`${API_URL}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});
		expect(res1.status()).toBe(200);

		// Same email again — should still succeed
		const res2 = await apiContext.post(`${API_URL}/api/waitlist/signup`, {
			data: { email: uniqueEmail },
		});
		expect(res2.status()).toBe(200);
		const body = await res2.json();
		expect(body).toEqual({ ok: true });
	});

	test("POST /api/waitlist/signup — invalid email rejected", async ({ apiContext }) => {
		const res = await apiContext.post(`${API_URL}/api/waitlist/signup`, {
			data: { email: "not-an-email" },
		});

		// Contract validation rejects malformed email
		expect(res.status()).toBeGreaterThanOrEqual(400);
	});
});

test.describe("Waitlist UI", () => {
	// Exhaust the global assessment limit in Redis so the API returns 503.
	// Redis is exposed on port 6380 in the e2e Docker environment.
	const todayKey = new Date().toISOString().slice(0, 10);
	const redisKey = `global_assessments:${todayKey}`;

	test.beforeAll(() => {
		// Set the counter above the default limit (100) so next assessment start returns 503
		execSync(`docker exec bigocean-redis-e2e redis-cli SET ${redisKey} 999`);
	});

	test.afterAll(() => {
		// Clean up — reset the counter
		execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
	});

	test("waitlist form renders when circuit breaker is active", async ({ page }) => {
		await page.goto("/chat");

		const form = page.locator("[data-testid='waitlist-form']");
		await form.waitFor({ state: "visible", timeout: 15_000 });

		await expect(page.locator("[data-testid='waitlist-email-input']")).toBeVisible();
		await expect(page.locator("[data-testid='waitlist-submit-button']")).toBeVisible();
		await expect(page.locator("[data-testid='waitlist-submit-button']")).toHaveText(
			"Join the waitlist",
		);
	});

	test("waitlist form submits email and API returns success", async ({ page }) => {
		const uniqueEmail = `e2e-waitlist-ui-${Date.now()}@test.bigocean.dev`;

		await page.goto("/chat");
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
