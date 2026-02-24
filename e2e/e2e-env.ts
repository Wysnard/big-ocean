/**
 * Shared E2E constants — URLs, credentials, auth file paths.
 *
 * Polar.sh config is loaded from .env.e2e if present (for sandbox testing),
 * otherwise falls back to test placeholder values.
 */

import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env.e2e from project root if it exists
config({ path: resolve(import.meta.dirname, "../.env.e2e") });

export const API_URL = "http://localhost:4001";
export const FRONTEND_URL = "http://localhost:3001";

/**
 * Polar.sh configuration for E2E tests.
 * Uses sandbox credentials from .env.e2e if available, otherwise test placeholders.
 */
export const POLAR_CONFIG = {
	accessToken: process.env.POLAR_ACCESS_TOKEN ?? "not-configured",
	webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "test-webhook-secret-for-e2e",
	productPortraitUnlock: process.env.POLAR_PRODUCT_PORTRAIT_UNLOCK ?? "test-product-portrait",
	productRelationshipSingle: process.env.POLAR_PRODUCT_RELATIONSHIP_SINGLE ?? "test-product-single",
	productRelationship5Pack: process.env.POLAR_PRODUCT_RELATIONSHIP_5PACK ?? "test-product-5pack",
	productExtendedConversation:
		process.env.POLAR_PRODUCT_EXTENDED_CONVERSATION ?? "test-product-extended",
} as const;

export const OWNER_USER = {
	email: "e2e-owner@test.bigocean.dev",
	password: "OceanDepth#Nerin42xQ",
	name: "E2E Owner",
} as const;

export const OTHER_USER = {
	email: "e2e-other@test.bigocean.dev",
	password: "CoralReef$Trait78zW",
	name: "E2E Other",
} as const;

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
