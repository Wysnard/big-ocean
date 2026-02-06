import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * See https://playwright.dev/docs/test-configuration
 *
 * IMPORTANT: E2E tests require the full stack to be running:
 * - PostgreSQL (test DB on port 5433)
 * - Redis (port 6380)
 * - API (port 4001 with MOCK_LLM=true)
 * - Frontend (port 3000)
 *
 * Before running E2E tests:
 * 1. Start test environment: `pnpm docker:test:up` (from project root)
 * 2. Run tests: `pnpm test:e2e`
 * 3. Stop test environment: `pnpm docker:test:down`
 *
 * Or use the all-in-one command: `pnpm test:e2e:full`
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
		// Mobile viewports
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"] },
		},
	],

	// Start frontend dev server (assumes backend is already running)
	webServer: {
		command: "VITE_API_URL=http://localhost:4001 pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 60000,
	},
});
