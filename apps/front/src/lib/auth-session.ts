/**
 * Server-side auth functions for TanStack Start SSR.
 *
 * Forwards incoming request cookies to the backend Better Auth API
 * so that session checks work during server-side rendering.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Get the current session during SSR by forwarding cookies to the backend.
 * Returns the session object or null if not authenticated.
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
	const cookie = getRequestHeader("cookie");

	if (!cookie) {
		return null;
	}

	const response = await fetch(`${API_URL}/api/auth/get-session`, {
		headers: { cookie },
	});

	if (!response.ok) {
		return null;
	}

	const session = await response.json();

	if (!session?.user) {
		return null;
	}

	return session as { user: { id: string; name: string; email: string }; session: { id: string } };
});
