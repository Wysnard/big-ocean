/**
 * Global Setup — starts Docker containers, waits for API health,
 * creates test users, seeds assessment data, and saves auth state.
 *
 * Replaces the previous two-phase approach (global-setup + auth.setup project).
 * Uses Playwright `request` API so cookies are captured automatically.
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AUTH_FILES, OTHER_USER, OWNER_USER } from "./e2e-env.js";
import {
	createAssessmentSession,
	getSessionUserId,
	getUserByEmail,
	linkSessionToUser,
	seedSessionForResults,
	sendAssessmentMessage,
} from "./factories/assessment.factory.js";
import { createUser } from "./factories/user.factory.js";
import { createApiContext } from "./utils/api-client.js";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const HEALTH_URL = "http://localhost:4001/health";
const POLL_INTERVAL_MS = 2_000;
const TIMEOUT_MS = 90_000;

async function waitForHealth(): Promise<void> {
	const start = Date.now();

	while (Date.now() - start < TIMEOUT_MS) {
		try {
			const res = await fetch(HEALTH_URL);
			if (res.ok) {
				console.log("[global-setup] API is healthy");
				return;
			}
		} catch {
			// not ready yet
		}
		await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
	}

	throw new Error(`[global-setup] API did not become healthy within ${TIMEOUT_MS / 1000}s`);
}

async function createAuthState(): Promise<void> {
	// Ensure .auth directory exists
	mkdirSync(dirname(AUTH_FILES.owner), { recursive: true });

	// ── Owner user: creates session → signs up (links session) → seeds evidence ──

	// 1. Create an anonymous assessment session
	const anonApi = await createApiContext();
	const sessionId = await createAssessmentSession(anonApi);
	console.log(`[global-setup] Created anonymous session: ${sessionId}`);
	await anonApi.dispose();

	// 2. Sign up the owner user with anonymousSessionId → triggers session linking hook
	const ownerApi = await createApiContext();
	await createUser(ownerApi, {
		...OWNER_USER,
		anonymousSessionId: sessionId,
	});
	console.log(`[global-setup] Owner signed up: ${OWNER_USER.email}`);

	// 3. Verify the Better Auth hook linked the session, fallback to direct DB update
	const linkedUserId = await getSessionUserId(sessionId);
	if (!linkedUserId) {
		console.log("[global-setup] Hook did not link session, falling back to direct DB update");
		const ownerUser = await getUserByEmail(OWNER_USER.email);
		if (!ownerUser) throw new Error("Owner user not found after sign-up");
		await linkSessionToUser(sessionId, ownerUser.id);
		console.log(`[global-setup] Linked session ${sessionId} to user ${ownerUser.id}`);
	} else {
		console.log(`[global-setup] Session linked to user ${linkedUserId} via hook`);
	}

	// 4. Seed conversation_evidence so results page renders
	await seedSessionForResults(sessionId);
	console.log("[global-setup] Seeded evidence data for results");

	// 5. Send a user message via the API so messageCount reaches
	//    MESSAGE_THRESHOLD and the profile assessment card shows "completed"
	await sendAssessmentMessage(
		ownerApi,
		sessionId,
		"I also enjoy trying new cuisines and traveling to new places.",
	);
	console.log("[global-setup] Sent user message to reach assessment threshold");

	// 6. Save owner storage state (cookies auto-captured by Playwright request context)
	await ownerApi.storageState({ path: AUTH_FILES.owner });
	console.log(`[global-setup] Saved owner storage state → ${AUTH_FILES.owner}`);
	await ownerApi.dispose();

	// ── Other user: signs up (no session) ──

	const otherApi = await createApiContext();
	await createUser(otherApi, OTHER_USER);
	console.log(`[global-setup] Other user signed up: ${OTHER_USER.email}`);

	await otherApi.storageState({ path: AUTH_FILES.otherUser });
	console.log(`[global-setup] Saved other-user storage state → ${AUTH_FILES.otherUser}`);
	await otherApi.dispose();

	// ── Write test session ID for spec files ──

	writeFileSync(AUTH_FILES.testSession, JSON.stringify({ sessionId }));
	console.log(`[global-setup] Wrote test session → ${AUTH_FILES.testSession}`);
}

async function globalSetup(): Promise<void> {
	console.log("[global-setup] Starting Docker test containers...");

	execSync("docker compose -f compose.e2e.yaml up -d --build", {
		cwd: PROJECT_ROOT,
		stdio: "inherit",
	});

	console.log("[global-setup] Waiting for API health check...");
	await waitForHealth();

	console.log("[global-setup] Creating auth state...");
	await createAuthState();
}

export default globalSetup;
