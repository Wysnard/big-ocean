import { execSync } from "node:child_process";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");

async function globalTeardown(): Promise<void> {
	console.log("[global-teardown] Stopping Docker test containers...");

	execSync("docker compose -f compose.e2e.yaml down -v --remove-orphans", {
		cwd: PROJECT_ROOT,
		stdio: "inherit",
	});

	// Remove the cached image so the next run rebuilds with latest code
	try {
		execSync("docker rmi big-ocean-api-e2e", { cwd: PROJECT_ROOT, stdio: "inherit" });
		console.log("[global-teardown] Removed big-ocean-api-e2e image");
	} catch {
		// Image may not exist — ignore
	}

	console.log("[global-teardown] Docker test containers stopped");
}

export default globalTeardown;
