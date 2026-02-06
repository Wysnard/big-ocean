import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");

async function globalTeardown(): Promise<void> {
	console.log("[global-teardown] Stopping Docker test containers...");

	execSync("docker compose -f compose.test.yaml down -v --remove-orphans", {
		cwd: PROJECT_ROOT,
		stdio: "inherit",
	});

	console.log("[global-teardown] Docker test containers stopped");
}

export default globalTeardown;
