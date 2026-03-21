/**
 * Relationship Analysis Flow E2E Tests (Story 34-1 QR Token Model)
 *
 * API-driven tests exercising the QR token lifecycle:
 * - Generate QR token
 * - Accept QR token (as another user with completed assessment)
 * - Refuse QR token
 * - Verify relationship analysis generation (mock)
 * - Verify both users can view the analysis
 *
 * Note: QR drawer UI (Story 34-2) and QR accept screen (Story 34-3) are
 * not yet built. These tests exercise the API layer and verify the
 * RelationshipCard renders correct states on the results page.
 */

import { execSync } from "node:child_process";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	grantCredits,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/assessment.factory.js";
import { createUser, signInUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";

const INVITER = {
	email: `e2e-inviter-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "Test Inviter",
} as const;

const INVITEE = {
	email: `e2e-invitee-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "Test Invitee",
} as const;

const REFUSER = {
	email: `e2e-refuser-${Date.now()}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "Test Refuser",
} as const;

test.describe
	.serial("Relationship Analysis Flow", () => {
		test.setTimeout(60_000);

		const todayKey = new Date().toISOString().slice(0, 10);
		const redisKey = `global_assessments:${todayKey}`;

		let qrToken: string;
		let inviterSessionId: string;
		let inviteeSessionId: string;

		test.beforeAll(() => {
			execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
		});

		test("setup: create inviter with completed assessment and QR token", async ({ apiContext }) => {
			inviterSessionId = await createAssessmentSession(apiContext);
			await createUser(apiContext, {
				...INVITER,
				anonymousSessionId: inviterSessionId,
			});

			const linkedUserId = await getSessionUserId(inviterSessionId);
			if (!linkedUserId) {
				const user = await getUserByEmail(INVITER.email);
				if (user) await linkSessionToUser(inviterSessionId, user.id);
			}

			try {
				await seedSessionForResults(inviterSessionId);
			} catch (err) {
				console.warn(
					`[relationship-analysis] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}

			// Generate QR token
			const res = await apiContext.post("/api/relationship/qr/generate");
			if (!res.ok()) {
				const errBody = await res.text();
				throw new Error(`QR generate failed (${res.status()}): ${errBody}`);
			}

			const body = (await res.json()) as { token: string; shareUrl: string };
			qrToken = body.token;
			expect(qrToken).toBeTruthy();
		});

		test("QR token status is active", async ({ apiContext }) => {
			await signInUser(apiContext, INVITER);
			const res = await apiContext.get(`/api/relationship/qr/${qrToken}/status`);
			expect(res.ok()).toBe(true);

			const body = (await res.json()) as { status: string };
			expect(body.status).toBe("valid");
		});

		test("invitee with completed assessment accepts QR token", async ({ apiContext }) => {
			// Create invitee with completed assessment
			inviteeSessionId = await createAssessmentSession(apiContext);
			await createUser(apiContext, {
				...INVITEE,
				anonymousSessionId: inviteeSessionId,
			});

			const linkedUserId = await getSessionUserId(inviteeSessionId);
			if (!linkedUserId) {
				const user = await getUserByEmail(INVITEE.email);
				if (user) await linkSessionToUser(inviteeSessionId, user.id);
			}

			try {
				await seedSessionForResults(inviteeSessionId);
			} catch (err) {
				console.warn(
					`[relationship-analysis] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}

			// Accept QR token as invitee
			const res = await apiContext.post(`/api/relationship/qr/${qrToken}/accept`);
			if (!res.ok()) {
				const errBody = await res.text();
				throw new Error(`QR accept failed (${res.status()}): ${errBody}`);
			}

			const body = await res.json();
			expect(body).toBeTruthy();
		});

		test("QR token status is accepted after acceptance", async ({ apiContext }) => {
			await signInUser(apiContext, INVITER);
			const res = await apiContext.get(`/api/relationship/qr/${qrToken}/status`);
			expect(res.ok()).toBe(true);

			const body = (await res.json()) as { status: string };
			expect(body.status).toBe("accepted");
		});

		test("invitee results page shows relationship card", async ({ page, apiContext }) => {
			await signInUser(apiContext, INVITEE);
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);

			await page.goto(`/results/${inviteeSessionId}`);
			// Dismiss PWYW modal if it appears
			const pwywModal = page.getByTestId("pwyw-modal");
			if (await pwywModal.isVisible({ timeout: 3_000 }).catch(() => false)) {
				await page.locator("[data-slot='dialog-close']").click();
				await pwywModal.waitFor({ state: "hidden", timeout: 3_000 });
			}

			const card = page.getByTestId("relationship-card");
			await expect(card).toBeVisible({ timeout: 15_000 });
		});

		test("inviter results page shows relationship card", async ({ page, apiContext }) => {
			await signInUser(apiContext, INVITER);
			const storageState = await apiContext.storageState();
			await page.context().clearCookies();
			await page.context().addCookies(storageState.cookies);

			await page.goto(`/results/${inviterSessionId}`);
			// Dismiss PWYW modal if it appears
			const pwywModal = page.getByTestId("pwyw-modal");
			if (await pwywModal.isVisible({ timeout: 3_000 }).catch(() => false)) {
				await page.locator("[data-slot='dialog-close']").click();
				await pwywModal.waitFor({ state: "hidden", timeout: 3_000 });
			}

			const card = page.getByTestId("relationship-card");
			await expect(card).toBeVisible({ timeout: 15_000 });
		});

		test("refuse QR token returns success", async ({ apiContext, apiUrl }) => {
			// Create a new QR token for refuse test (as inviter)
			await signInUser(apiContext, INVITER);
			const inviterUser = await getUserByEmail(INVITER.email);
			if (inviterUser) await grantCredits(inviterUser.id, 1);

			const genRes = await apiContext.post("/api/relationship/qr/generate");
			if (!genRes.ok()) {
				const errBody = await genRes.text();
				throw new Error(`QR generate failed (${genRes.status()}): ${errBody}`);
			}

			const genBody = (await genRes.json()) as { token: string };
			const refuseToken = genBody.token;

			// Create refuser with completed assessment using a FRESH api context
			// (apiContext is signed in as inviter who already has an assessment)
			const { request } = await import("@playwright/test");
			const refuserApi = await request.newContext({ baseURL: apiUrl });

			const refuserSessionId = await createAssessmentSession(refuserApi);
			await createUser(refuserApi, {
				...REFUSER,
				anonymousSessionId: refuserSessionId,
			});

			const linkedUserId = await getSessionUserId(refuserSessionId);
			if (!linkedUserId) {
				const user = await getUserByEmail(REFUSER.email);
				if (user) await linkSessionToUser(refuserSessionId, user.id);
			}

			try {
				await seedSessionForResults(refuserSessionId);
			} catch (err) {
				console.warn(
					`[relationship-analysis] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}

			// Refuse the token (as refuser)
			const refuseRes = await refuserApi.post(`/api/relationship/qr/${refuseToken}/refuse`);
			if (!refuseRes.ok()) {
				const errBody = await refuseRes.text();
				throw new Error(`QR refuse failed (${refuseRes.status()}): ${errBody}`);
			}

			await refuserApi.dispose();

			// Verify token is still valid (refuse doesn't invalidate — others can still accept)
			await signInUser(apiContext, INVITER);
			const statusRes = await apiContext.get(`/api/relationship/qr/${refuseToken}/status`);
			expect(statusRes.ok()).toBe(true);

			const statusBody = (await statusRes.json()) as { status: string };
			expect(statusBody.status).toBe("valid");
		});
	});
