/**
 * Purchase Credits E2E Tests (Story 14.1)
 *
 * Validates:
 * - Free credit granted on signup (AC1)
 * - Credits endpoint returns correct state (AC2)
 * - RelationshipCreditsSection renders on results page (AC5, AC7)
 */

import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/assessment.factory.js";
import { createUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";

const CREDITS_USER = {
	email: `e2e-credits-${Date.now()}@test.bigocean.dev`,
	password: "OceanDepth#Nerin42xQ",
	name: "Credits Tester",
} as const;

const NO_ASSESSMENT_USER = {
	email: `e2e-no-assess-${Date.now()}@test.bigocean.dev`,
	password: "OceanDepth#Nerin42xQ",
	name: "No Assessment User",
} as const;

test.describe("Purchase Credits", () => {
	test.setTimeout(60_000);

	test("free credit granted on signup and credits endpoint returns correct state", async ({
		apiContext,
	}) => {
		let sessionId: string;

		await test.step("create anonymous session", async () => {
			sessionId = await createAssessmentSession(apiContext);
		});

		await test.step("sign up user (triggers free credit grant)", async () => {
			await createUser(apiContext, {
				...CREDITS_USER,
				anonymousSessionId: sessionId!,
			});
		});

		await test.step("link session and seed results", async () => {
			const linkedUserId = await getSessionUserId(sessionId!);
			if (!linkedUserId) {
				const user = await getUserByEmail(CREDITS_USER.email);
				if (!user) throw new Error("Credits test user not found");
				await linkSessionToUser(sessionId!, user.id);
			}

			try {
				await seedSessionForResults(sessionId!);
			} catch (err) {
				console.warn(
					`[purchase-credits] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}
		});

		await test.step("verify credits endpoint returns 1 credit + completed assessment", async () => {
			const response = await apiContext.get("/api/purchase/credits");
			expect(response.ok()).toBe(true);

			const data = await response.json();
			expect(data.availableCredits).toBe(1);
			expect(data.hasCompletedAssessment).toBe(true);
		});
	});

	test("credits endpoint returns correct state for user without assessment", async ({
		apiContext,
	}) => {
		await test.step("sign up user without session", async () => {
			await createUser(apiContext, NO_ASSESSMENT_USER);
		});

		await test.step("verify credits endpoint returns 1 credit + no completed assessment", async () => {
			const response = await apiContext.get("/api/purchase/credits");
			expect(response.ok()).toBe(true);

			const data = await response.json();
			expect(data.availableCredits).toBe(1);
			expect(data.hasCompletedAssessment).toBe(false);
		});
	});

	test("credits section visible on results page for authenticated user", async ({
		page,
		apiContext,
	}) => {
		let sessionId: string;

		await test.step("setup: create user with completed assessment", async () => {
			sessionId = await createAssessmentSession(apiContext);
			await createUser(apiContext, {
				...{
					email: `e2e-credits-ui-${Date.now()}@test.bigocean.dev`,
					password: "OceanDepth#Nerin42xQ",
					name: "Credits UI Tester",
				},
				anonymousSessionId: sessionId!,
			});

			const linkedUserId = await getSessionUserId(sessionId!);
			if (!linkedUserId) {
				const user = await getUserByEmail(`e2e-credits-ui-${Date.now()}@test.bigocean.dev`);
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

	test("credits section hidden for unauthenticated user", async ({ page }) => {
		// Navigate to a results page without auth — should show auth gate, not credits
		await page.goto("/results/nonexistent-session-id");
		await page.waitForLoadState("networkidle");

		const creditsSection = page.getByTestId("relationship-credits-section");
		await expect(creditsSection).not.toBeVisible({ timeout: 5_000 });
	});
});
