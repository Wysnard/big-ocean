/**
 * E2E Tests: Bidirectional Evidence Highlighting (Story 5.3)
 *
 * Tests the complete evidence transparency flow:
 * - Profile → Evidence → Message (clicking facet score shows evidence, jumping to message)
 * - Message → Facets → Profile (clicking message shows contributing facets, navigating to results)
 * - Highlighting accuracy and color-coding
 * - Mobile responsiveness (touch targets ≥44px)
 * - Error states (no evidence, network failures)
 */

import {
	test,
	expect,
	highConfidenceProfile,
	type EvidenceSeed,
} from "./fixtures/db";

test.describe("Evidence Highlighting: Profile → Evidence → Message", () => {
	test("clicking facet score opens evidence panel with quotes", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		// Seed evidence for imagination facet
		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "I love exploring new ideas and creative projects.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "exploring new ideas and creative projects",
				highlightStart: 7,
				highlightEnd: 51,
			},
			{
				messageId: "msg-2",
				messageContent: "I enjoy daydreaming about future possibilities.",
				messageRole: "user",
				facetName: "imagination",
				score: 16,
				confidence: 80,
				quote: "daydreaming about future possibilities",
				highlightStart: 8,
				highlightEnd: 46,
			},
			{
				messageId: "msg-3",
				messageContent: "I prefer practical solutions over creative ones.",
				messageRole: "user",
				facetName: "imagination",
				score: 6,
				confidence: 70,
				quote: "prefer practical solutions over creative ones",
				highlightStart: 2,
				highlightEnd: 48,
			},
		];

		await db.seedEvidenceData(sessionId, evidence);

		// Navigate to results page
		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		// Expand Openness trait to see facets
		await page.getByTestId("trait-bar-openness").click();

		// Click "View Evidence" button for imagination facet
		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Evidence panel should open
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText(/Evidence for imagination/i)).toBeVisible();

		// Should show all 3 evidence items
		await expect(page.getByText("exploring new ideas and creative projects")).toBeVisible();
		await expect(page.getByText("daydreaming about future possibilities")).toBeVisible();
		await expect(page.getByText("prefer practical solutions over creative ones")).toBeVisible();

		// Verify score displays
		await expect(page.getByText("18/20")).toBeVisible();
		await expect(page.getByText("16/20")).toBeVisible();
		await expect(page.getByText("6/20")).toBeVisible();

		// Verify confidence displays
		await expect(page.getByText("85% confident")).toBeVisible();
		await expect(page.getByText("80% confident")).toBeVisible();
		await expect(page.getByText("70% confident")).toBeVisible();
	});

	test("evidence items are color-coded by score (green/yellow/red)", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "High score evidence.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 90,
				quote: "High score evidence",
				highlightStart: 0,
				highlightEnd: 19,
			},
			{
				messageId: "msg-2",
				messageContent: "Moderate score evidence.",
				messageRole: "user",
				facetName: "imagination",
				score: 12,
				confidence: 75,
				quote: "Moderate score evidence",
				highlightStart: 0,
				highlightEnd: 23,
			},
			{
				messageId: "msg-3",
				messageContent: "Low score evidence.",
				messageRole: "user",
				facetName: "imagination",
				score: 5,
				confidence: 60,
				quote: "Low score evidence",
				highlightStart: 0,
				highlightEnd: 18,
			},
		];

		await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		await page.getByTestId("trait-bar-openness").click();

		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Find evidence card containers
		const highScoreCard = page
			.locator("div")
			.filter({ hasText: "High score evidence" })
			.filter({ has: page.locator("text=18/20") });
		const moderateScoreCard = page
			.locator("div")
			.filter({ hasText: "Moderate score evidence" })
			.filter({ has: page.locator("text=12/20") });
		const lowScoreCard = page
			.locator("div")
			.filter({ hasText: "Low score evidence" })
			.filter({ has: page.locator("text=5/20") });

		// Verify color classes (score >= 15: green, 8-14: yellow, <8: red)
		await expect(highScoreCard).toHaveClass(/bg-green-500\/20/);
		await expect(moderateScoreCard).toHaveClass(/bg-yellow-500\/20/);
		await expect(lowScoreCard).toHaveClass(/bg-red-500\/20/);
	});

	test("clicking Jump to Message navigates to chat with highlighting", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "I love exploring new ideas and creative projects.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "exploring new ideas",
				highlightStart: 7,
				highlightEnd: 26,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		await page.getByTestId("trait-bar-openness").click();

		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Click "Jump to Message" button
		const jumpBtn = page.getByRole("button", { name: /Jump to Message/i }).first();
		await jumpBtn.click();

		// Should navigate to chat route with highlight params
		await page.waitForURL(/\/chat/);
		expect(page.url()).toContain(`sessionId=${sessionId}`);
		expect(page.url()).toContain(`highlightMessageId=${messageIds[0]}`);
		expect(page.url()).toContain("highlightStart=7");
		expect(page.url()).toContain("highlightEnd=26");

		// Message should be highlighted
		const mark = page.locator("mark").first();
		await expect(mark).toBeVisible({ timeout: 5000 });
		await expect(mark).toHaveText("exploring new ideas");

		// Highlight should have green color (strong signal)
		await expect(mark).toHaveClass(/bg-green-400\/30/);
	});

	test("no evidence shows empty state", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		// Don't seed any evidence - test empty state

		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		await page.getByTestId("trait-bar-openness").click();

		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Panel should open but show no evidence
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText(/Evidence for imagination/i)).toBeVisible();

		// Should show empty state or no evidence items
		const evidenceItems = page.getByRole("button", { name: /Jump to Message/i });
		await expect(evidenceItems).toHaveCount(0);
	});
});

