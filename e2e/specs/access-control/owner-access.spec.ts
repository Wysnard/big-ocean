import { expect, test } from "../../fixtures/env.fixture.js";

test.describe("owner access granted", () => {
	test("results page shows archetype hero section", async ({ page, testSessionId }) => {
		await page.goto(`/results/${testSessionId}`);
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	test("chat resume redirects completed session to results", async ({ page, testSessionId }) => {
		// Story 11.1: Completed sessions at /chat are redirected to /results
		await page.goto(`/chat?sessionId=${testSessionId}`);

		// Re-entry routing: completed session → redirect to /results/$sessionId
		await page.waitForURL(/\/results\//, { timeout: 15_000 });
		expect(page.url()).toContain(testSessionId);
	});
});
