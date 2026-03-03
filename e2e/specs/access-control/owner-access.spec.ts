import { expect, test } from "../../fixtures/env.fixture.js";

test.describe("owner access granted", () => {
	test("results page shows archetype hero section", async ({ page, testSessionId }) => {
		await page.goto(`/results/${testSessionId}`);
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	test("chat resume shows View Results for completed session", async ({ page, testSessionId }) => {
		// Completed sessions at /chat show a "View Results" link
		await page.goto(`/chat?sessionId=${testSessionId}`);

		const viewResultsLink = page.getByRole("link", { name: "View Results" });
		await viewResultsLink.waitFor({ state: "visible", timeout: 15_000 });
		await viewResultsLink.click();
		await page.waitForURL(/\/results\//, { timeout: 15_000 });
		expect(page.url()).toContain(testSessionId);
	});
});
