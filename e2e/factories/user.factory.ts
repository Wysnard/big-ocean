/**
 * User Factory — creates and authenticates users via Playwright APIRequestContext.
 *
 * Cookies are automatically captured by the request context — no manual
 * Set-Cookie parsing required. Call `context.storageState()` to persist.
 */

import type { APIRequestContext } from "@playwright/test";

interface CreateUserInput {
	email: string;
	password: string;
	name: string;
	anonymousSessionId?: string;
}

/**
 * Sign up a new user via Better Auth email/password endpoint.
 * The response cookies are automatically stored in the APIRequestContext.
 */
export async function createUser(api: APIRequestContext, input: CreateUserInput): Promise<void> {
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
