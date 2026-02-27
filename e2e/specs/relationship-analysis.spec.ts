/**
 * Relationship Analysis Flow E2E Tests (Stories 14.3 + 14.4)
 *
 * Browser-driven tests for the invitation and relationship analysis flows:
 * - Landing page shows inviter info and personal message
 * - Existing user with completed assessment can accept directly
 * - Anonymous invitee: full chat flow → signup → finalization → auto-accept via cookie
 * - Logged-in invitee (no assessment): full chat flow → finalization → auto-accept
 * - Refuse flow updates invitation status
 * - Accepted invitation triggers analysis generation → both users can view analysis
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
	.serial("Relationship Analysis Flow", () => {
		test.setTimeout(60_000);

		const todayKey = new Date().toISOString().slice(0, 10);
		const redisKey = `global_assessments:${todayKey}`;

		let invitationToken: string;
		let inviterSessionId: string;
		let inviteeAcceptSessionId: string;

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
			inviteeAcceptSessionId = await createAssessmentSession(apiContext);
			const inviteeSessionId = inviteeAcceptSessionId;
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

		test("anonymous invitee completes assessment and invitation is auto-accepted via cookie", async ({
			page,
			apiContext,
		}) => {
			test.setTimeout(90_000);

			let anonInviteToken: string;

			await test.step("create new invitation for anonymous invitee", async () => {
				// Sign in as inviter and grant extra credits
				await signInUser(apiContext, INVITER);
				const inviterUser = await getUserByEmail(INVITER.email);
				if (inviterUser) await grantCredits(inviterUser.id, 1);

				const res = await apiContext.post("/api/relationship/invitations", {
					data: { personalMessage: "Anonymous flow test" },
				});
				expect(res.ok()).toBe(true);
				const body = await res.json();
				anonInviteToken = body.invitation.invitationToken;
			});

			await test.step("navigate to invite page as anonymous user", async () => {
				// Clear cookies for anonymous context
				await page.context().clearCookies();
				await page.goto(`/invite/${anonInviteToken}`);
				await page.waitForLoadState("networkidle");

				const landingPage = page.getByTestId("invite-landing-page");
				await expect(landingPage).toBeVisible({ timeout: 15_000 });

				const startButton = page.getByTestId("start-assessment-button");
				await expect(startButton).toBeVisible();
			});

			await test.step("click Start Your Assessment → claims cookie → redirects to /chat", async () => {
				await page.getByTestId("start-assessment-button").click();

				// Retry /chat navigation (SSR redirect may fail transiently)
				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
						break;
					} catch {
						if (attempt === 2) throw new Error("Failed to reach /chat?sessionId= after 3 attempts");
						await page.waitForTimeout(1_000);
					}
				}
			});

			await test.step("wait for Nerin greeting", async () => {
				await page.getByTestId("chat-bubble").first().waitFor({ state: "visible" });
			});

			await test.step("send message → triggers farewell + auth gate", async () => {
				const chatInput = page.getByTestId("chat-input");
				await chatInput.waitFor({ state: "visible" });
				await chatInput.fill("I love exploring new ideas and creative projects.");
				await page.getByTestId("chat-send-btn").click();

				// MESSAGE_THRESHOLD=1 → farewell + auth gate
				await page.getByTestId("chat-auth-gate").waitFor({
					state: "visible",
					timeout: 30_000,
				});
			});

			const anonEmail = `e2e-anon-invitee-${Date.now()}@test.bigocean.dev`;

			await test.step("sign up via auth gate", async () => {
				await page.getByTestId("chat-auth-gate-signup-btn").click();
				await page.locator("#results-signup-email").fill(anonEmail);
				await page.locator("#results-signup-password").fill("OceanDepth#Nerin42xQ");
				await page.getByTestId("auth-gate-signup-submit").click();
			});

			await test.step("finalization → results page", async () => {
				const reachedResults = await Promise.race([
					page
						.getByTestId("finalization-wait-screen")
						.waitFor({ state: "visible", timeout: 15_000 })
						.then(() => false),
					page.waitForURL(/\/results\//, { timeout: 15_000 }).then(() => true),
				]);

				if (!reachedResults) {
					await page.waitForURL(/\/results\//, { timeout: 15_000 });
				}
			});

			await test.step("verify invitation was auto-accepted via cookie", async () => {
				// Sign in as inviter to check invitation status
				await signInUser(apiContext, INVITER);
				const statusRes = await apiContext.get(
					`/api/relationship/public/invitations/${anonInviteToken}`,
				);
				expect(statusRes.ok()).toBe(true);
				const statusBody = await statusRes.json();
				expect(statusBody.invitation.status).toBe("accepted");
			});
		});

		test("logged-in invitee without assessment completes assessment via invite link", async ({
			page,
			apiContext,
		}) => {
			test.setTimeout(90_000);

			const INVITEE_NO_ASSESSMENT = {
				email: `e2e-invitee-noassess-${Date.now()}@test.bigocean.dev`,
				password: "OceanDepth#Nerin42xQ",
				name: "Invitee No Assessment",
			} as const;

			let loggedInInviteToken: string;

			await test.step("create new invitation", async () => {
				await signInUser(apiContext, INVITER);
				const inviterUser = await getUserByEmail(INVITER.email);
				if (inviterUser) await grantCredits(inviterUser.id, 1);

				const res = await apiContext.post("/api/relationship/invitations", {
					data: { personalMessage: "Logged-in flow test" },
				});
				expect(res.ok()).toBe(true);
				const body = await res.json();
				loggedInInviteToken = body.invitation.invitationToken;
			});

			await test.step("create user with no assessment and transfer cookies", async () => {
				// Create a fresh user (no assessment session)
				await createUser(apiContext, INVITEE_NO_ASSESSMENT);
				const storageState = await apiContext.storageState();
				await page.context().clearCookies();
				await page.context().addCookies(storageState.cookies);
			});

			await test.step("navigate to invite page — shows Start Assessment", async () => {
				await page.goto(`/invite/${loggedInInviteToken}`);
				await page.waitForLoadState("networkidle");

				const landingPage = page.getByTestId("invite-landing-page");
				await expect(landingPage).toBeVisible({ timeout: 15_000 });

				const startButton = page.getByTestId("start-assessment-button");
				await expect(startButton).toBeVisible();
			});

			await test.step("click Start Your Assessment → claims cookie → /chat", async () => {
				await page.getByTestId("start-assessment-button").click();

				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						await page.waitForURL(/\/chat\?sessionId=/, { timeout: 10_000 });
						break;
					} catch {
						if (attempt === 2) throw new Error("Failed to reach /chat?sessionId= after 3 attempts");
						await page.waitForTimeout(1_000);
					}
				}
			});

			await test.step("wait for Nerin greeting", async () => {
				await page.getByTestId("chat-bubble").first().waitFor({ state: "visible" });
			});

			await test.step("send message → triggers farewell (already authenticated)", async () => {
				const chatInput = page.getByTestId("chat-input");
				await chatInput.waitFor({ state: "visible" });
				await chatInput.fill("I enjoy deep conversations about philosophy.");
				await page.getByTestId("chat-send-btn").click();
			});

			await test.step("finalization → results page (no auth gate for logged-in user)", async () => {
				const reachedResults = await Promise.race([
					page
						.getByTestId("finalization-wait-screen")
						.waitFor({ state: "visible", timeout: 15_000 })
						.then(() => false),
					page.waitForURL(/\/results\//, { timeout: 15_000 }).then(() => true),
				]);

				if (!reachedResults) {
					await page.waitForURL(/\/results\//, { timeout: 15_000 });
				}
			});

			await test.step("navigate back to invite page and accept via UI", async () => {
				// Now the user has a completed assessment — invite page should show "Accept Invitation"
				await page.goto(`/invite/${loggedInInviteToken}`);
				await page.waitForLoadState("networkidle");

				const acceptButton = page.getByTestId("accept-invitation-button");
				await expect(acceptButton).toBeVisible({ timeout: 15_000 });
				await acceptButton.click();
				await page.waitForLoadState("networkidle");
			});

			await test.step("verify invitation was accepted", async () => {
				await signInUser(apiContext, INVITER);
				const statusRes = await apiContext.get(
					`/api/relationship/public/invitations/${loggedInInviteToken}`,
				);
				expect(statusRes.ok()).toBe(true);
				const statusBody = await statusRes.json();
				expect(statusBody.invitation.status).toBe("accepted");
			});
		});

		test("existing user accepts invitation and views relationship analysis", async ({
			page,
			apiContext,
		}) => {
			test.setTimeout(60_000);

			await test.step("sign in as invitee and navigate to results", async () => {
				await signInUser(apiContext, INVITEE_ACCEPT);
				const storageState = await apiContext.storageState();
				await page.context().clearCookies();
				await page.context().addCookies(storageState.cookies);
				await page.goto(`/results/${inviteeAcceptSessionId}`);
				await page.waitForLoadState("networkidle");
			});

			await test.step("wait for RelationshipCard ready state", async () => {
				const readyCard = page.getByTestId("relationship-card-state-ready");
				await expect(readyCard).toBeVisible({ timeout: 30_000 });
			});

			await test.step("click Read Analysis and verify page loads", async () => {
				await page.getByRole("link", { name: "Read Analysis" }).click();
				await page.waitForURL(/\/relationship\//, { timeout: 10_000 });

				const analysisPage = page.getByTestId("relationship-analysis-page");
				await expect(analysisPage).toBeVisible({ timeout: 15_000 });

				// Verify mock analysis content rendered
				await expect(page.getByText("The Dynamic Between You")).toBeVisible({ timeout: 10_000 });
			});

			await test.step("verify inviter can also view the analysis", async () => {
				// Capture the analysis URL
				const analysisUrl = page.url();

				// Sign in as inviter
				await signInUser(apiContext, INVITER);
				const storageState = await apiContext.storageState();
				await page.context().clearCookies();
				await page.context().addCookies(storageState.cookies);

				// Navigate to same analysis page
				await page.goto(analysisUrl);
				await page.waitForLoadState("networkidle");

				const analysisPage = page.getByTestId("relationship-analysis-page");
				await expect(analysisPage).toBeVisible({ timeout: 15_000 });
				await expect(page.getByText("The Dynamic Between You")).toBeVisible({ timeout: 10_000 });
			});

			await test.step("verify inviter results page also shows ready card", async () => {
				await page.goto(`/results/${inviterSessionId}`);
				await page.waitForLoadState("networkidle");

				const readyCard = page.getByTestId("relationship-card-state-ready");
				await expect(readyCard).toBeVisible({ timeout: 30_000 });
			});
		});

		test("authenticated user refuses invitation", async ({ page, apiContext }) => {
			// Create refuse-user first (apiContext is fresh/unauthenticated)
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

			// Sign in as inviter, grant a credit, and create a new invitation
			await signInUser(apiContext, INVITER);
			const inviterUser = await getUserByEmail(INVITER.email);
			if (inviterUser) await grantCredits(inviterUser.id, 1);

			const res = await apiContext.post("/api/relationship/invitations", {
				data: { personalMessage: "Another invitation" },
			});
			expect(res.ok()).toBe(true);

			const body = await res.json();
			const refuseToken = body.invitation.invitationToken;

			// Sign back in as refuse-user and transfer cookies to browser
			await signInUser(apiContext, INVITEE_REFUSE);
			const storageState = await apiContext.storageState();
			await page.context().addCookies(storageState.cookies);

			// Navigate to invite page
			await page.goto(`/invite/${refuseToken}`);
			await page.waitForLoadState("networkidle");

			// Click refuse — on success, navigates to /
			const refuseLink = page.getByTestId("refuse-invitation-link");
			await expect(refuseLink).toBeVisible({ timeout: 15_000 });
			await refuseLink.click();
			// Refuse navigates to / — wait for the landing page hero
			await page.getByTestId("hero-section").waitFor({ state: "visible", timeout: 15_000 });

			// Verify invitation status is refused
			const statusRes = await apiContext.get(`/api/relationship/public/invitations/${refuseToken}`);
			expect(statusRes.ok()).toBe(true);
			const statusBody = await statusRes.json();
			expect(statusBody.invitation.status).toBe("refused");
		});
	});
