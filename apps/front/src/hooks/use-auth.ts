/**
 * Auth Hooks
 *
 * Convenient hooks for authentication in React components.
 */

import type { Session, User } from "../lib/auth-client";
import { getSession, signIn, signOut, signUp, useSession } from "../lib/auth-client";

/**
 * Auth error with HTTP status code preserved from Better Auth response.
 * Allows consumers (e.g., login form) to distinguish 403 (email not verified)
 * from other auth errors.
 */
export class AuthError extends Error {
	readonly status: number | undefined;
	readonly code: string | undefined;

	constructor(message: string, status?: number, code?: string) {
		super(message);
		this.name = "AuthError";
		this.status = status;
		this.code = code;
	}
}

/**
 * Main Auth Hook
 *
 * Provides complete auth state and actions.
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, isPending, signIn, signUp, signOut } = useAuth();
 *
 * if (isPending) return <Loading />;
 * if (isAuthenticated) return <Dashboard user={user} />;
 * return <Login onSignIn={signIn} />;
 * ```
 */
export function useAuth() {
	const { data: session, isPending, error } = useSession();

	return {
		// Session data
		session,
		user: session?.user ?? null,
		isAuthenticated: !!session?.user,
		isPending,
		error,

		// Auth actions
		signIn: {
			email: async (email: string, password: string) => {
				const result = await signIn.email({
					email,
					password,
				});

				if (result.error) {
					throw new AuthError(
						result.error.message || "Sign in failed",
						result.error.status,
						result.error.code,
					);
				}

				return result.data;
			},
		},

		signUp: {
			email: async (email: string, password: string, name?: string, callbackURL?: string) => {
				const result = await signUp.email({
					email,
					password,
					name: name || email.split("@")[0],
					...(callbackURL !== undefined && { callbackURL }),
				});

				if (result.error) {
					throw new Error(result.error.message || "Sign up failed");
				}

				return result.data;
			},
		},

		signOut: async () => {
			await signOut();
			window.location.href = "/";
		},

		refreshSession: async () => {
			const result = await getSession();

			if (result.error) {
				throw new Error(result.error.message || "Failed to refresh session");
			}

			return result.data;
		},
	};
}

export type { Session, User };
