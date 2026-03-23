import { expect } from "@playwright/test";
import { test } from "../../fixtures/env.fixture.js";

test.describe("other-user access denial", () => {
	test("results page shows not-found for other user's session", async ({ page, testSessionId }) => {
		await page.goto(`/results/${testSessionId}`);
		// Route-level notFoundComponent renders "Assessment not found",
		// or the generic error component renders "not found" in the error message
		await expect(page.getByText("Assessment not found").or(page.getByText("not found"))).toBeVisible({
			timeout: 15_000,
		});
	});

	test("chat resume shows not-found for other user's session", async ({ page, testSessionId }) => {
		await page.goto(`/chat?sessionId=${testSessionId}`);
		// Session ownership check throws notFound() for unlinked sessions
		await expect(page.getByText("Lost at sea").or(page.getByText("Not Found"))).toBeVisible({
			timeout: 15_000,
		});
	});
});
