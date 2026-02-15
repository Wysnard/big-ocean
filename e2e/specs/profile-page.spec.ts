import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { AUTH_FILES } from "../e2e-env.js";

/**
 * Profile Page E2E Tests
 *
 * Two golden-path scenarios:
 * 1. Auth user without assessment → empty profile state
 * 2. Auth user with completed assessment → profile → results page
 *
 * The E2E Docker compose sets FREE_TIER_MESSAGE_THRESHOLD=2.
 * Global setup seeds 1 user message via seedSessionForResults and sends
 * a second via the API, so messageCount=2 → card shows "completed".
 */

function readTestSessionId(): string {
	const data = JSON.parse(readFileSync(AUTH_FILES.testSession, "utf-8")) as {
		sessionId: string;
	};
	return data.sessionId;
}

test.describe("profile page: auth user without assessment", () => {
	test.use({ storageState: AUTH_FILES.otherUser });

	test("home → header avatar → profile shows empty state", async ({ page }) => {
		await test.step("navigate to home page", async () => {
			await page.goto("/");
			await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
		});

		await test.step("click profile link in user nav dropdown", async () => {
			// Wait for auth to resolve — the avatar button (rounded-full) appears
			// only when the user is authenticated (not during loading skeleton)
			const avatarButton = page.locator("[data-slot='user-nav'] button.rounded-full");
			await avatarButton.waitFor({ state: "visible", timeout: 10_000 });
			await avatarButton.click();

			// Click the "Profile" link in the dropdown
			await page.getByRole("menuitem", { name: "Profile" }).click();
			await page.waitForURL(/\/profile\/?$/);
		});

		await test.step("verify empty dashboard state", async () => {
			await page.locator("[data-slot='empty-dashboard']").waitFor({
				state: "visible",
				timeout: 10_000,
			});
			// Verify the CTA to start assessment is present
			await expect(page.getByRole("link", { name: "Start Your Assessment" })).toBeVisible();
		});
	});
});

test.describe("profile page: auth user with completed assessment", () => {
	test.use({ storageState: AUTH_FILES.owner });

	test("profile shows assessment card → click View Results → results page", async ({ page }) => {
		const _testSessionId = readTestSessionId();

		await test.step("navigate to profile page", async () => {
			await page.goto("/profile");
			await page.locator("[data-slot='profile-page']").waitFor({
				state: "visible",
				timeout: 15_000,
			});
		});

		await test.step("verify assessment card is visible with completed status", async () => {
			await page.locator("[data-slot='assessment-card']").waitFor({
				state: "visible",
				timeout: 10_000,
			});
			await expect(
				page.locator("[data-slot='assessment-card'][data-status='completed']"),
			).toBeVisible();
			await expect(page.locator("[data-slot='status-badge']")).toContainText("Complete");
		});

		await test.step("click View Results and navigate to results page", async () => {
			await page.getByRole("link", { name: "View Results" }).click();
			await page.waitForURL(/\/results\//);
		});

		await test.step("verify results page renders archetype hero", async () => {
			await page.locator("[data-slot='archetype-hero-section']").waitFor({
				state: "visible",
				timeout: 15_000,
			});
		});
	});
});
