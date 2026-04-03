/**
 * Browser Auth Helpers — sign up and log in via the browser page.
 *
 * Used by E2E tests that need an authenticated user before navigating
 * to auth-required routes like /chat.
 */

import type { Page } from "@playwright/test";
import pg from "pg";
import { TEST_DB_CONFIG } from "../e2e-env.js";

const { Pool } = pg;

interface SignUpAndLoginInput {
	email: string;
	password: string;
	name?: string;
}

/**
 * Sign up a new user via the browser, verify email in DB, and log in.
 *
 * After this function returns, the browser page has auth cookies set
 * and can navigate to auth-required routes.
 */
export async function signUpAndLoginViaBrowser(
	page: Page,
	input: SignUpAndLoginInput,
): Promise<void> {
	// 1. Navigate to signup page and fill form
	await page.goto("/signup");
	const submitBtn = page.locator('button[type="submit"]');
	await submitBtn.waitFor({ state: "visible" });

	await page.locator("#signup-name").fill(input.name ?? "E2E Tester");
	await page.locator("#signup-email").fill(input.email);
	await page.locator("#signup-password").fill(input.password);
	await page.locator("#signup-confirm-password").fill(input.password);
	await submitBtn.click();

	// 2. Wait for signup to complete (redirects to /verify-email)
	await page.waitForTimeout(2_000);

	// 3. Verify email directly in DB (bypass email verification)
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();
	try {
		for (let i = 0; i < 5; i++) {
			const result = await client.query(
				`UPDATE "user" SET "email_verified" = true WHERE "email" = $1 RETURNING id`,
				[input.email],
			);
			if (result.rowCount && result.rowCount > 0) break;
			await new Promise((r) => setTimeout(r, 1_000));
		}
	} finally {
		client.release();
		await pool.end();
	}

	// 4. Log in via browser login page
	await page.goto("/login");
	const loginBtn = page.locator('button[type="submit"]');
	await loginBtn.waitFor({ state: "visible" });
	await page.locator("#login-email").fill(input.email);
	await page.locator("#login-password").fill(input.password);
	await loginBtn.click();
	await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}

/**
 * Log in an existing user via the browser login page.
 */
export async function loginViaBrowser(
	page: Page,
	input: { email: string; password: string },
): Promise<void> {
	await page.goto("/login");
	const submitBtn = page.locator('button[type="submit"]');
	await submitBtn.waitFor({ state: "visible" });
	await page.locator("#login-email").fill(input.email);
	await page.locator("#login-password").fill(input.password);
	await submitBtn.click();
	await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}
