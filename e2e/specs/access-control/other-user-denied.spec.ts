import { test } from "../../fixtures/env.fixture.js";

test.describe("other-user access denial", () => {
	test("results page redirects to 404", async ({ page, testSessionId }) => {
		await page.goto(`/results/${testSessionId}`);
		await page.waitForURL("**/404", { timeout: 10_000 });
	});

	test("chat resume redirects to 404", async ({ page, testSessionId }) => {
		await page.goto(`/chat?sessionId=${testSessionId}`);
		await page.waitForURL("**/404", { timeout: 10_000 });
	});
});
