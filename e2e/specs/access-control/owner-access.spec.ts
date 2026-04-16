import { expect, test } from "../../fixtures/env.fixture.js";

test.describe("owner access granted", () => {
	test("results page shows archetype hero section @critical", async ({ page, testSessionId }) => {
		await test.step("navigate to results page", async () => {
			await page.goto(`/me/${testSessionId}`);
		});

		await test.step("verify archetype hero section is visible", async () => {
			await page.getByTestId("archetype-hero-section").waitFor({
				state: "visible",
				timeout: 15_000,
			});
		});
	});

	test("chat resume shows Show me what you found → for completed session @critical", async ({
		page,
		testSessionId,
	}) => {
		await test.step("navigate to chat with completed session", async () => {
			await page.goto(`/chat?sessionId=${testSessionId}`);
		});

		await test.step("verify Show me what you found → link and navigate to results", async () => {
			const viewResultsLink = page.getByRole("link", { name: "Show me what you found →" });
			await viewResultsLink.waitFor({ state: "visible", timeout: 15_000 });
			await viewResultsLink.click();
			await page.waitForURL(/\/me\//, { timeout: 15_000 });
			expect(page.url()).toContain(testSessionId);
		});
	});
});
