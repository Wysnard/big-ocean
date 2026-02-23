/**
 * Auth Hooks
 *
 * Convenient hooks for authentication in React components.
 */

import type { Session, User } from "../lib/auth-client";
import { getSession, signIn, signOut, signUp, useSession } from "../lib/auth-client";

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
			email: async (email: string, password: string, anonymousSessionId?: string) => {
				const result = await signIn.email({
					email,
					password,
					...(anonymousSessionId && { anonymousSessionId }),
				});

				if (result.error) {
					throw new Error(result.error.message || "Sign in failed");
				}

				return result.data;
			},
		},

		signUp: {
			email: async (
				email: string,
				password: string,
				name?: string,
				anonymousSessionId?: string,
				callbackURL?: string,
			) => {
				const result = await signUp.email({
					email,
					password,
					name: name || email.split("@")[0],
					...(anonymousSessionId && { anonymousSessionId }),
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

/**
 * Require Auth Hook
 *
 * Redirects to login if not authenticated.
 * Use in protected routes.
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { user } = useRequireAuth();
 *   return <div>Welcome {user.email}</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo = "/login") {
	const { user, isAuthenticated, isPending } = useAuth();

	if (!isPending && !isAuthenticated && typeof window !== "undefined") {
		window.location.href = redirectTo;
	}

	return { user, isAuthenticated, isPending };
}

export type { Session, User };
