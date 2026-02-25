import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");

/**
 * Playwright E2E Test Configuration — Chromium Desktop Only
 *
 * Auth state is created in globalSetup (no separate "setup" project).
 * All projects that need auth use storageState from .auth/ files.
 *
 * Projects:
 *   golden-path    → self-contained journey spec (creates its own user)
 *   profile-page   → profile page journeys (empty state + assessment card)
 *   public-profile → anonymous viewer accesses shared profile
 *   unauth         → unauthenticated access denial (no storageState)
 *   auth-other     → other-user access denial (other-user.json)
 *   auth-owner     → owner access granted (owner.json)
 *
 * Docker test containers are managed via globalSetup / globalTeardown.
 */
export default defineConfig({
	globalSetup: "./global-setup.ts",
	globalTeardown: "./global-teardown.ts",
	testDir: ".",
	fullyParallel: true,
	workers: 4,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	timeout: 30_000,
	reporter: "html",
	use: {
		baseURL: "http://localhost:3001",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		...devices["Desktop Chrome"],
	},

	projects: [
		// ── Golden path: self-contained, creates its own user ────────────
		{
			name: "golden-path",
			testMatch: "specs/golden-path.spec.ts",
			use: {
				video: "on",
			},
		},

		// ── Profile page: auth user journeys (manages own storageState) ─
		{
			name: "profile-page",
			testMatch: "specs/profile-page.spec.ts",
		},

		// ── Public profile: anonymous viewer accesses shared profile ─────
		{
			name: "public-profile",
			testMatch: "specs/public-profile.spec.ts",
		},

		// ── Archetype card & OG image generation ─────────────────────────
		{
			name: "archetype-card",
			testMatch: "specs/archetype-card.spec.ts",
		},

		// ── Signup redirect: standalone signup page redirect flow ────────
		{
			name: "signup-redirect",
			testMatch: "specs/signup-redirect.spec.ts",
		},

		// ── Waitlist: circuit breaker UI + API ────────────────────────────
		{
			name: "waitlist",
			testMatch: "specs/waitlist.spec.ts",
		},

		// ── Purchase credits: free credit grant, credits endpoint, UI ────
		{
			name: "purchase-credits",
			testMatch: "specs/purchase-credits.spec.ts",
		},

		// ── Access-control: unauthenticated ──────────────────────────────
		{
			name: "unauth",
			testMatch: "specs/access-control/unauth-denied.spec.ts",
		},

		// ── Access-control: authenticated as other user ──────────────────
		{
			name: "auth-other",
			testMatch: "specs/access-control/other-user-denied.spec.ts",
			use: {
				storageState: ".auth/other-user.json",
			},
		},

		// ── Access-control: authenticated as session owner ────────────────
		{
			name: "auth-owner",
			testMatch: "specs/access-control/owner-access.spec.ts",
			use: {
				storageState: ".auth/owner.json",
			},
		},
	],

	webServer: {
		command:
			"cd apps/front && VITE_API_URL=http://localhost:4001 VITE_E2E=true npx vite dev --port 3001",
		url: "http://localhost:3001",
		cwd: PROJECT_ROOT,
		reuseExistingServer: !process.env.CI,
		timeout: 20_000,
	},
});