test.describe("Evidence Highlighting: Message → Facets → Profile", () => {
	test("clicking message opens facet side panel", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "I love helping others and being kind.",
				messageRole: "user",
				facetName: "altruism",
				score: 18,
				confidence: 85,
				quote: "helping others and being kind",
				highlightStart: 7,
				highlightEnd: 37,
			},
			{
				messageId: "msg-1",
				messageContent: "I love helping others and being kind.",
				messageRole: "user",
				facetName: "sympathy",
				score: 16,
				confidence: 80,
				quote: "helping others",
				highlightStart: 7,
				highlightEnd: 21,
			},
			{
				messageId: "msg-1",
				messageContent: "I love helping others and being kind.",
				messageRole: "user",
				facetName: "trust",
				score: 14,
				confidence: 75,
				quote: "being kind",
				highlightStart: 27,
				highlightEnd: 37,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/chat?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		// Click on the user message
		const messageDiv = page.locator(`[data-message-id="${messageIds[0]}"]`);
		await messageDiv.click();

		// Facet side panel should open
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText(/This message contributed to/i)).toBeVisible();

		// Should show all 3 facets
		await expect(page.getByText("altruism")).toBeVisible();
		await expect(page.getByText("sympathy")).toBeVisible();
		await expect(page.getByText("trust")).toBeVisible();

		// Verify scores are displayed (sorted by score DESC)
		await expect(page.getByText("+18/20")).toBeVisible();
		await expect(page.getByText("+16/20")).toBeVisible();
		await expect(page.getByText("+14/20")).toBeVisible();
	});

	test("facets are sorted by score (highest first)", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "Test message.",
				messageRole: "user",
				facetName: "imagination",
				score: 10,
				confidence: 70,
				quote: "Test",
				highlightStart: 0,
				highlightEnd: 4,
			},
			{
				messageId: "msg-1",
				messageContent: "Test message.",
				messageRole: "user",
				facetName: "altruism",
				score: 19,
				confidence: 90,
				quote: "Test",
				highlightStart: 0,
				highlightEnd: 4,
			},
			{
				messageId: "msg-1",
				messageContent: "Test message.",
				messageRole: "user",
				facetName: "intellect",
				score: 15,
				confidence: 80,
				quote: "Test",
				highlightStart: 0,
				highlightEnd: 4,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/chat?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		const messageDiv = page.locator(`[data-message-id="${messageIds[0]}"]`);
		await messageDiv.click();

		// Get all facet buttons in order
		const facetButtons = page.getByRole("dialog").locator("button");
		const facetTexts = await facetButtons.allTextContents();

		// First facet should be altruism (score 19)
		expect(facetTexts[0]).toContain("altruism");
		expect(facetTexts[0]).toContain("+19/20");

		// Second facet should be intellect (score 15)
		expect(facetTexts[1]).toContain("intellect");
		expect(facetTexts[1]).toContain("+15/20");

		// Third facet should be imagination (score 10)
		expect(facetTexts[2]).toContain("imagination");
		expect(facetTexts[2]).toContain("+10/20");
	});

	test("clicking facet navigates to results with scroll", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "I love helping others.",
				messageRole: "user",
				facetName: "altruism",
				score: 18,
				confidence: 85,
				quote: "helping others",
				highlightStart: 7,
				highlightEnd: 21,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/chat?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		const messageDiv = page.locator(`[data-message-id="${messageIds[0]}"]`);
		await messageDiv.click();

		// Click on altruism facet
		const facetButton = page.getByRole("dialog").getByText("altruism");
		await facetButton.click();

		// Should navigate to results page with scrollToFacet param
		await page.waitForURL(/\/results/);
		expect(page.url()).toContain(`sessionId=${sessionId}`);
		expect(page.url()).toContain("scrollToFacet=altruism");

		// Agreeableness trait should be expanded (altruism is an agreeableness facet)
		const facetBreakdown = page.getByTestId("facet-breakdown-agreeableness");
		await expect(facetBreakdown).toBeVisible({ timeout: 3000 });

		// Altruism facet should be visible and scrolled into view
		const altruismFacet = page.locator("#facet-altruism");
		await expect(altruismFacet).toBeVisible();
	});

	test("no facet evidence shows empty panel", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		// Seed a message with no evidence
		const evidence: EvidenceSeed[] = [];
		const { messageIds } = await db.seedEvidenceData(sessionId, [
			{
				messageId: "msg-empty",
				messageContent: "No evidence here.",
				messageRole: "user",
				facetName: "imagination",
				score: 0,
				confidence: 0,
				quote: "",
				highlightStart: 0,
				highlightEnd: 0,
			},
		]);

		// Delete the evidence (simulate message with no facets)
		// (db.seedEvidenceData will still create the message)

		await page.goto(`/chat?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		const messageDiv = page.locator(`[data-message-id="${messageIds[0]}"]`);
		await messageDiv.click();

		// Panel should open but show no facets
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText(/This message contributed to/i)).toBeVisible();

		// Should show empty state
		const facetButtons = page.getByRole("dialog").locator("button");
		await expect(facetButtons).toHaveCount(0);
	});
});

test.describe("Evidence Highlighting: Accuracy & Colors", () => {
	test("highlight range accurately highlights exact text", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent:
					"I absolutely love exploring new ideas and thinking creatively about problems.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "exploring new ideas and thinking creatively",
				highlightStart: 17,
				highlightEnd: 60,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(
			`/chat?sessionId=${sessionId}&highlightMessageId=${messageIds[0]}&highlightStart=17&highlightEnd=60`,
			{ waitUntil: "networkidle" },
		);

		// Message should be highlighted
		const mark = page.locator("mark").first();
		await expect(mark).toBeVisible({ timeout: 5000 });
		await expect(mark).toHaveText(
			"exploring new ideas and thinking creatively",
		);

		// Verify exact character range
		const messageText = await page
			.locator(`[data-message-id="${messageIds[0]}"]`)
			.textContent();
		expect(messageText?.slice(17, 60)).toBe(
			"exploring new ideas and thinking creatively",
		);
	});

	test("multiple messages can be displayed with one highlighted", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "First message with no highlight.",
				messageRole: "user",
				facetName: "imagination",
				score: 10,
				confidence: 70,
				quote: "First",
				highlightStart: 0,
				highlightEnd: 5,
			},
			{
				messageId: "msg-2",
				messageContent: "Second message with highlight here.",
				messageRole: "user",
				facetName: "imagination",
				score: 15,
				confidence: 80,
				quote: "highlight here",
				highlightStart: 20,
				highlightEnd: 34,
			},
			{
				messageId: "msg-3",
				messageContent: "Third message also no highlight.",
				messageRole: "user",
				facetName: "imagination",
				score: 12,
				confidence: 75,
				quote: "Third",
				highlightStart: 0,
				highlightEnd: 5,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		// Navigate with highlight for msg-2
		await page.goto(
			`/chat?sessionId=${sessionId}&highlightMessageId=${messageIds[1]}&highlightStart=20&highlightEnd=34`,
			{ waitUntil: "networkidle" },
		);

		// All 3 messages should be visible
		await expect(
			page.locator(`[data-message-id="${messageIds[0]}"]`),
		).toBeVisible();
		await expect(
			page.locator(`[data-message-id="${messageIds[1]}"]`),
		).toBeVisible();
		await expect(
			page.locator(`[data-message-id="${messageIds[2]}"]`),
		).toBeVisible();

		// Only msg-2 should have highlighting
		const marks = page.locator("mark");
		await expect(marks).toHaveCount(1);
		await expect(marks.first()).toHaveText("highlight here");

		// Verify highlighted message is scrolled into view
		const highlightedMessage = page.locator(
			`[data-message-id="${messageIds[1]}"]`,
		);
		await expect(highlightedMessage).toBeInViewport();
	});
});

test.describe("Evidence Highlighting: Mobile Responsiveness", () => {
	test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE dimensions

	test("touch targets are ≥44px for evidence items", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "Mobile test message.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "Mobile test",
				highlightStart: 0,
				highlightEnd: 11,
			},
		];

		await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		await page.getByTestId("trait-bar-openness").click();

		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Verify Jump to Message button is large enough for touch
		const jumpBtn = page.getByRole("button", { name: /Jump to Message/i }).first();
		const box = await jumpBtn.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});

	test("facet side panel touch targets are ≥44px", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "Mobile facet test.",
				messageRole: "user",
				facetName: "altruism",
				score: 18,
				confidence: 85,
				quote: "Mobile",
				highlightStart: 0,
				highlightEnd: 6,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/chat?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		const messageDiv = page.locator(`[data-message-id="${messageIds[0]}"]`);
		await messageDiv.click();

		// Verify facet button is large enough for touch
		const facetButton = page.getByRole("dialog").getByText("altruism");
		const box = await facetButton.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});

	test("evidence panel is responsive on mobile", async ({ page, db }) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "Mobile evidence test.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "Mobile evidence",
				highlightStart: 0,
				highlightEnd: 15,
			},
		];

		await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		await page.getByTestId("trait-bar-openness").click();

		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Panel should be visible and fit within viewport
		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		const dialogBox = await dialog.boundingBox();
		expect(dialogBox).not.toBeNull();
		expect(dialogBox!.width).toBeLessThanOrEqual(375); // Within mobile viewport
	});
});

test.describe("Evidence Highlighting: Error States", () => {
	test("handles network failure gracefully when fetching evidence", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		await page.goto(`/results?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		// Intercept evidence API call and simulate network failure
		await page.route("**/api/evidence/facet**", (route) => {
			route.abort("failed");
		});

		await page.getByTestId("trait-bar-openness").click();

		const viewEvidenceBtn = page
			.getByTestId("facet-item-Imagination")
			.getByRole("button", { name: /evidence/i });
		await viewEvidenceBtn.click();

		// Panel should still open
		await expect(page.getByRole("dialog")).toBeVisible();

		// Should show empty state or error message (no crash)
		const evidenceItems = page.getByRole("button", { name: /Jump to Message/i });
		await expect(evidenceItems).toHaveCount(0);
	});

	test("handles message evidence network failure gracefully", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "Network test message.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "Network test",
				highlightStart: 0,
				highlightEnd: 12,
			},
		];

		const { messageIds } = await db.seedEvidenceData(sessionId, evidence);

		await page.goto(`/chat?sessionId=${sessionId}`, {
			waitUntil: "networkidle",
		});

		// Intercept message evidence API call and simulate network failure
		await page.route("**/api/evidence/message/**", (route) => {
			route.abort("failed");
		});

		const messageDiv = page.locator(`[data-message-id="${messageIds[0]}"]`);
		await messageDiv.click();

		// Panel should still open
		await expect(page.getByRole("dialog")).toBeVisible();

		// Should show empty state (no crash)
		const facetButtons = page.getByRole("dialog").locator("button");
		await expect(facetButtons).toHaveCount(0);
	});

	test("invalid session ID shows error page", async ({ page }) => {
		await page.goto("/results?sessionId=00000000-0000-0000-0000-000000000000", {
			waitUntil: "networkidle",
		});

		// Should show error state (from results page)
		await expect(page.getByText(/Could Not Load Results/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test("invalid message ID in highlight params shows message normally", async ({
		page,
		db,
	}) => {
		const sessionId = await db.seedResultsData(highConfidenceProfile());

		const evidence: EvidenceSeed[] = [
			{
				messageId: "msg-1",
				messageContent: "Valid message.",
				messageRole: "user",
				facetName: "imagination",
				score: 18,
				confidence: 85,
				quote: "Valid",
				highlightStart: 0,
				highlightEnd: 5,
			},
		];

		await db.seedEvidenceData(sessionId, evidence);

		// Navigate with invalid highlightMessageId
		await page.goto(
			`/chat?sessionId=${sessionId}&highlightMessageId=invalid-id&highlightStart=0&highlightEnd=5`,
			{ waitUntil: "networkidle" },
		);

		// Should not crash - messages should be visible without highlighting
		const messages = page.locator("[data-message-id]");
		await expect(messages).not.toHaveCount(0);

		// No highlighting should be present
		const marks = page.locator("mark");
		await expect(marks).toHaveCount(0);
	});
});
