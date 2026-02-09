/**
 * E2E Tests: Assessment Results Page (/results/{sessionId})
 *
 * Seeds PostgreSQL directly with assessment data and verifies the results page
 * renders correctly for different personality profiles.
 */

import {
	test,
	expect,
	highConfidenceProfile,
	lowConfidenceProfile,
	mixedLevelsProfile,
} from "./fixtures/db";

test.describe("Assessment Results Page", () => {
	test("curated archetype displays correctly (high confidence)", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		await page.goto(`/results/${sessionId}`, { waitUntil: "networkidle" });

		// Archetype card
		await expect(page.getByTestId("archetype-name")).toHaveText("The Idealist");
		await expect(page.getByTestId("ocean-code-4")).toHaveText("HHHH");
		await expect(page.getByTestId("ocean-code-5")).toHaveText("HHHHH");
		await expect(page.getByTestId("curated-badge")).toBeVisible();
		await expect(page.getByTestId("confidence-indicator")).toContainText("80");

		// No low-confidence banner (confidence=80 > 50)
		await expect(page.getByTestId("low-confidence-banner")).not.toBeVisible();

		// All 5 traits show "High"
		for (const trait of [
			"openness",
			"conscientiousness",
			"extraversion",
			"agreeableness",
			"neuroticism",
		]) {
			await expect(page.getByTestId(`trait-level-${trait}`)).toHaveText("High");
		}
	});

	test("low confidence shows banner with continue link", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(lowConfidenceProfile());

		await page.goto(`/results/${sessionId}`, { waitUntil: "networkidle" });

		// Low-confidence banner visible (confidence=30 < 50)
		await expect(page.getByTestId("low-confidence-banner")).toBeVisible();

		// "Continue Assessment" links to /chat with sessionId
		const continueBtn = page.getByTestId("continue-assessment-btn");
		await expect(continueBtn).toBeVisible();
		await expect(continueBtn).toHaveAttribute("href", expect.stringContaining("/chat"));
		await expect(continueBtn).toHaveAttribute("href", expect.stringContaining(sessionId));

		// Confidence indicator shows 30
		await expect(page.getByTestId("confidence-indicator")).toContainText("30");

		// Archetype: "The Centered Moderate" (MMMM)
		await expect(page.getByTestId("archetype-name")).toHaveText("The Centered Moderate");
		await expect(page.getByTestId("ocean-code-4")).toHaveText("MMMM");
	});

	test("mixed trait levels render correctly", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(mixedLevelsProfile());

		await page.goto(`/results/${sessionId}`, { waitUntil: "networkidle" });

		// Archetype: "The Creative Diplomat" (HHMH)
		await expect(page.getByTestId("archetype-name")).toHaveText("The Creative Diplomat");
		await expect(page.getByTestId("ocean-code-4")).toHaveText("HHMH");
		await expect(page.getByTestId("ocean-code-5")).toHaveText("HHMHL");

		// Verify individual trait levels
		await expect(page.getByTestId("trait-level-openness")).toHaveText("High");
		await expect(page.getByTestId("trait-level-conscientiousness")).toHaveText("High");
		await expect(page.getByTestId("trait-level-extraversion")).toHaveText("Mid");
		await expect(page.getByTestId("trait-level-agreeableness")).toHaveText("High");
		await expect(page.getByTestId("trait-level-neuroticism")).toHaveText("Low");

		// Confidence indicator shows 68
		await expect(page.getByTestId("confidence-indicator")).toContainText("68");

		// No low-confidence banner (68 > 50)
		await expect(page.getByTestId("low-confidence-banner")).not.toBeVisible();
	});

	test("facet breakdown expand/collapse", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		await page.goto(`/results/${sessionId}`, { waitUntil: "networkidle" });

		// Click Openness trait bar to expand
		await page.getByTestId("trait-bar-openness").click();

		// Facet breakdown should be visible
		const facetBreakdown = page.getByTestId("facet-breakdown-openness");
		await expect(facetBreakdown).toBeVisible();

		// 6 openness facets visible
		const opennessDisplayFacets = [
			"Imagination",
			"Artistic Interests",
			"Emotionality",
			"Adventurousness",
			"Intellect",
			"Liberalism",
		];

		for (const facetName of opennessDisplayFacets) {
			const facetItem = page.getByTestId(`facet-item-${facetName}`);
			await expect(facetItem).toBeVisible();
			// Score is 15/20
			await expect(facetItem).toContainText("15/20");
			// High-score star visible (score=15 >= 15)
			await expect(page.getByTestId(`facet-highlight-${facetName}`)).toBeVisible();
		}

		// Click again to collapse
		await page.getByTestId("trait-bar-openness").click();
		await expect(facetBreakdown).not.toBeVisible();
	});

	test("non-existent session shows error", async ({ page }) => {
		await page.goto("/results/00000000-0000-0000-0000-000000000000", {
			waitUntil: "networkidle",
		});

		await expect(page.getByText("Session not found")).toBeVisible({ timeout: 10000 });
		const homeLink = page.getByRole("link", { name: /back to home/i });
		await expect(homeLink).toBeVisible();
		await expect(homeLink).toHaveAttribute("href", "/");
	});
});
