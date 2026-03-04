/**
 * Better Auth Client Configuration
 *
 * Frontend client for Better Auth authentication.
 * Connects to the Express backend at /api/auth/*
 */

import { polarClient } from "@polar-sh/better-auth/client";
import { createAuthClient } from "better-auth/react";

/**
 * Auth Client Instance
 *
 * Automatically handles:
 * - Session management
 * - Cookie handling
 * - CSRF protection
 * - Request/response formatting
 * - Polar checkout (via polarClient plugin)
 */
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
	plugins: [polarClient()],
});

/**
 * Auth Actions
 *
 * Pre-configured auth methods for use in components.
 */
export const {
	signUp,
	signIn,
	signOut,
	useSession,
	getSession,
	updateUser,
	changeEmail,
	changePassword,
	resetPassword,
	sendVerificationEmail,
	verifyEmail,
} = authClient;

/**
 * Type-safe Session Hook
 *
 * Usage:
 * ```tsx
 * const { data: session, isPending, error } = useSession();
 *
 * if (session) {
 *   console.log(session.user.email);
 * }
 * ```
 */
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
