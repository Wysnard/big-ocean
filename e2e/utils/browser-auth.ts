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

	await page.getByLabel("Name").click();
	await page.getByLabel("Name").pressSequentially(input.name ?? "E2E Tester");
	await page.getByLabel("Email").click();
	await page.getByLabel("Email").pressSequentially(input.email);
	await page.getByLabel("Password", { exact: true }).click();
	await page.getByLabel("Password", { exact: true }).pressSequentially(input.password);
	await page.getByLabel("Confirm Password").click();
	await page.getByLabel("Confirm Password").pressSequentially(input.password);
	await submitBtn.click();

	// 2. Wait for signup to complete (redirects to /verify-email)
	await page.waitForURL(/\/verify-email/, { timeout: 15_000 }).catch(() => {
		// Signup may not redirect if the form showed a validation error — continue
		// to the DB verification step which will retry until the user appears.
	});

	// 3. Verify email directly in DB (bypass email verification)
	// Retry with backoff — backend may still be processing the signup (Polar hooks, etc.)
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();
	let verified = false;
	try {
		for (let i = 0; i < 15; i++) {
			const result = await client.query(
				`UPDATE "user" SET "email_verified" = true WHERE "email" = $1 RETURNING id`,
				[input.email],
			);
			if (result.rowCount && result.rowCount > 0) {
				verified = true;
				break;
			}
			await new Promise((r) => setTimeout(r, 1_000));
		}
	} finally {
		client.release();
		await pool.end();
	}
	if (!verified) {
		throw new Error(`[signUpAndLoginViaBrowser] User "${input.email}" was not created after 15s`);
	}

	// 4. Log in via browser login page
	await page.goto("/login");
	const loginBtn = page.locator('button[type="submit"]');
	await loginBtn.waitFor({ state: "visible" });
	await page.getByLabel("Email").click();
	await page.getByLabel("Email").pressSequentially(input.email);
	await page.getByLabel("Password").click();
	await page.getByLabel("Password").pressSequentially(input.password);
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
	await page.getByLabel("Email").click();
	await page.getByLabel("Email").pressSequentially(input.email);
	await page.getByLabel("Password").click();
	await page.getByLabel("Password").pressSequentially(input.password);
	await submitBtn.click();
	await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}
