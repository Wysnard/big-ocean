import { expect } from "@playwright/test";
import { test } from "../../fixtures/env.fixture.js";

test.describe("other-user access denial", () => {
	test("results page shows not-found for other user's session @critical", async ({
		page,
		testSessionId,
	}) => {
		await test.step("navigate to other user's results page", async () => {
			await page.goto(`/me/${testSessionId}`);
		});

		await test.step("verify not-found message is displayed", async () => {
			// NotFound component renders with data-testid="not-found-page"
			await expect(page.getByTestId("not-found-page")).toBeVisible({
				timeout: 15_000,
			});
		});
	});

	test("chat resume shows not-found for other user's session @critical", async ({
		page,
		testSessionId,
	}) => {
		await test.step("navigate to other user's chat session", async () => {
			await page.goto(`/chat?sessionId=${testSessionId}`);
		});

		await test.step("verify not-found message is displayed", async () => {
			// NotFound component renders with data-testid="not-found-page"
			await expect(page.getByTestId("not-found-page")).toBeVisible({
				timeout: 15_000,
			});
		});
	});
});
