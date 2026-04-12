/**
 * Relationship Analysis Flow E2E Tests (Story 34-1 QR Token Model)
 *
 * Browser tests exercising the QR token lifecycle with page navigation:
 * - Invitee results page shows relationship card
 * - Inviter results page shows relationship card
 *
 * Pure API tests (QR token status, accept, refuse) have been extracted to
 * __extracted-api-tests/relationship-analysis-api.spec.ts for migration
 * to integration tier.
 */

import { execSync } from "node:child_process";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/conversation.factory.js";
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

		test("setup: create inviter with completed assessment and QR token @critical", async ({
			apiContext,
		}) => {
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

		test("invitee with completed assessment accepts QR token @critical", async ({ apiContext }) => {
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

		test("invitee results page shows relationship card @critical", async ({ page, apiContext }) => {
			await signInUser(apiContext, INVITEE);
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);

			await page.goto(`/results/${inviteeSessionId}`);

			const card = page.getByTestId("relationship-card");
			await expect(card).toBeVisible({ timeout: 15_000 });
		});

		test("inviter results page shows relationship card @critical", async ({ page, apiContext }) => {
			await signInUser(apiContext, INVITER);
			const storageState = await apiContext.storageState();
			await page.context().clearCookies();
			await page.context().addCookies(storageState.cookies);

			await page.goto(`/results/${inviterSessionId}`);

			const card = page.getByTestId("relationship-card");
			await expect(card).toBeVisible({ timeout: 15_000 });
		});
	});
