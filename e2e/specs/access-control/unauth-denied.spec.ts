import { test } from "../../fixtures/env.fixture.js";

test.describe("unauthenticated access denial", () => {
	test("results page shows auth gate instead of results @critical", async ({
		page,
		testSessionId,
	}) => {
		await test.step("navigate to results page while unauthenticated", async () => {
			await page.goto(`/results/${testSessionId}`);
		});

		await test.step("verify auth gate is displayed", async () => {
			await page
				.locator("[data-slot='results-auth-gate']")
				.waitFor({ state: "visible", timeout: 10_000 });
		});
	});

	test("chat resume redirects unauth to login @critical", async ({ page, testSessionId }) => {
		await test.step("navigate to chat while unauthenticated", async () => {
			await page.goto(`/chat?sessionId=${testSessionId}`);
		});

		await test.step("verify redirect to login page", async () => {
			await page.waitForURL(/\/login/, { timeout: 15_000 });
		});
	});
});
