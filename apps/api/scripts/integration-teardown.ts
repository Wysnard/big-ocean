/**
 * Integration Test Global Teardown
 *
 * Runs AFTER all integration tests complete (even if tests fail).
 * Responsibilities:
 * 1. Stop Docker Compose services
 * 2. Remove volumes (clean slate for next run)
 * 3. Clean up orphaned containers
 *
 * Reference: Story 2.8 - Docker Setup for Integration Testing
 */

import { execSync } from "node:child_process";

/**
 * Execute shell command with logging
 */
function exec(command: string, options?: { silent?: boolean }): string {
	if (!options?.silent) {
		console.log(`[teardown] Running: ${command}`);
	}
	try {
		return execSync(command, {
			encoding: "utf-8",
			cwd: process.cwd(),
			stdio: options?.silent ? "pipe" : "inherit",
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[teardown] Command failed (continuing anyway): ${message}`);
		return "";
	}
}

/**
 * Global teardown function called by Vitest
 */
export default async function globalTeardown(): Promise<void> {
	console.log("\n========================================");
	console.log("[teardown] Integration Test Teardown Starting");
	console.log("========================================\n");

	// Change to project root (compose file location)
	const projectRoot = new URL("../../../", import.meta.url).pathname;
	process.chdir(projectRoot);
	console.log(`[teardown] Working directory: ${process.cwd()}`);

	// Step 1: Stop containers and remove volumes
	console.log("[teardown] Step 1: Stopping containers and removing volumes...");
	exec("docker compose -f compose.test.yaml down -v --remove-orphans");

	console.log("\n========================================");
	console.log("[teardown] Integration Test Teardown Complete!");
	console.log("========================================\n");
}
