/**
 * Login Page
 *
 * User authentication with Better Auth.
 * Redirects authenticated users to /assessment or /profile (AC #5).
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "../components/auth";
import { getSession } from "../lib/auth-client";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>) => ({
		sessionId: typeof search.sessionId === "string" ? search.sessionId : undefined,
		redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
	}),
	beforeLoad: async () => {
		const { data: session } = await getSession();
		if (session?.user) {
			throw redirect({ to: "/profile" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const { sessionId, redirectTo } = Route.useSearch();

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-md">
				<LoginForm anonymousSessionId={sessionId} redirectTo={redirectTo} />
			</div>
		</div>
	);
}
