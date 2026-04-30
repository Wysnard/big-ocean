/**
 * Global Setup — starts Docker containers, waits for API health,
 * creates test users, seeds assessment data, and saves auth state.
 *
 * Replaces the previous two-phase approach (global-setup + auth.setup project).
 * Uses Playwright `request` API so cookies are captured automatically.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { AUTH_FILES, OTHER_USER, OWNER_USER } from "./e2e-env.js";
import {
	createAssessmentSession,
	seedSessionForResults,
} from "./factories/conversation.factory.js";
import { createUser, markFirstVisitCompleted } from "./factories/user.factory.js";
import { createApiContext } from "./utils/api-client.js";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const HEALTH_URL = "http://127.0.0.1:4001/health";
const POLL_INTERVAL_MS = 2_000;
const TIMEOUT_MS = 60_000;

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

	// ── Owner user: sign up → start authenticated session → seed evidence ──
	// (Anonymous conversation start was removed; POST /api/conversation/start requires auth.)

	const ownerApi = await createApiContext();
	await createUser(ownerApi, OWNER_USER);
	console.log(`[global-setup] Owner signed up: ${OWNER_USER.email}`);

	const sessionId = await createAssessmentSession(ownerApi);
	console.log(`[global-setup] Started authenticated session: ${sessionId}`);

	// Seed conversation_evidence so results page renders
	await seedSessionForResults(sessionId);
	console.log("[global-setup] Seeded evidence data for results");

	// Mark first visit as completed so /today doesn't redirect to /me
	await markFirstVisitCompleted(OWNER_USER.email);
	console.log("[global-setup] Marked owner first visit as completed");

	// Save owner storage state (cookies auto-captured by Playwright request context)
	await ownerApi.storageState({ path: AUTH_FILES.owner });
	console.log(`[global-setup] Saved owner storage state → ${AUTH_FILES.owner}`);
	await ownerApi.dispose();

	// ── Other user: signs up (no session) ──

	const otherApi = await createApiContext();
	await createUser(otherApi, OTHER_USER);
	console.log(`[global-setup] Other user signed up: ${OTHER_USER.email}`);

	await markFirstVisitCompleted(OTHER_USER.email);
	console.log("[global-setup] Marked other-user first visit as completed");

	await otherApi.storageState({ path: AUTH_FILES.otherUser });
	console.log(`[global-setup] Saved other-user storage state → ${AUTH_FILES.otherUser}`);
	await otherApi.dispose();

	// ── Write test session ID for spec files ──

	writeFileSync(AUTH_FILES.testSession, JSON.stringify({ sessionId }));
	console.log(`[global-setup] Wrote test session → ${AUTH_FILES.testSession}`);
}

async function globalSetup(): Promise<void> {
	console.log("[global-setup] Starting Docker test containers...");

	// .env.e2e is required — validate before starting containers
	const envFile = resolve(PROJECT_ROOT, ".env.e2e");
	if (!existsSync(envFile)) {
		throw new Error(
			"[global-setup] .env.e2e not found — copy .env.e2e.example and fill in credentials.\n" +
				"See .env.e2e.example for required variables.",
		);
	}
	for (const key of ["RESEND_API_KEY", "POLAR_WEBHOOK_SECRET"]) {
		if (!process.env[key]) {
			throw new Error(
				`[global-setup] ${key} not configured — set it in .env.e2e\n` +
					"See .env.e2e.example for required variables.",
			);
		}
	}
	console.log("[global-setup] .env.e2e validated");

	execSync(`docker compose -p big-ocean-e2e -f compose.e2e.yaml --env-file .env.e2e up -d --build`, {
		cwd: PROJECT_ROOT,
		stdio: "inherit",
	});

	console.log("[global-setup] Waiting for API health check...");
	await waitForHealth();

	console.log("[global-setup] Creating auth state...");
	await createAuthState();
}

export default globalSetup;
