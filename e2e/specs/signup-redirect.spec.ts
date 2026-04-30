import { expect, test } from "@playwright/test";
import pg from "pg";
import { TEST_DB_CONFIG } from "../e2e-env.js";

const { Pool } = pg;

/**
 * Signup Redirect Flow
 *
 * Verifies that signing up from the standalone /signup page redirects
 * to /verify-email (Story 31-7b), then after email verification and
 * sign-in, user can access the Today page.
 */
test("signup from home → redirects to verify-email → sign in → navigate to today @critical", async ({
	page,
}) => {
	const uniqueEmail = `e2e-signup-redirect-${Date.now()}@gmail.com`;

	await test.step("navigate to landing page", async () => {
		await page.goto("/");
		await page.getByTestId("sticky-auth-panel").waitFor({ state: "visible" });
	});

	await test.step("go to signup page with redirectTo=/", async () => {
		await page.goto("/signup?redirectTo=/");
		const submitBtn = page.locator('button[type="submit"]');
		await submitBtn.waitFor({ state: "visible" });
		await expect(page.getByLabel("Name")).toBeEnabled();
	});

	await test.step("fill and submit signup form", async () => {
		await page.waitForLoadState("networkidle");
		await page.getByLabel("Name").fill("E2E Redirect Test");
		await page.getByLabel("Email").fill(uniqueEmail);
		await page.getByLabel("Password", { exact: true }).fill("OceanDepth#Nerin42xQ");
		await page.getByLabel("Confirm Password").fill("OceanDepth#Nerin42xQ");

		await expect(page.getByLabel("Name")).toHaveValue("E2E Redirect Test");
		await expect(page.getByLabel("Email")).toHaveValue(uniqueEmail);

		await page.locator('button[type="submit"]').click();
	});

	await test.step("verify redirect to verify-email page", async () => {
		await page.waitForURL(/\/verify-email/, { timeout: 15_000 });
	});

	await test.step("auto-verify email in DB and sign in via browser", async () => {
		// Bypass email verification and first-visit redirect for E2E
		const pool = new Pool(TEST_DB_CONFIG);
		const client = await pool.connect();
		try {
			await client.query(
				`UPDATE "user" SET "email_verified" = true, "first_visit_completed" = true WHERE "email" = $1`,
				[uniqueEmail],
			);
		} finally {
			client.release();
			await pool.end();
		}

		// Sign in via browser form (cookies persist in browser context)
		await page.goto("/login");
		const submitBtn = page.locator('button[type="submit"]');
		await submitBtn.waitFor({ state: "visible" });
		await page.waitForLoadState("networkidle");
		await page.getByLabel("Email").fill(uniqueEmail);
		await page.getByLabel("Password").fill("OceanDepth#Nerin42xQ");
		await submitBtn.click();

		// After sign-in, wait for navigation away from /login
		await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
	});

	await test.step("navigate to today page via user nav and verify access", async () => {
		// Use client-side navigation via user nav dropdown
		const avatarButton = page.getByTestId("user-nav-avatar");
		await avatarButton.waitFor({ state: "visible", timeout: 10_000 });
		await avatarButton.click();
		await page.getByRole("menuitem", { name: "Today" }).click();
		await page.waitForURL(/\/today/, { timeout: 10_000 });
		expect(page.url()).toContain("/today");
	});
});
