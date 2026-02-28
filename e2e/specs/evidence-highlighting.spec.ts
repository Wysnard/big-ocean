/**
 * Evidence Highlighting E2E Tests (Story 12.2)
 *
 * Verifies the bidirectional evidence highlighting flow:
 * 1. Authed user navigates to results page
 * 2. Clicks a trait card → detail zone opens
 * 3. Clicks a facet card → evidence panel opens with quotes
 * 4. Clicks "Jump to Message" → transcript panel slides in with highlighted text
 */

import { type EvidenceSeed, expect, highConfidenceProfile, test } from "../fixtures/db.js";

const MESSAGE_CONTENT =
	"I really enjoy exploring new ideas and reading about philosophy and science.";

/** Evidence seed data — one facet_evidence row for "imagination" (openness trait) */
function buildEvidenceSeeds(): EvidenceSeed[] {
	return [
		{
			messageId: "msg-1",
			messageContent: MESSAGE_CONTENT,
			messageRole: "user",
			facetName: "imagination",
			score: 16,
			confidence: 85,
			quote: "exploring new ideas",
			highlightStart: 15,
			highlightEnd: 34,
		},
	];
}

test.describe("evidence highlighting (Story 12.2)", () => {
	let sessionId: string;

	test.beforeEach(async ({ db, ownerUser }) => {
		// Look up the owner user ID so the session is linked (auth required for results)
		const userId = await db.getUserIdByEmail(ownerUser.email);
		if (!userId) throw new Error("Owner user not found — did global-setup run?");

		const profile = highConfidenceProfile();
		profile.userId = userId;
		sessionId = await db.seedResultsData(profile);
		await db.seedEvidenceData(sessionId, buildEvidenceSeeds());
	});

	test("trait → facet → evidence panel → jump to transcript message", async ({ page }) => {
		await test.step("navigate to results page", async () => {
			await page.goto(`/results/${sessionId}`);
			await page.getByTestId("archetype-hero-section").waitFor({
				state: "visible",
				timeout: 15_000,
			});
		});

		await test.step("click Openness trait card to open detail zone", async () => {
			const traitCard = page.locator("[data-slot='trait-card'][data-trait='openness']");
			await traitCard.waitFor({ state: "visible", timeout: 10_000 });
			await traitCard.click();

			// Detail zone should appear for openness
			await page
				.locator("[data-slot='detail-zone'][data-trait='openness']")
				.waitFor({ state: "visible", timeout: 10_000 });
		});

		await test.step("click Imagination facet card to open evidence panel", async () => {
			const facetCard = page.locator("[data-slot='facet-detail-card'][data-facet='imagination']");
			await facetCard.waitFor({ state: "visible", timeout: 10_000 });
			await facetCard.click();

			// Evidence panel should appear
			await page.getByTestId("evidence-panel").waitFor({
				state: "visible",
				timeout: 10_000,
			});

			// The seeded quote should be visible
			await expect(page.getByTestId("evidence-panel")).toContainText("exploring new ideas");
		});

		await test.step("click Jump to Message to open transcript panel", async () => {
			const jumpBtn = page.getByTestId("jump-to-message").first();
			await jumpBtn.waitFor({ state: "visible" });
			await jumpBtn.click();

			// Transcript panel should slide in
			await page.getByTestId("transcript-panel").waitFor({
				state: "visible",
				timeout: 10_000,
			});
		});

		await test.step("transcript shows the message with highlighted text", async () => {
			// The seeded message content should appear in the transcript
			const transcript = page.getByTestId("conversation-transcript");
			await transcript.waitFor({ state: "visible", timeout: 10_000 });
			await expect(transcript).toContainText(MESSAGE_CONTENT);

			// Highlighted text marker should be present
			await expect(page.getByTestId("highlighted-text")).toBeVisible();
		});

		await test.step("close transcript and verify results page is intact", async () => {
			await page.getByLabel("Close transcript").click();

			await page.getByTestId("transcript-panel").waitFor({
				state: "hidden",
				timeout: 10_000,
			});

			// Results page should still be on the same URL
			expect(page.url()).toContain("/results/");

			// Core results elements should still be visible
			await page.getByTestId("archetype-hero-section").waitFor({ state: "visible" });
			await page.locator("[data-slot='profile-view']").waitFor({ state: "visible" });
			await expect(page.locator("[data-slot='trait-card']")).toHaveCount(5);
		});
	});
});
