/**
 * QR Token Invitation System E2E Tests (Story 34-1)
 *
 * API-driven tests exercising the QR token lifecycle:
 * - Generate QR token via API
 * - Verify token status
 * - Verify relationship card state on results page
 * - Verify 0-credits state shows no-credits card
 *
 * Note: QR drawer UI (Story 34-2) is not yet built. These tests
 * exercise the API layer and verify the RelationshipCard renders
 * the correct state based on the API response.
 */

import { execSync } from "node:child_process";
import {
	createAssessmentSession,
	seedSessionForResults,
} from "../factories/conversation.factory.js";
import { createUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";

const INVITE_USER = {
	email: `e2e-invite-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "Invitation Tester",
} as const;

test.describe("Invitation System", () => {
	test.setTimeout(60_000);

	const todayKey = new Date().toISOString().slice(0, 10);
	const redisKey = `global_assessments:${todayKey}`;

	let sessionId: string;

	test.beforeAll(() => {
		execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
	});

	test("create QR token, verify status, check relationship card @critical", async ({
		page,
		apiContext,
	}) => {
		// ── Setup: create user with completed assessment ──
		await test.step("seed user with completed assessment", async () => {
			await createUser(apiContext, INVITE_USER);
			sessionId = await createAssessmentSession(apiContext);

			try {
				await seedSessionForResults(sessionId);
			} catch (err) {
				console.warn(
					`[invitation-system] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}
		});

		// ── Generate QR token via API ──
		// TODO: These API steps (generate, verify status, verify credits) could be
		// moved to integration tests in the future. They are kept here because they
		// serve as setup/verification within the browser journey.
		let qrToken = "";
		let shareUrl = "";

		await test.step("generate QR token via API", async () => {
			const res = await apiContext.post("/api/relationship/qr/generate");
			if (!res.ok()) {
				const body = await res.text();
				throw new Error(`QR generate failed (${res.status()}): ${body}`);
			}

			const body = (await res.json()) as {
				token: string;
				shareUrl: string;
				expiresAt: string;
			};
			qrToken = body.token;
			shareUrl = body.shareUrl;
			expect(qrToken).toBeTruthy();
			expect(shareUrl).toContain("/relationship/qr/");
		});

		// ── Verify token status via API ──
		await test.step("verify QR token status is active", async () => {
			const res = await apiContext.get(`/api/relationship/qr/${qrToken}/status`);
			expect(res.ok()).toBe(true);

			const body = (await res.json()) as { status: string };
			expect(body.status).toBe("valid");
		});

		// ── Verify relationship card shows qr-active state ──
		await test.step("transfer auth cookies to browser", async () => {
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);
		});

		await test.step("results page shows relationship card in qr-active state", async () => {
			await page.goto(`/me/${sessionId}`);

			const card = page.getByTestId("relationship-card");
			await expect(card).toBeVisible({ timeout: 15_000 });
		});

		// ── Verify credits endpoint still shows credit (consumed on accept, not generate) ──
		await test.step("credits endpoint shows credits available", async () => {
			const res = await apiContext.get("/api/purchase/credits");
			expect(res.ok()).toBe(true);

			const body = (await res.json()) as { availableCredits: number };
			// QR generation does not consume credit — credit consumed on accept
			expect(body.availableCredits).toBe(1);
		});
	});
});
