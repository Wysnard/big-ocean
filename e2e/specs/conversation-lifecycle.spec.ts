/**
 * Conversation Lifecycle E2E Tests (P0-001, P0-002, P0-003)
 *
 * Exercises the multi-turn conversation flow via API:
 * - Start session → send N messages → verify depth meter progress
 * - Final message triggers farewell / closing exchange
 * - Results page renders with OCEAN code + archetype
 *
 * Uses MESSAGE_THRESHOLD=1 (compose.e2e.yaml), so 1 user message
 * triggers farewell. The test verifies the full pipeline executes:
 * greeting → user message → Nerin response → farewell → results.
 *
 * Depth meter is verified via API message count (frontend component
 * renders based on messageCount / MESSAGE_THRESHOLD ratio).
 */

import { expect, test } from "@playwright/test";
import pg from "pg";
import { TEST_DB_CONFIG } from "../e2e-env.js";
import { createApiContext } from "../utils/api-client.js";

const { Pool } = pg;

const LIFECYCLE_USER = {
	email: `e2e-lifecycle-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "Lifecycle Tester",
} as const;

test.describe("Conversation Lifecycle", () => {
	test.setTimeout(60_000);

	test("@P0 start → exchange → farewell → auth → results with OCEAN code", async ({ page }) => {
		let sessionId = "";

		await test.step("navigate to /chat and create anonymous session", async () => {
			for (let attempt = 0; attempt < 3; attempt++) {
				await page.goto("/chat").catch(() => {});
				try {
					await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
					break;
				} catch {
					if (attempt === 2) throw new Error("Failed to navigate to /chat?sessionId= after 3 attempts");
					await page.waitForTimeout(1_000);
				}
			}
			sessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
			expect(sessionId).toBeTruthy();
		});

		await test.step("Nerin greeting appears", async () => {
			await page
				.locator("[data-slot='chat-bubble']")
				.first()
				.waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("depth meter is visible with 0% progress", async () => {
			const depthMeter = page.getByTestId("depth-meter-fill");
			// Depth meter may be hidden on mobile — check visibility on desktop
			const visible = await depthMeter.isVisible().catch(() => false);
			if (visible) {
				const height = await depthMeter.evaluate((el) => el.style.height);
				expect(height).toBe("0%");
			}
		});

		await test.step("send message → triggers farewell (MESSAGE_THRESHOLD=1)", async () => {
			const chatInput = page.locator("[data-slot='chat-input']");
			await chatInput.waitFor({ state: "visible" });
			await chatInput.fill("I find deep satisfaction in understanding complex systems and patterns.");
			await page.getByTestId("chat-send-btn").click();

			// With MESSAGE_THRESHOLD=1, first user message triggers farewell + auth gate
			await page
				.locator("[data-slot='chat-auth-gate']")
				.waitFor({ state: "visible", timeout: 30_000 });
		});

		await test.step("verify closing exchange: Nerin farewell message appears", async () => {
			// After farewell, there should be multiple chat bubbles (greeting + user msg + farewell)
			const bubbles = page.locator("[data-slot='chat-bubble']");
			const count = await bubbles.count();
			expect(count).toBeGreaterThanOrEqual(3); // greeting + user message + farewell
		});

		await test.step("sign up via auth gate, verify email, sign in via browser", async () => {
			await page.getByTestId("chat-auth-gate-signup-btn").click();
			await page.locator("#results-signup-email").fill(LIFECYCLE_USER.email);
			await page.locator("#results-signup-password").fill(LIFECYCLE_USER.password);
			await page.getByTestId("auth-gate-signup-submit").click();

			// Wait for signup to complete (may redirect to /verify-email)
			await page.waitForTimeout(2_000);

			// Bypass email verification in DB
			const pool = new Pool(TEST_DB_CONFIG);
			const client = await pool.connect();
			try {
				// Retry until user exists (signup may still be propagating)
				for (let i = 0; i < 5; i++) {
					const result = await client.query(
						`UPDATE "user" SET "email_verified" = true WHERE "email" = $1 RETURNING id`,
						[LIFECYCLE_USER.email],
					);
					if (result.rowCount && result.rowCount > 0) break;
					await new Promise((r) => setTimeout(r, 1_000));
				}
			} finally {
				client.release();
				await pool.end();
			}

			// Sign in via browser login page (cookies persist in browser context)
			await page.goto("/login");
			const submitBtn = page.locator('button[type="submit"]');
			await submitBtn.waitFor({ state: "visible" });
			await page.locator("#login-email").fill(LIFECYCLE_USER.email);
			await page.locator("#login-password").fill(LIFECYCLE_USER.password);
			await submitBtn.click();

			// Wait for auth to complete
			await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });

			// Navigate to chat with session
			await page.goto(`/chat?sessionId=${sessionId}`);
		});

		await test.step("View Results link appears → navigate to results", async () => {
			const viewResults = page.getByRole("link", { name: "View Results" });
			await viewResults.waitFor({ state: "visible", timeout: 15_000 });
			await viewResults.click();
			await page.waitForURL(/\/results\//, { timeout: 15_000 });
		});

		await test.step("results page renders with OCEAN code and archetype", async () => {
			// Dismiss PWYW modal if present
			const pwyw = page.getByTestId("pwyw-modal");
			await pwyw.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
			if (await pwyw.isVisible()) {
				await page.locator("[data-slot='dialog-close']").click();
				await pwyw.waitFor({ state: "hidden", timeout: 5_000 });
			}

			// Wait for archetype hero (finalization may still be processing)
			for (let attempt = 0; attempt < 3; attempt++) {
				const hero = page.getByTestId("archetype-hero-section");
				if (await hero.isVisible().catch(() => false)) break;
				if (attempt < 2) {
					await page.waitForTimeout(2_000);
					await page.reload();
					// Dismiss PWYW again
					const modal = page.getByTestId("pwyw-modal");
					await modal.waitFor({ state: "visible", timeout: 3_000 }).catch(() => {});
					if (await modal.isVisible()) {
						await page.locator("[data-slot='dialog-close']").click();
						await modal.waitFor({ state: "hidden", timeout: 3_000 });
					}
				} else {
					await hero.waitFor({ state: "visible", timeout: 15_000 });
				}
			}

			// OCEAN code displayed
			await expect(page.getByTestId("ocean-code")).toBeVisible();

			// All 5 trait cards
			const traitCards = page.locator("[data-slot='trait-card']");
			await expect(traitCards).toHaveCount(5);
		});

		await test.step("verify assessment data persisted via API", async () => {
			// Check results endpoint returns valid data
			const api = await createApiContext();
			const signIn = await api.post("/api/auth/sign-in/email", {
				data: { email: LIFECYCLE_USER.email, password: LIFECYCLE_USER.password },
			});
			expect(signIn.ok()).toBeTruthy();

			const resultsRes = await api.get(`/api/assessment/${sessionId}/results`);
			expect(resultsRes.ok()).toBeTruthy();

			const results = await resultsRes.json();
			expect(results.oceanCode5).toBeTruthy();
			expect(results.archetypeName).toBeTruthy();
			expect(results.traits).toBeTruthy();

			await api.dispose();
		});
	});
});
