import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { AUTH_FILES } from "../../e2e-env.js";

let testSessionId: string;

test.beforeAll(() => {
	const data = JSON.parse(readFileSync(AUTH_FILES.testSession, "utf-8")) as {
		sessionId: string;
	};
	testSessionId = data.sessionId;
});

test.describe("owner access granted", () => {
	test("results page shows archetype hero section", async ({ page }) => {
		await page.goto(`/results/${testSessionId}`);
		await page.locator("[data-slot='archetype-hero-section']").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	test("chat resume loads existing conversation or shows completed state", async ({ page }) => {
		await page.goto(`/chat?sessionId=${testSessionId}`);

		// Session may be completed (messageCount >= threshold) → portrait wait screen or chat bubbles
		const chatBubble = page.locator("[data-slot='chat-bubble']").first();
		const portraitWait = page.locator("[data-slot='portrait-wait-screen']");

		await expect(chatBubble.or(portraitWait)).toBeVisible({ timeout: 15_000 });

		// URL should still reference the same sessionId
		const currentSessionId = new URL(page.url()).searchParams.get("sessionId");
		expect(currentSessionId).toBe(testSessionId);
	});
});
