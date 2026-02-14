import { readFileSync } from "node:fs";
import { test } from "@playwright/test";
import { AUTH_FILES } from "../../e2e-env.js";

let testSessionId: string;

test.beforeAll(() => {
	const data = JSON.parse(readFileSync(AUTH_FILES.testSession, "utf-8")) as {
		sessionId: string;
	};
	testSessionId = data.sessionId;
});

test.describe("other-user access denial", () => {
	test("results page redirects to 404", async ({ page }) => {
		await page.goto(`/results/${testSessionId}`);
		await page.waitForURL("**/404", { timeout: 10_000 });
	});

	test("chat resume redirects to 404", async ({ page }) => {
		await page.goto(`/chat?sessionId=${testSessionId}`);
		await page.waitForURL("**/404", { timeout: 10_000 });
	});
});
