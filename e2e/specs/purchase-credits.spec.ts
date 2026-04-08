/**
 * Purchase Credits E2E Tests (Story 14.1)
 *
 * Validates:
 * - RelationshipCreditsSection renders on results page (AC5, AC7)
 * - Credit purchase via Polar webhook simulation (signed Standard Webhooks)
 * - Credits section hidden for unauthenticated user
 *
 * API-only tests (free credit grant, credits endpoint state) have been
 * extracted to __extracted-api-tests/purchase-credits-api.spec.ts for
 * migration to integration tier.
 */

import { execSync } from "node:child_process";
import { POLAR_CONFIG } from "../e2e-env.js";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/conversation.factory.js";
import { createUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";
import { sendPolarWebhook } from "../helpers/webhook.helper.js";

test.describe("Purchase Credits", () => {
	test.setTimeout(60_000);

	// Reset the global assessment counter so tests aren't blocked by prior runs
	const todayKey = new Date().toISOString().slice(0, 10);
	const redisKey = `global_assessments:${todayKey}`;

	test.beforeAll(() => {
		execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
	});

	test("credits section visible on results page for authenticated user @critical", async ({
		page,
		apiContext,
	}) => {
		let sessionId: string;
		const uiTestEmail = `e2e-credits-ui-${Date.now()}@gmail.com`;

		await test.step("setup: create user with completed assessment", async () => {
			sessionId = await createAssessmentSession(apiContext);
			await createUser(apiContext, {
				email: uiTestEmail,
				password: "OceanDepth#Nerin42xQ",
				name: "Credits UI Tester",
				anonymousSessionId: sessionId!,
			});

			const linkedUserId = await getSessionUserId(sessionId!);
			if (!linkedUserId) {
				const user = await getUserByEmail(uiTestEmail);
				if (user) await linkSessionToUser(sessionId!, user.id);
			}

			try {
				await seedSessionForResults(sessionId!);
			} catch (err) {
				console.warn(
					`[purchase-credits-ui] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}
		});

		await test.step("simulate credit purchase via Polar webhook", async () => {
			const user = await getUserByEmail(uiTestEmail);
			if (!user) throw new Error("Test user not found for webhook");
			await sendPolarWebhook(apiContext, {
				productId: POLAR_CONFIG.productRelationshipSingle,
				externalUserId: user.id,
			});
		});

		await test.step("verify credits increased via API", async () => {
			const response = await apiContext.get("/api/purchase/credits");
			expect(response.ok()).toBe(true);
			const data = await response.json();
			// free_credit_granted (from signup) + credit_purchased (from webhook) = 2
			expect(data.availableCredits).toBe(2);
		});

		await test.step("transfer auth cookies to browser context", async () => {
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);
		});

		await test.step("navigate to results page and verify credits section", async () => {
			await page.goto(`/results/${sessionId!}`);
			await page.waitForLoadState("networkidle");

			const creditsSection = page.getByTestId("relationship-credits-section");
			await expect(creditsSection).toBeVisible({ timeout: 15_000 });
		});
	});

	test("credits section hidden for unauthenticated user @critical", async ({ page }) => {
		// Navigate to a results page without auth — should show auth gate, not credits
		await page.goto("/results/nonexistent-session-id");
		await page.waitForLoadState("networkidle");

		const creditsSection = page.getByTestId("relationship-credits-section");
		await expect(creditsSection).not.toBeVisible({ timeout: 5_000 });
	});
});
