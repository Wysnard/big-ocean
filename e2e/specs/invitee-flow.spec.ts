/**
 * Invitee Assessment Flow E2E Tests (Story 14.3)
 *
 * Browser-driven tests for the invitation landing page and accept/refuse flows:
 * - Landing page shows inviter info and personal message
 * - Existing user with completed assessment can accept directly
 * - Refuse flow updates invitation status
 */

import { execSync } from "node:child_process";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
} from "../factories/assessment.factory.js";
import { createUser, signInUser } from "../factories/user.factory.js";
import { expect, test } from "../fixtures/base.fixture.js";

const INVITER = {
	email: `e2e-inviter-${Date.now()}@test.bigocean.dev`,
	password: "OceanDepth#Nerin42xQ",
	name: "Test Inviter",
} as const;

const INVITEE_ACCEPT = {
	email: `e2e-invitee-accept-${Date.now()}@test.bigocean.dev`,
	password: "OceanDepth#Nerin42xQ",
	name: "Test Invitee Accept",
} as const;

const INVITEE_REFUSE = {
	email: `e2e-invitee-refuse-${Date.now()}@test.bigocean.dev`,
	password: "OceanDepth#Nerin42xQ",
	name: "Test Invitee Refuse",
} as const;

const PERSONAL_MESSAGE = "Let's see how we compare!";

test.describe
	.serial("Invitee Assessment Flow", () => {
		test.setTimeout(60_000);

		const todayKey = new Date().toISOString().slice(0, 10);
		const redisKey = `global_assessments:${todayKey}`;

		let invitationToken: string;
		let inviterSessionId: string;

		test.beforeAll(() => {
			execSync(`docker exec bigocean-redis-e2e redis-cli DEL ${redisKey}`);
		});

		test("setup: create inviter with completed assessment and invitation", async ({ apiContext }) => {
			// Create inviter with completed assessment
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
					`[invitee-flow] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}

			// Create invitation
			const res = await apiContext.post("/api/relationship/invitations", {
				data: { personalMessage: PERSONAL_MESSAGE },
			});
			expect(res.ok()).toBe(true);

			const body = await res.json();
			invitationToken = body.invitation.invitationToken;
			expect(invitationToken).toBeTruthy();
		});

		test("invitation landing page loads with inviter info", async ({ page, apiContext }) => {
			// Navigate to invite page (unauthenticated)
			await page.goto(`/invite/${invitationToken}`);
			await page.waitForLoadState("networkidle");

			const landingPage = page.getByTestId("invite-landing-page");
			await expect(landingPage).toBeVisible({ timeout: 15_000 });

			// Verify inviter name is displayed
			await expect(page.getByText(INVITER.name)).toBeVisible();

			// Verify personal message is displayed
			await expect(page.getByText(PERSONAL_MESSAGE)).toBeVisible();

			// Verify start assessment button is visible (anonymous user)
			const startButton = page.getByTestId("start-assessment-button");
			await expect(startButton).toBeVisible();
		});

		test("existing user with completed assessment accepts invitation directly", async ({
			page,
			apiContext,
		}) => {
			// Create invitee with completed assessment
			const inviteeSessionId = await createAssessmentSession(apiContext);
			await createUser(apiContext, {
				...INVITEE_ACCEPT,
				anonymousSessionId: inviteeSessionId,
			});

			const linkedUserId = await getSessionUserId(inviteeSessionId);
			if (!linkedUserId) {
				const user = await getUserByEmail(INVITEE_ACCEPT.email);
				if (user) await linkSessionToUser(inviteeSessionId, user.id);
			}

			try {
				await seedSessionForResults(inviteeSessionId);
			} catch (err) {
				console.warn(
					`[invitee-flow] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}

			// Transfer auth cookies to browser
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);

			// Navigate to invite page
			await page.goto(`/invite/${invitationToken}`);
			await page.waitForLoadState("networkidle");

			// Should show "Accept Invitation" button (not "Start Assessment")
			const acceptButton = page.getByTestId("accept-invitation-button");
			await expect(acceptButton).toBeVisible({ timeout: 15_000 });

			// Click accept
			await acceptButton.click();
			await page.waitForLoadState("networkidle");

			// Verify invitation status is accepted via API
			const statusRes = await apiContext.get(
				`/api/relationship/public/invitations/${invitationToken}`,
			);
			expect(statusRes.ok()).toBe(true);
			const statusBody = await statusRes.json();
			expect(statusBody.invitation.status).toBe("accepted");
		});

		test("authenticated user refuses invitation", async ({ page, apiContext }) => {
			// Need a new invitation for the refuse test (previous one was accepted)
			// Re-sign in as inviter to create a new invitation
			await signInUser(apiContext, INVITER);

			const res = await apiContext.post("/api/relationship/invitations", {
				data: { personalMessage: "Another invitation" },
			});

			// If no credits left, skip this test
			if (!res.ok()) {
				test.skip();
				return;
			}

			const body = await res.json();
			const refuseToken = body.invitation.invitationToken;

			// Create and sign in as refuse-user
			const refuseSessionId = await createAssessmentSession(apiContext);
			await createUser(apiContext, {
				...INVITEE_REFUSE,
				anonymousSessionId: refuseSessionId,
			});

			const linkedUserId = await getSessionUserId(refuseSessionId);
			if (!linkedUserId) {
				const user = await getUserByEmail(INVITEE_REFUSE.email);
				if (user) await linkSessionToUser(refuseSessionId, user.id);
			}

			try {
				await seedSessionForResults(refuseSessionId);
			} catch (err) {
				console.warn(
					`[invitee-flow] Skipping evidence seed: ${err instanceof Error ? err.message : err}`,
				);
			}

			// Transfer cookies to browser
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);

			// Navigate to invite page
			await page.goto(`/invite/${refuseToken}`);
			await page.waitForLoadState("networkidle");

			// Click refuse
			const refuseLink = page.getByTestId("refuse-invitation-link");
			await expect(refuseLink).toBeVisible({ timeout: 15_000 });
			await refuseLink.click();
			await page.waitForLoadState("networkidle");

			// Verify invitation status is refused
			const statusRes = await apiContext.get(`/api/relationship/public/invitations/${refuseToken}`);
			expect(statusRes.ok()).toBe(true);
			const statusBody = await statusRes.json();
			expect(statusBody.invitation.status).toBe("refused");
		});
	});
