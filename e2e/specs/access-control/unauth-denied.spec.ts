import { expect, test } from "../../fixtures/env.fixture.js";

test.describe("unauthenticated access denial", () => {
	test("results page shows auth gate instead of results", async ({ page, testSessionId }) => {
		await page.goto(`/results/${testSessionId}`);
		await page
			.locator("[data-slot='results-auth-gate']")
			.waitFor({ state: "visible", timeout: 10_000 });
	});

	test("chat resume denies unauth access to linked session", async ({ page, testSessionId }) => {
		// Intercept the resume API call to verify 404 access denial
		const resumePromise = page.waitForResponse(
			(response) => response.url().includes(`${testSessionId}/resume`),
			{ timeout: 15_000 },
		);

		await page.goto(`/chat?sessionId=${testSessionId}`);

		const resumeResponse = await resumePromise;
		expect(resumeResponse.status()).toBe(404);
	});
});
