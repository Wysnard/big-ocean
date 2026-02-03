/**
 * Integration Test Global Setup
 *
 * Runs BEFORE any integration tests execute.
 * Responsibilities:
 * 1. Clean up any lingering containers from previous runs
 * 2. Start Docker Compose test environment
 * 3. Wait for health checks (API ready to accept requests)
 * 4. Timeout after 90 seconds (generous for first-time image builds)
 *
 * Reference: Story 2.8 - Docker Setup for Integration Testing
 */

import { execSync, spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const HEALTH_URL = "http://localhost:4001/health";
const TIMEOUT_MS = 90_000; // 90 seconds for Docker build + startup
const POLL_INTERVAL_MS = 2_000; // Check every 2 seconds

/**
 * Execute shell command with logging
 */
function exec(command: string, options?: { silent?: boolean }): string {
	if (!options?.silent) {
		console.log(`[setup] Running: ${command}`);
	}
	try {
		return execSync(command, {
			encoding: "utf-8",
			cwd: process.cwd(),
			stdio: options?.silent ? "pipe" : "inherit",
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Command failed: ${command}\n${message}`);
	}
}

/**
 * Poll health endpoint until API is ready
 */
async function waitForHealthy(): Promise<void> {
	const startTime = Date.now();

	console.log(`[setup] Waiting for API health check at ${HEALTH_URL}...`);

	while (Date.now() - startTime < TIMEOUT_MS) {
		try {
			const response = await fetch(HEALTH_URL);
			if (response.ok) {
				const data = await response.json();
				if (data.status === "ok") {
					console.log("[setup] API is healthy!");
					// Add small delay to ensure all routes are fully initialized
					await setTimeout(1000);
					console.log("[setup] Ready for tests!");
					return;
				}
			}
		} catch {
			// Expected while container is starting
		}

		await setTimeout(POLL_INTERVAL_MS);
		const elapsed = Math.round((Date.now() - startTime) / 1000);
		console.log(`[setup] Still waiting... (${elapsed}s elapsed)`);
	}

	// Timeout reached - print logs and fail
	console.error("[setup] Timeout waiting for API to become healthy");
	console.error("[setup] Printing Docker logs for debugging:");

	try {
		exec("docker compose -f compose.test.yaml logs", { silent: false });
	} catch {
		// Ignore errors from log printing
	}

	throw new Error(`API did not become healthy within ${TIMEOUT_MS / 1000} seconds`);
}

/**
 * Global setup function called by Vitest
 */
export default async function globalSetup(): Promise<void> {
	console.log("\n========================================");
	console.log("[setup] Integration Test Setup Starting");
	console.log("========================================\n");

	// Change to project root (compose file location)
	const projectRoot = new URL("../../../", import.meta.url).pathname;
	process.chdir(projectRoot);
	console.log(`[setup] Working directory: ${process.cwd()}`);

	// Step 1: Clean up any lingering containers
	console.log("[setup] Step 1: Cleaning up old containers...");
	try {
		exec("docker compose -f compose.test.yaml down -v --remove-orphans", { silent: true });
	} catch {
		// Ignore errors if no containers exist
		console.log("[setup] No existing containers to clean up");
	}

	// Step 2: Start Docker Compose services
	console.log("[setup] Step 2: Starting Docker Compose services...");
	exec("docker compose -f compose.test.yaml up -d --build");

	// Step 3: Wait for health checks
	console.log("[setup] Step 3: Waiting for services to be healthy...");
	await waitForHealthy();

	console.log("\n========================================");
	console.log("[setup] Integration Test Setup Complete!");
	console.log("========================================\n");
}
