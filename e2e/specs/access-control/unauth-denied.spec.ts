import { test } from "../../fixtures/env.fixture.js";

test.describe("unauthenticated access denial", () => {
	test("results page shows auth gate instead of results", async ({ page, testSessionId }) => {
		await page.goto(`/results/${testSessionId}`);
		await page
			.locator("[data-slot='results-auth-gate']")
			.waitFor({ state: "visible", timeout: 10_000 });
	});

	test("chat resume redirects unauth to login", async ({ page, testSessionId }) => {
		await page.goto(`/chat?sessionId=${testSessionId}`);
		await page.waitForURL(/\/login/, { timeout: 15_000 });
	});
});
