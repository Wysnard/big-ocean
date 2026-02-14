/**
 * User Factory — creates and authenticates users via Better Auth API.
 */

import { API_URL } from "../e2e-env.js";

interface CreateUserInput {
	email: string;
	password: string;
	name: string;
	anonymousSessionId?: string;
}

interface AuthResult {
	setCookieHeaders: string[];
}

/**
 * Sign up a new user via Better Auth email/password endpoint.
 * Optionally links an anonymous assessment session during signup.
 */
export async function createUser(input: CreateUserInput): Promise<AuthResult> {
	const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			email: input.email,
			password: input.password,
			name: input.name,
			...(input.anonymousSessionId && {
				anonymousSessionId: input.anonymousSessionId,
			}),
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Sign-up failed (${res.status}): ${body}`);
	}

	const setCookieHeaders = res.headers.getSetCookie();
	return { setCookieHeaders };
}

/**
 * Sign in an existing user via Better Auth email/password endpoint.
 */
export async function signInUser(input: {
	email: string;
	password: string;
	anonymousSessionId?: string;
}): Promise<AuthResult> {
	const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			email: input.email,
			password: input.password,
			...(input.anonymousSessionId && {
				anonymousSessionId: input.anonymousSessionId,
			}),
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Sign-in failed (${res.status}): ${body}`);
	}

	const setCookieHeaders = res.headers.getSetCookie();
	return { setCookieHeaders };
}
