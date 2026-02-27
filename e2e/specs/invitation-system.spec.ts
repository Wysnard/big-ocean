/**
 * Invitation System E2E Tests (Story 14.2)
 *
 * Browser-driven tests that exercise the invitation UI flow:
 * - Create invitation via the results page UI
 * - Verify bottom sheet with QR code and copy link
 * - Verify sent invitations list
 * - Verify 0-credits state hides invite button
 */

import { execSync } from "node:child_process";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/assessment.factory.js";
import { createUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";

const INVITE_USER = {
	email: `e2e-invite-${Date.now()}@test.bigocean.dev`,
	password: "OceanDepth#Nerin42xQ",
	name: "Invitation Tester",
} as const;

const PERSONAL_MESSAGE = "Let's compare personalities!";

test.describe
	.serial("Invitation System", () => {
		test.setTimeout(60_000);

		const todayKey = new Date().toISOString().slice(0, 10);
		const redisKey = `global_assessments:${todayKey}`;

		let sessionId: string;

		test.beforeAll(() => {
			execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
		});

		test("create invitation, verify sheet, copy link, check list", async ({ page, apiContext }) => {
			// ── Setup: create user with completed assessment ──
			await test.step("seed user with completed assessment", async () => {
				sessionId = await createAssessmentSession(apiContext);
				await createUser(apiContext, {
					...INVITE_USER,
					anonymousSessionId: sessionId,
				});

				const linkedUserId = await getSessionUserId(sessionId);
				if (!linkedUserId) {
					const user = await getUserByEmail(INVITE_USER.email);
					if (user) await linkSessionToUser(sessionId, user.id);
				}

				try {
					await seedSessionForResults(sessionId);
				} catch (err) {
					console.warn(
						`[invitation-system] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
					);
				}
			});

			await test.step("transfer auth cookies to browser", async () => {
				const storageState = await apiContext.storageState();
				await page.context().addCookies(storageState.cookies);
			});

			// ── Navigate to results page ──
			await test.step("navigate to results page", async () => {
				await page.goto(`/results/${sessionId}`);
				await page.waitForLoadState("networkidle");

				const creditsSection = page.getByTestId("relationship-credits-section");
				await expect(creditsSection).toBeVisible({ timeout: 15_000 });
			});

			// ── Create invitation via UI ──
			await test.step("create invitation via UI", async () => {
				await page.getByTestId("invite-button").click();
				await page.getByTestId("personal-message-input").fill(PERSONAL_MESSAGE);
				await page.getByTestId("send-invitation-button").click();
			});

			// ── Verify bottom sheet with QR code ──
			await test.step("verify invitation bottom sheet", async () => {
				const sheet = page.getByTestId("invitation-bottom-sheet");
				await expect(sheet).toBeVisible({ timeout: 10_000 });

				const qrCode = page.getByTestId("qr-code");
				await expect(qrCode).toBeVisible();
				// QR code renders as SVG
				await expect(qrCode.locator("svg")).toBeAttached();

				await expect(page.getByTestId("copy-link-button")).toBeVisible();
			});

			// ── Copy link and verify format ──
			await test.step("copy link and verify format", async () => {
				await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
				await page.getByTestId("copy-link-button").click();

				const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
				expect(clipboardText).toContain("/invite/");
			});

			// ── Close the bottom sheet ──
			await test.step("close bottom sheet", async () => {
				// Press Escape to close the sheet
				await page.keyboard.press("Escape");
				await expect(page.getByTestId("invitation-bottom-sheet")).not.toBeVisible({ timeout: 5_000 });
			});

			// ── Verify sent invitations list ──
			await test.step("verify sent invitations list", async () => {
				const list = page.getByTestId("sent-invitations-list");
				await expect(list).toBeVisible({ timeout: 10_000 });

				const cards = page.getByTestId("invitation-card");
				await expect(cards).toHaveCount(1);

				// Verify personal message text is displayed
				await expect(cards.first()).toContainText(PERSONAL_MESSAGE);
				// Verify pending badge
				await expect(cards.first()).toContainText("Pending");
			});

			// ── Verify 0 credits remaining ──
			await test.step("verify invite button gone, get-credits visible", async () => {
				await expect(page.getByTestId("invite-button")).not.toBeVisible({ timeout: 5_000 });
				await expect(page.getByTestId("get-credits-button")).toBeVisible();
			});
		});
	});
