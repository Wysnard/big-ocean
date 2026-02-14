/**
 * Shared E2E constants — URLs, credentials, auth file paths.
 */

import { resolve } from "node:path";

export const API_URL = "http://localhost:4001";
export const FRONTEND_URL = "http://localhost:3001";

export const OWNER_USER = {
	email: "e2e-owner@test.bigocean.dev",
	password: "TestPassword123!",
	name: "E2E Owner",
} as const;

export const OTHER_USER = {
	email: "e2e-other@test.bigocean.dev",
	password: "TestPassword456!",
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
