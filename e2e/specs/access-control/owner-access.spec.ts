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

	test("chat resume redirects completed session to results", async ({ page }) => {
		// Story 11.1: Completed sessions at /chat are redirected to /results
		await page.goto(`/chat?sessionId=${testSessionId}`);

		// Re-entry routing: completed session → redirect to /results/$sessionId
		await page.waitForURL(/\/results\//, { timeout: 15_000 });
		expect(page.url()).toContain(testSessionId);
	});
});
