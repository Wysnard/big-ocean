/**
 * Shared E2E constants — URLs, credentials, auth file paths.
 *
 * All external service config (Polar, Resend) comes from .env.e2e — no fallbacks.
 * If .env.e2e is missing or incomplete, global-setup.ts will fail fast.
 * Container-side defaults live in compose.e2e.yaml (AppConfig).
 */

import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env.e2e from project root — required for e2e tests
config({ path: resolve(import.meta.dirname, "../.env.e2e") });

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`[e2e-env] Missing required env var: ${name} — set it in .env.e2e`);
	}
	return value;
}

export const API_URL = "http://localhost:4001";
export const FRONTEND_URL = "http://localhost:3001";

/**
 * Polar.sh configuration for E2E tests.
 * All values read from .env.e2e — no fallbacks.
 */
export const POLAR_CONFIG = {
	webhookSecret: requireEnv("POLAR_WEBHOOK_SECRET"),
	productPortraitUnlock: requireEnv("POLAR_PRODUCT_PORTRAIT_UNLOCK"),
	productRelationshipSingle: requireEnv("POLAR_PRODUCT_RELATIONSHIP_SINGLE"),
	productRelationship5Pack: requireEnv("POLAR_PRODUCT_RELATIONSHIP_5PACK"),
	productExtendedConversation: requireEnv("POLAR_PRODUCT_EXTENDED_CONVERSATION"),
} as const;

const E2E_UID = randomBytes(4).toString("hex");

export const OWNER_USER = {
	email: `e2e-owner+${E2E_UID}@gmail.com`,
	password: "OceanDepth#Nerin42xQ",
	name: "E2E Owner",
};

export const OTHER_USER = {
	email: `e2e-other+${E2E_UID}@gmail.com`,
	password: "CoralReef$Trait78zW",
	name: "E2E Other",
};

const AUTH_DIR = resolve(import.meta.dirname, ".auth");

export const AUTH_FILES = {
	owner: resolve(AUTH_DIR, "owner.json"),
	otherUser: resolve(AUTH_DIR, "other-user.json"),
	testSession: resolve(AUTH_DIR, "test-session.json"),
} as const;

export const TEST_DB_CONFIG = {
	host: "localhost",
	port: 5433,
	database: "bigocean_test",
	user: "test_user",
	password: "test_password",
} as const;
