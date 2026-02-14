import { execSync } from "node:child_process";
import { resolve } from "node:path";

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

async function globalSetup(): Promise<void> {
	console.log("[global-setup] Starting Docker test containers...");

	execSync("docker compose -f compose.e2e.yaml up -d --build", {
		cwd: PROJECT_ROOT,
		stdio: "inherit",
	});

	console.log("[global-setup] Waiting for API health check...");
	await waitForHealth();
}

export default globalSetup;
