/**
 * Golden Path with Evidence Highlighting
 *
 * Landing → Chat → Farewell → Auth Gate Sign-up → Finalization → Results
 * → Seed evidence → Reload → Evidence Highlighting (trait → facet → evidence → transcript)
 * → Close transcript → Verify results page intact
 *
 * Extends the core golden path to verify evidence highlighting navigation
 * round-trips correctly from results → transcript → back to results.
 *
 * The mock LLM pipeline does not generate evidence data, so we seed it via
 * direct DB inserts after finalization completes, then reload the results page.
 */

import type { EvidenceSeed } from "../fixtures/db.js";
import { expect, test } from "../fixtures/db.js";

const MESSAGE_CONTENT =
	"I really enjoy exploring new ideas and reading about philosophy and science.";

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

test("golden path with evidence: landing → chat → signup → results → evidence → back to results", async ({
	page,
	db,
}) => {
	test.setTimeout(120_000);

	// ── Landing ──────────────────────────────────────────────────────────

	await test.step("navigate to landing page", async () => {
		await page.goto("/");
		await page.locator("[data-slot='hero-section']").waitFor({ state: "visible" });
		await expect(page.getByTestId("hero-cta")).toBeVisible();
	});

	// ── Chat session ─────────────────────────────────────────────────────

	await test.step("navigate to /chat and create session", async () => {
		for (let attempt = 0; attempt < 3; attempt++) {
			await page.goto("/chat").catch(() => {});
			try {
				await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
				break;
			} catch {
				if (attempt === 2) throw new Error("Failed to navigate to /chat?sessionId= after 3 attempts");
				await page.waitForTimeout(1_000);
			}
		}
	});

	const sessionId = new URL(page.url()).searchParams.get("sessionId") ?? "";
	expect(sessionId).toBeTruthy();

	await test.step("wait for Nerin greeting", async () => {
		await page.locator("[data-slot='chat-bubble']").first().waitFor({ state: "visible" });
	});

	await test.step("send message to trigger farewell", async () => {
		const chatInput = page.locator("[data-slot='chat-input']");
		await chatInput.waitFor({ state: "visible" });
		await chatInput.fill("I love exploring new ideas and creative projects.");
		await page.getByTestId("chat-send-btn").click();

		await page.locator("[data-slot='chat-auth-gate']").waitFor({
			state: "visible",
			timeout: 30_000,
		});
	});

	// ── Auth gate sign-up ────────────────────────────────────────────────

	await test.step("sign up via auth gate", async () => {
		await page.getByTestId("chat-auth-gate-signup-btn").click();
		await page.locator("#results-signup-email").fill("e2e-golden-evidence@test.bigocean.dev");
		await page.locator("#results-signup-password").fill("OceanDepth#Nerin42xQ");
		await page.getByTestId("auth-gate-signup-submit").click();
	});

	// ── Finalization → Results ───────────────────────────────────────────

	await test.step("finalization → auto-redirect to results", async () => {
		await Promise.race([
			page.locator("[data-slot='finalization-wait-screen']").waitFor({
				state: "visible",
				timeout: 15_000,
			}),
			page.waitForURL(/\/results\//, { timeout: 15_000 }),
		]);

		if (!page.url().includes("/results/")) {
			await page.waitForURL(/\/results\//, { timeout: 30_000 });
		}
	});

	await test.step("verify results page loaded", async () => {
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
		await page.locator("[data-slot='profile-view']").waitFor({ state: "visible" });

		const traitCards = page.locator("[data-slot='trait-card']");
		await expect(traitCards).toHaveCount(5);
	});

	// ── Seed evidence data and reload ────────────────────────────────────

	// Extract the assessment session ID from the results URL
	const resultsSessionId = page.url().match(/\/results\/([^/?]+)/)?.[1] ?? "";
	expect(resultsSessionId).toBeTruthy();

	await test.step("seed evidence data into DB and reload results", async () => {
		await db.seedEvidenceData(resultsSessionId, buildEvidenceSeeds());
		await page.reload();
		await page.getByTestId("archetype-hero-section").waitFor({
			state: "visible",
			timeout: 15_000,
		});
	});

	// ── Evidence highlighting: trait → facet → evidence → transcript ────

	await test.step("click Openness trait card to open detail zone", async () => {
		const traitCard = page.locator("[data-slot='trait-card'][data-trait='openness']");
		await traitCard.waitFor({ state: "visible", timeout: 10_000 });
		await traitCard.click();

		await page
			.locator("[data-slot='detail-zone'][data-trait='openness']")
			.waitFor({ state: "visible", timeout: 10_000 });
	});

	await test.step("click Imagination facet card to open evidence panel", async () => {
		const facetCard = page.locator("[data-slot='facet-detail-card'][data-facet='imagination']");
		await facetCard.waitFor({ state: "visible", timeout: 10_000 });
		await facetCard.click();

		await page.getByTestId("evidence-panel").waitFor({
			state: "visible",
			timeout: 10_000,
		});

		// The seeded quote should be visible
		await expect(page.getByTestId("evidence-panel")).toContainText("exploring new ideas");
	});

	await test.step("click Jump to Message to open transcript", async () => {
		const jumpBtn = page.getByTestId("jump-to-message").first();
		await jumpBtn.waitFor({ state: "visible", timeout: 10_000 });
		await jumpBtn.scrollIntoViewIfNeeded();
		await jumpBtn.click({ force: true });

		// Transcript panel should slide in
		await page.getByTestId("transcript-panel").waitFor({
			state: "visible",
			timeout: 10_000,
		});

		// Verify transcript content is visible
		const transcript = page.getByTestId("conversation-transcript");
		await transcript.waitFor({ state: "visible", timeout: 10_000 });
		await expect(transcript).toContainText(MESSAGE_CONTENT);

		// Highlighted text should be present
		await expect(page.getByTestId("highlighted-text")).toBeVisible({ timeout: 10_000 });
	});

	// ── Navigate back to results ─────────────────────────────────────────

	await test.step("close transcript and verify results page is intact", async () => {
		// Close the transcript panel via the close button
		await page.getByLabel("Close transcript").click();

		// Transcript panel should be hidden
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
