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

test.describe("unauthenticated access denial", () => {
	test("results page shows auth gate instead of results", async ({ page }) => {
		await page.goto(`/results/${testSessionId}`);
		await page
			.locator("[data-slot='results-auth-gate']")
			.waitFor({ state: "visible", timeout: 10_000 });
	});

	test("chat resume shows session-not-found error", async ({ page }) => {
		await page.goto(`/chat?sessionId=${testSessionId}`);

		// Resume fails → inline error message appears (no auto-redirect for unauth users)
		await expect(page.getByText("Session not found")).toBeVisible({ timeout: 30_000 });
		await expect(page.getByText("Start New Assessment")).toBeVisible();
	});
});
