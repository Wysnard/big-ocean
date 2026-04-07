import { execSync } from "node:child_process";
import { resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");

async function globalTeardown(): Promise<void> {
	console.log("[global-teardown] Stopping Docker test containers...");

	execSync(
		"docker compose -p big-ocean-e2e -f compose.e2e.yaml down -v --remove-orphans --rmi local",
		{
			cwd: PROJECT_ROOT,
			stdio: "inherit",
		},
	);

	console.log("[global-teardown] Docker test containers stopped");
}

export default globalTeardown;
