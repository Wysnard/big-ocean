/**
 * Session Resume E2E Tests (P0-008)
 *
 * Verifies that a conversation session survives browser reload:
 * - User starts a session → page reload → session resumes
 * - Conversation messages persist after reload
 * - Session ID stays the same
 *
 * Note: With MESSAGE_THRESHOLD=1, the first message triggers farewell.
 * This test verifies resume BEFORE sending any user messages (mid-greeting).
 */

import { expect, test } from "@playwright/test";
import { signUpAndLoginViaBrowser } from "../utils/browser-auth.js";

test.describe("Session Resume", () => {
	test.setTimeout(60_000);

	test("@P0 browser reload mid-conversation preserves session", async ({ page }) => {
		let sessionId = "";

		await test.step("sign up and login", async () => {
			await signUpAndLoginViaBrowser(page, {
				email: `e2e-resume-reload+${Date.now()}@gmail.com`,
				password: "OceanDepth#Nerin42xQ",
			});
		});

		await test.step("navigate to /chat and create session", async () => {
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

		await test.step("verify chat input is available", async () => {
			await page.locator("[data-slot='chat-input']").waitFor({ state: "visible" });
		});

		await test.step("reload page — session should resume", async () => {
			await page.reload();
			await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });

			// Session ID should be the same
			const resumedSessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
			expect(resumedSessionId).toBe(sessionId);
		});

		await test.step("greeting still visible after reload", async () => {
			await page
				.locator("[data-slot='chat-bubble']")
				.first()
				.waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("chat input still available after reload", async () => {
			await page.locator("[data-slot='chat-input']").waitFor({ state: "visible" });
		});
	});

	test("@P0 navigate away and return via URL preserves session", async ({ page }) => {
		let sessionId = "";

		await test.step("sign up and login", async () => {
			await signUpAndLoginViaBrowser(page, {
				email: `e2e-resume-nav+${Date.now()}@gmail.com`,
				password: "OceanDepth#Nerin42xQ",
			});
		});

		await test.step("create session", async () => {
			for (let attempt = 0; attempt < 3; attempt++) {
				await page.goto("/chat").catch(() => {});
				try {
					await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
					break;
				} catch {
					if (attempt === 2) throw new Error("Failed to create session");
					await page.waitForTimeout(1_000);
				}
			}
			sessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
			expect(sessionId).toBeTruthy();

			// Wait for greeting
			await page
				.locator("[data-slot='chat-bubble']")
				.first()
				.waitFor({ state: "visible", timeout: 15_000 });
		});

		await test.step("navigate to homepage", async () => {
			await page.goto("/");
			await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
		});

		await test.step("navigate back to chat with session ID → resumes", async () => {
			await page.goto(`/chat?sessionId=${sessionId}`);
			await page
				.locator("[data-slot='chat-bubble']")
				.first()
				.waitFor({ state: "visible", timeout: 15_000 });

			// Session ID preserved in URL
			const currentSessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
			expect(currentSessionId).toBe(sessionId);

			// Chat input still available
			await page.locator("[data-slot='chat-input']").waitFor({ state: "visible" });
		});
	});
});
