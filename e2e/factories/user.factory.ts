/**
 * User Factory — creates and authenticates users via Playwright APIRequestContext.
 *
 * Cookies are automatically captured by the request context — no manual
 * Set-Cookie parsing required. Call `context.storageState()` to persist.
 *
 * Since Story 31-7b (Wire Resend into Better Auth), signup requires email
 * verification before the user is authenticated. E2E tests bypass this by
 * directly marking the email as verified in the database, then signing in.
 */

import type { APIRequestContext } from "@playwright/test";
import pg from "pg";
import { TEST_DB_CONFIG } from "../e2e-env.js";

const { Pool } = pg;

interface CreateUserInput {
	email: string;
	password: string;
	name: string;
	anonymousSessionId?: string;
}

/**
 * Sign up a new user via Better Auth, auto-verify email, and sign in.
 *
 * With requireEmailVerification=true, signup alone does NOT establish auth
 * cookies. This helper:
 * 1. Signs up the user (creates unverified account + triggers hooks like session linking)
 * 2. Marks emailVerified=true directly in the database
 * 3. Signs in to establish auth cookies in the APIRequestContext
 */
export async function createUser(api: APIRequestContext, input: CreateUserInput): Promise<void> {
	// 1. Sign up — creates user, triggers Better Auth hooks (session linking, free credit)
	const res = await api.post("/api/auth/sign-up/email", {
		data: {
			email: input.email,
			password: input.password,
			name: input.name,
			...(input.anonymousSessionId && {
				anonymousSessionId: input.anonymousSessionId,
			}),
		},
	});

	if (!res.ok()) {
		const body = await res.text();
		throw new Error(`Sign-up failed (${res.status()}): ${body}`);
	}

	// 2. Auto-verify email in DB (bypass email verification for E2E)
	await verifyUserEmail(input.email);

	// 3. Sign in to establish auth cookies
	await signInUser(api, { email: input.email, password: input.password });
}

/**
 * Mark a user's email as verified directly in the database.
 * Bypasses the email verification flow for E2E testing.
 */
async function verifyUserEmail(email: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		await client.query(`UPDATE "user" SET "email_verified" = true WHERE "email" = $1`, [email]);
	} finally {
		client.release();
		await pool.end();
	}
}

/**
 * Mark a user's first visit as completed directly in the database.
 * Prevents the /today → /me redirect for E2E test users.
 */
export async function markFirstVisitCompleted(email: string): Promise<void> {
	const pool = new Pool(TEST_DB_CONFIG);
	const client = await pool.connect();

	try {
		await client.query(`UPDATE "user" SET "first_visit_completed" = true WHERE "email" = $1`, [
			email,
		]);
	} finally {
		client.release();
		await pool.end();
	}
}

/**
 * Sign in an existing user via Better Auth email/password endpoint.
 * The response cookies are automatically stored in the APIRequestContext.
 */
export async function signInUser(
	api: APIRequestContext,
	input: { email: string; password: string; anonymousSessionId?: string },
): Promise<void> {
	const res = await api.post("/api/auth/sign-in/email", {
		data: {
			email: input.email,
			password: input.password,
			...(input.anonymousSessionId && {
				anonymousSessionId: input.anonymousSessionId,
			}),
		},
	});

	if (!res.ok()) {
		const body = await res.text();
		throw new Error(`Sign-in failed (${res.status()}): ${body}`);
	}
}
